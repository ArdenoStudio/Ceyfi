# CEYFI AWS — Manual Setup Steps

Complete these steps once before the first deploy. No real secrets belong in git.

## Current live setup: EC2 + Caddy

The AWS account is on the **Free Plan** (credits-based), which blocks App Runner
(`SubscriptionRequiredException` regardless of credit balance — it's a service
allowlist, not a spend limit). EC2 is allowed on the Free Plan, so the backend
runs there instead: a single `t3.micro` instance running the Docker container,
fronted by [Caddy](https://caddyserver.com) for automatic HTTPS (Let's Encrypt),
no load balancer needed.

Live resources (region `ap-southeast-1`, account `308324916290`):

| Resource | Value |
|---|---|
| EC2 instance | `i-0e92a119fd4133b44` (`t3.micro`, tag `Name=ceyfi-backend`) |
| Elastic IP | `18.140.175.136` |
| Security group | `sg-07b931571ba0aad78` (80/443 only, no SSH — use SSM Session Manager) |
| IAM instance role | `ceyfi-ec2-instance-role` (ECR pull + Secrets Manager read) |
| Budget alert | `ceyfi-monthly-cap`, $30/month cap, email at 50/80/100% |

**Domain:** `ceyfi.app` isn't actually registered anywhere yet (it doesn't
resolve at all — no A record, no nameservers). Rather than wait on a domain
purchase, the backend uses **https://18.140.175.136.sslip.io** —
[sslip.io](https://sslip.io) resolves `<ip>.sslip.io` back to the embedded IP
automatically, so Caddy gets a real, publicly resolvable hostname (and a valid
Let's Encrypt cert) with zero DNS setup. Verified working end-to-end with a
trusted cert. If `ceyfi.app` gets registered later, swap `DOMAIN` in
`infrastructure/ec2/user-data.sh`, update `/etc/caddy/Caddyfile` on the
instance, and reload Caddy — no other changes needed.

New images pushed to the `:latest` ECR tag are picked up automatically —
`ceyfi-redeploy.timer` on the instance polls every 2 minutes and redeploys the
container if the digest changed (see `infrastructure/ec2/user-data.sh`).

To rebuild the instance from scratch (e.g. after termination), the exact steps
that worked are captured in `infrastructure/ec2/user-data.sh` as EC2 user-data —
launch a fresh `t3.micro` with that file as user-data, the
`ceyfi-ec2-instance-profile` instance profile, and the security group above.

---

## Alternate path: AWS App Runner (blocked until plan upgrade)

App Runner gives a managed HTTPS endpoint with no server to patch, and is
already fully scaffolded (`infrastructure/apprunner/service-config.json`,
`infrastructure/scripts/bootstrap.sh`). It just needs the AWS account upgraded
off the Free Plan first. The steps below are for that path, once you're ready.

## Prerequisites

- AWS account with admin or equivalent IAM access
- AWS CLI v2 configured (`aws configure`)
- Docker installed locally (for the first image push — App Runner needs the image to exist before the service can be created)
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
- IAM role `ceyfi-apprunner-ecr-access-role` (lets App Runner pull the image)
- IAM role `ceyfi-apprunner-instance-role` (lets the running container read secrets)
- Secrets Manager placeholders under `ceyfi/*`

It will **not** create the App Runner service yet — App Runner validates the image exists at creation time, so there's nothing to point it at. It prints the docker build/push commands to run next.

---

## Step 2 — Push the first image

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-southeast-1

aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker build -t ceyfi-backend backend/
docker tag ceyfi-backend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/ceyfi-backend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/ceyfi-backend:latest
```

---

## Step 3 — Populate Secrets Manager

In AWS Console → Secrets Manager (region **ap-southeast-1**), update each secret with the real value:

| Secret name | Env var injected into container |
|-------------|----------------------------------|
| `ceyfi/database-url` | `DATABASE_URL` (Neon Postgres connection string) |
| `ceyfi/groq-api-key` | `GROQ_API_KEY` |
| `ceyfi/demo-session-secret` | `DEMO_SESSION_SECRET` |
| `ceyfi/demo-admin-key` | `DEMO_ADMIN_KEY` |
| `ceyfi/mpgs-merchant-id` | `MPGS_MERCHANT_ID` |
| `ceyfi/mpgs-api-password` | `MPGS_API_PASSWORD` |

CLI example:

```bash
aws secretsmanager put-secret-value \
  --secret-id ceyfi/groq-api-key \
  --secret-string "gsk_..." \
  --region ap-southeast-1
```

Repeat for each secret. Never commit secret values to git.

This list mirrors what's actually set on the current production backend. If you later turn on features that aren't live yet (ElevenLabs TTS, the Telegram bot, PayHere, real Seylan integration), add matching secrets and wire them into `infrastructure/apprunner/service-config.json` under `RuntimeEnvironmentSecrets`.

---

## Step 4 — Create the App Runner service

Re-run bootstrap now that an image exists:

```bash
./infrastructure/scripts/bootstrap.sh
```

It detects the `:latest` image in ECR and calls `aws apprunner create-service` using `infrastructure/apprunner/service-config.json` (with `ACCOUNT_ID` substituted). First deploy takes a few minutes.

---

## Step 5 — GitHub Actions secrets

In GitHub → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key with ECR push + App Runner deploy permissions |
| `AWS_SECRET_ACCESS_KEY` | Matching secret key |

**Variables** (optional — deploy skipped until set):

| Variable | Value |
|----------|-------|
| `AWS_DEPLOY_ENABLED` | `true` — enable only after Steps 1–4 are done |

Until `AWS_DEPLOY_ENABLED` is `true`, `deploy.yml` runs backend tests but **skips** the App Runner deploy job (safe without AWS credentials).

Recommended IAM policy scope: ECR push, `apprunner:StartDeployment` / `apprunner:DescribeService` / `apprunner:ListServices` on the `ceyfi-backend` service.

---

## Step 6 — Get the service URL

```bash
aws apprunner list-services --region ap-southeast-1 \
  --query "ServiceSummaryList[?ServiceName=='ceyfi-backend'].ServiceUrl" --output text
```

Verify health:

```bash
curl https://YOUR_SERVICE_URL/health
# Expected: {"status":"ok","service":"ceyfi-backend"}
```

App Runner gives you an HTTPS URL on `*.awsapprunner.com` automatically — no ALB or ACM cert needed.

---

## Step 7 — Wire frontend to the App Runner backend

In Vercel (or your frontend host), set:

```env
NEXT_PUBLIC_API_BASE=https://YOUR_SERVICE_URL
```

See `frontend/.env.production.example` for the full production env template, and `DEPLOYMENT.md` for the current canonical backend URL — update that doc once you've cut traffic over.

`CORS_ORIGINS` on the App Runner service (`infrastructure/apprunner/service-config.json`) already includes the live Vercel frontend and `ceyfi.app`; add any new frontend origin there and redeploy if needed.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `create-service` fails immediately | Image tag `:latest` must already exist in ECR (Step 2 before Step 4) |
| Service stuck in `CREATE_FAILED` | `aws apprunner list-operations --service-arn ...` for the failure reason; usually a bad env var or missing secret |
| `AccessDeniedException` reading secrets | Instance role `ceyfi-apprunner-instance-role` needs `secretsmanager:GetSecretValue` on `ceyfi/*` (bootstrap sets this) |
| Image pull fails | ECR access role `ceyfi-apprunner-ecr-access-role` must have `AWSAppRunnerServicePolicyForECRAccess` attached |
| Health check failing | Container listens on port 8080 (Dockerfile default); `/health` must return 200 |
| GitHub deploy fails with "service not found" | Run Steps 1–4 manually first — CI only deploys an already-existing service, it doesn't create one |

---

## Cost note

App Runner bills per vCPU/memory-second while running plus a small provisioned-capacity charge, no separate load balancer cost. Pause billing by deleting the service when not needed:

```bash
aws apprunner delete-service --service-arn $(aws apprunner list-services --region ap-southeast-1 \
  --query "ServiceSummaryList[?ServiceName=='ceyfi-backend'].ServiceArn" --output text) --region ap-southeast-1
```

Re-run `infrastructure/scripts/bootstrap.sh` to recreate it later (image and secrets are unaffected by deleting the service).
