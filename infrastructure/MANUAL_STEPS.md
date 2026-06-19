# CEYFI AWS — Manual Setup Steps

Complete these steps once before the first ECS deploy. No real secrets belong in git.

## Prerequisites

- AWS account with admin or equivalent IAM access
- AWS CLI v2 configured (`aws configure`)
- Docker installed locally (optional, for manual image push)
- GitHub repo admin access (for Actions secrets)

Default region: **ap-southeast-1** (Singapore). Override with `export AWS_REGION=...` if needed.

---

## Step 1 — Run bootstrap script

```bash
chmod +x infrastructure/scripts/bootstrap.sh
./infrastructure/scripts/bootstrap.sh
```

This creates:

- ECR repository `ceyfi-backend`
- CloudWatch log group `/ecs/ceyfi-backend`
- IAM roles `ceyfi-ecs-execution-role`, `ceyfi-ecs-task-role`
- Secrets Manager placeholders under `ceyfi/*`
- ECS cluster `ceyfi-cluster`
- Security group allowing TCP 8000
- ECS Fargate service `ceyfi-backend-service` with public IP

Note the **Account ID** printed at the end.

---

## Step 2 — Replace ACCOUNT_ID in task definition

Edit `infrastructure/ecs/task-definition.json` and replace every `ACCOUNT_ID` with your 12-digit AWS account ID (bootstrap prints it).

Commit this change — placeholders must not remain in the repo when deploying.

---

## Step 3 — Populate Secrets Manager

In AWS Console → Secrets Manager (region **ap-southeast-1**), update each secret with the real value:

| Secret name | Env var injected into container |
|-------------|----------------------------------|
| `ceyfi/groq-api-key` | `GROQ_API_KEY` |
| `ceyfi/elevenlabs-api-key` | `ELEVENLABS_API_KEY` |
| `ceyfi/telegram-bot-token` | `TELEGRAM_BOT_TOKEN` |
| `ceyfi/supabase-url` | `SUPABASE_URL` |
| `ceyfi/supabase-service-key` | `SUPABASE_SERVICE_KEY` |
| `ceyfi/payhere-merchant-id` | `PAYHERE_MERCHANT_ID` |
| `ceyfi/payhere-secret` | `PAYHERE_SECRET` |

CLI example:

```bash
aws secretsmanager put-secret-value \
  --secret-id ceyfi/groq-api-key \
  --secret-string "gsk_..." \
  --region ap-southeast-1
```

Repeat for each secret. Never commit secret values to git.

---

## Step 4 — GitHub Actions secrets

In GitHub → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key with ECR + ECS deploy permissions |
| `AWS_SECRET_ACCESS_KEY` | Matching secret key |

Recommended IAM policy scope: ECR push, ECS `RegisterTaskDefinition` / `UpdateService`, `PassRole` on the two CEYFI ECS roles, and `secretsmanager:GetSecretValue` on `ceyfi/*`.

---

## Step 5 — First deploy

Push to `main` (with changes under `backend/` or `infrastructure/`). The workflow `.github/workflows/deploy.yml` will:

1. Build the backend Docker image
2. Push to ECR
3. Render and deploy the ECS task definition
4. Wait for service stability

Or deploy manually:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-southeast-1

aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker build -t ceyfi-backend backend/
docker tag ceyfi-backend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/ceyfi-backend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/ceyfi-backend:latest

aws ecs update-service \
  --cluster ceyfi-cluster \
  --service ceyfi-backend-service \
  --force-new-deployment \
  --region $REGION
```

---

## Step 6 — Get the public IP

```bash
TASK_ARN=$(aws ecs list-tasks --cluster ceyfi-cluster --service-name ceyfi-backend-service \
  --query 'taskArns[0]' --output text --region ap-southeast-1)

ENI=$(aws ecs describe-tasks --cluster ceyfi-cluster --tasks $TASK_ARN \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text --region ap-southeast-1)

aws ec2 describe-network-interfaces --network-interface-ids $ENI \
  --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region ap-southeast-1
```

Verify health:

```bash
curl http://YOUR_ECS_PUBLIC_IP:8000/health
# Expected: {"status":"ok","service":"ceyfi-backend"}
```

---

## Step 7 — Wire frontend to ECS backend

In Vercel (or your frontend host), set:

```env
NEXT_PUBLIC_API_URL=http://YOUR_ECS_PUBLIC_IP:8000
```

See `frontend/.env.production.example` for the full production env template.

Also update backend `CORS_ORIGINS` in the ECS task definition (or via environment override) to include your frontend URL.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Task fails to start | CloudWatch logs at `/ecs/ceyfi-backend` |
| `CannotPullContainerError` | ECR image exists; execution role has ECR permissions |
| Secret injection fails | Secret ARNs in task definition match account/region; execution role can read `ceyfi/*` |
| Health check failing | Container port 8000; security group allows inbound 8000 |
| GitHub deploy fails | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` set; `ACCOUNT_ID` replaced in task definition |

---

## Cost note

Fargate (512 CPU / 1024 MB, 1 task) plus public IP incurs ongoing charges. Stop the service when not needed:

```bash
aws ecs update-service --cluster ceyfi-cluster --service ceyfi-backend-service --desired-count 0 --region ap-southeast-1
```
