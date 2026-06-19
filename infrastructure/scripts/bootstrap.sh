#!/usr/bin/env bash
# Bootstrap AWS resources for CEYFI backend on ECS Fargate.
# Run once per AWS account/region. Requires AWS CLI v2 and appropriate IAM permissions.
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
CLUSTER_NAME="${ECS_CLUSTER:-ceyfi-cluster}"
SERVICE_NAME="${ECS_SERVICE:-ceyfi-backend-service}"
ECR_REPO="${ECR_REPOSITORY:-ceyfi-backend}"
LOG_GROUP="/ecs/ceyfi-backend"
EXECUTION_ROLE="ceyfi-ecs-execution-role"
TASK_ROLE="ceyfi-ecs-task-role"
SG_NAME="ceyfi-backend-sg"

echo "==> CEYFI AWS bootstrap (region: $REGION)"

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

# --- CloudWatch log group ---
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$REGION" \
  | grep -q "\"logGroupName\": \"$LOG_GROUP\""; then
  echo "==> Log group '$LOG_GROUP' already exists"
else
  echo "==> Creating log group '$LOG_GROUP'"
  aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$REGION"
  aws logs put-retention-policy --log-group-name "$LOG_GROUP" --retention-in-days 14 --region "$REGION"
fi

# --- IAM trust policy for ECS tasks ---
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

# --- Execution role (pull images, write logs, read secrets) ---
if aws iam get-role --role-name "$EXECUTION_ROLE" >/dev/null 2>&1; then
  echo "==> Execution role '$EXECUTION_ROLE' already exists"
else
  echo "==> Creating execution role '$EXECUTION_ROLE'"
  aws iam create-role \
    --role-name "$EXECUTION_ROLE" \
    --assume-role-policy-document "$TRUST_POLICY"
  aws iam attach-role-policy \
    --role-name "$EXECUTION_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  aws iam put-role-policy \
    --role-name "$EXECUTION_ROLE" \
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

# --- Task role (runtime AWS API access) ---
if aws iam get-role --role-name "$TASK_ROLE" >/dev/null 2>&1; then
  echo "==> Task role '$TASK_ROLE' already exists"
else
  echo "==> Creating task role '$TASK_ROLE'"
  aws iam create-role \
    --role-name "$TASK_ROLE" \
    --assume-role-policy-document "$TRUST_POLICY"
fi

# --- Secrets Manager placeholders (populate values manually — see MANUAL_STEPS.md) ---
SECRETS=(
  "ceyfi/groq-api-key"
  "ceyfi/elevenlabs-api-key"
  "ceyfi/telegram-bot-token"
  "ceyfi/supabase-url"
  "ceyfi/supabase-service-key"
  "ceyfi/payhere-merchant-id"
  "ceyfi/payhere-secret"
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

# --- ECS cluster ---
if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" \
  | grep -q "\"status\": \"ACTIVE\""; then
  echo "==> ECS cluster '$CLUSTER_NAME' already exists"
else
  echo "==> Creating ECS cluster '$CLUSTER_NAME'"
  aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION"
fi

# --- Security group (allow inbound 8000) ---
VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "$REGION")"
SG_ID="$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || echo "None")"

if [[ "$SG_ID" == "None" || -z "$SG_ID" ]]; then
  echo "==> Creating security group '$SG_NAME'"
  SG_ID="$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "CEYFI backend ECS tasks" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text --region "$REGION")"
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 8000 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"
else
  echo "==> Security group '$SG_NAME' already exists ($SG_ID)"
fi

# --- Substitute ACCOUNT_ID in task definition and register ---
TASK_DEF_FILE="$(cd "$(dirname "$0")/.." && pwd)/ecs/task-definition.json"
RENDERED_TASK_DEF="/tmp/ceyfi-task-definition.json"
sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" "$TASK_DEF_FILE" > "$RENDERED_TASK_DEF"

echo "==> Registering ECS task definition"
TASK_DEF_ARN="$(aws ecs register-task-definition \
  --cli-input-json "file://${RENDERED_TASK_DEF}" \
  --region "$REGION" \
  --query 'taskDefinition.taskDefinitionArn' --output text)"

# --- ECS service (Fargate, public IP) ---
SUBNETS="$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=default-for-az,Values=true" \
  --query 'Subnets[*].SubnetId' --output text --region "$REGION" | tr '\t' ',')"

if aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION" \
  | grep -q "\"status\": \"ACTIVE\""; then
  echo "==> ECS service '$SERVICE_NAME' already exists"
else
  echo "==> Creating ECS service '$SERVICE_NAME'"
  aws ecs create-service \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --region "$REGION"
fi

echo ""
echo "Bootstrap complete."
echo "  Account ID : $ACCOUNT_ID"
echo "  Region     : $REGION"
echo "  ECR repo   : ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"
echo "  Cluster    : $CLUSTER_NAME"
echo "  Service    : $SERVICE_NAME"
echo ""
echo "Next steps:"
echo "  1. Populate secrets in AWS Secrets Manager (see infrastructure/MANUAL_STEPS.md)"
echo "  2. Replace ACCOUNT_ID in infrastructure/ecs/task-definition.json with $ACCOUNT_ID"
echo "  3. Add GitHub secrets AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
echo "  4. Push to main to trigger deploy, or build/push manually:"
echo "     aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
echo "     docker build -t ${ECR_REPO} backend/"
echo "     docker tag ${ECR_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
echo "     docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
