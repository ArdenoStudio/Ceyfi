#!/usr/bin/env bash
# Bootstrap AWS resources for CEYFI backend on App Runner.
# Run once per AWS account/region. Requires AWS CLI v2 and appropriate IAM permissions.
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
ECR_REPO="${ECR_REPOSITORY:-ceyfi-backend}"
SERVICE_NAME="${APPRUNNER_SERVICE:-ceyfi-backend}"
ECR_ACCESS_ROLE="ceyfi-apprunner-ecr-access-role"
INSTANCE_ROLE="ceyfi-apprunner-instance-role"

echo "==> CEYFI AWS bootstrap — App Runner (region: $REGION)"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "    Account ID: $ACCOUNT_ID"

# --- ECR repository ---
if aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$REGION" >/dev/null 2>&1; then
  echo "==> ECR repo '$ECR_REPO' already exists"
else
  echo "==> Creating ECR repo '$ECR_REPO'"
  aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --image-scanning-configuration scanOnPush=true \
    --region "$REGION"
fi

# --- ECR access role (lets App Runner pull the private image at deploy time) ---
ECR_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "build.apprunner.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

if aws iam get-role --role-name "$ECR_ACCESS_ROLE" >/dev/null 2>&1; then
  echo "==> ECR access role '$ECR_ACCESS_ROLE' already exists"
else
  echo "==> Creating ECR access role '$ECR_ACCESS_ROLE'"
  aws iam create-role \
    --role-name "$ECR_ACCESS_ROLE" \
    --assume-role-policy-document "$ECR_TRUST_POLICY"
  aws iam attach-role-policy \
    --role-name "$ECR_ACCESS_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
fi

# --- Instance role (runtime — lets the running container read Secrets Manager values) ---
INSTANCE_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "tasks.apprunner.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

if aws iam get-role --role-name "$INSTANCE_ROLE" >/dev/null 2>&1; then
  echo "==> Instance role '$INSTANCE_ROLE' already exists"
else
  echo "==> Creating instance role '$INSTANCE_ROLE'"
  aws iam create-role \
    --role-name "$INSTANCE_ROLE" \
    --assume-role-policy-document "$INSTANCE_TRUST_POLICY"
  aws iam put-role-policy \
    --role-name "$INSTANCE_ROLE" \
    --policy-name ceyfi-secrets-read \
    --policy-document "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Action\": [\"secretsmanager:GetSecretValue\"],
        \"Resource\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:ceyfi/*\"
      }]
    }"
fi

# --- Secrets Manager placeholders (populate values manually — see MANUAL_STEPS.md) ---
SECRETS=(
  "ceyfi/database-url"
  "ceyfi/groq-api-key"
  "ceyfi/demo-session-secret"
  "ceyfi/demo-admin-key"
  "ceyfi/mpgs-merchant-id"
  "ceyfi/mpgs-api-password"
)

for SECRET_NAME in "${SECRETS[@]}"; do
  if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "==> Secret '$SECRET_NAME' already exists"
  else
    echo "==> Creating placeholder secret '$SECRET_NAME'"
    aws secretsmanager create-secret \
      --name "$SECRET_NAME" \
      --description "CEYFI backend — populate via MANUAL_STEPS.md" \
      --secret-string "REPLACE_ME" \
      --region "$REGION"
  fi
done

echo "==> Waiting for IAM role propagation (10s)"
sleep 10

# --- App Runner service ---
EXISTING_ARN="$(aws apprunner list-services --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text)"

if [[ -n "$EXISTING_ARN" ]]; then
  echo "==> App Runner service '$SERVICE_NAME' already exists ($EXISTING_ARN)"
  echo "    It redeploys automatically on every push to the ':latest' ECR tag."
else
  echo "==> No App Runner service yet."
  IMAGE_EXISTS="$(aws ecr describe-images --repository-name "$ECR_REPO" --region "$REGION" \
    --query "imageDetails[?contains(imageTags, 'latest')]" --output text 2>/dev/null || true)"
  if [[ -z "$IMAGE_EXISTS" ]]; then
    echo "    Skipping service creation — push an initial image to ECR first, then re-run this script:"
    echo "      aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
    echo "      docker build -t ${ECR_REPO} backend/"
    echo "      docker tag ${ECR_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
    echo "      docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
  else
    echo "==> Creating App Runner service '$SERVICE_NAME'"
    SERVICE_CONFIG_FILE="$(cd "$(dirname "$0")/.." && pwd)/apprunner/service-config.json"
    RENDERED_CONFIG="/tmp/ceyfi-apprunner-service.json"
    sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" "$SERVICE_CONFIG_FILE" > "$RENDERED_CONFIG"
    aws apprunner create-service --cli-input-json "file://${RENDERED_CONFIG}" --region "$REGION"
  fi
fi

echo ""
echo "Bootstrap complete."
echo "  Account ID : $ACCOUNT_ID"
echo "  Region     : $REGION"
echo "  ECR repo   : ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"
echo ""
echo "Next steps:"
echo "  1. Populate secrets in AWS Secrets Manager (see infrastructure/MANUAL_STEPS.md)"
echo "  2. If the service wasn't created above, push an image then re-run this script"
echo "  3. Add GitHub secrets AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
echo "  4. Set the AWS_DEPLOY_ENABLED=true repository variable in GitHub to turn on CI deploys"
