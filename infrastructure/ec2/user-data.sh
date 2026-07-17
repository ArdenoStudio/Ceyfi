#!/bin/bash
# CEYFI backend — EC2 bootstrap (Amazon Linux 2023)
# Installs Docker + Caddy, pulls the backend image from ECR, fetches secrets
# from Secrets Manager, and runs both as systemd-managed services.
set -euo pipefail

REGION="ap-southeast-1"
ACCOUNT_ID="308324916290"
ECR_REPO="ceyfi-backend"
IMAGE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
# No registered domain for ceyfi.app yet — sslip.io resolves "<ip>.sslip.io" to
# the embedded IP automatically, giving Caddy a real, publicly resolvable
# hostname (and therefore a valid Let's Encrypt cert) with zero DNS setup.
# Swap this for a real domain later if one gets registered.
DOMAIN="18.140.175.136.sslip.io"

dnf install -y docker
systemctl enable --now docker

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
docker pull "$IMAGE"

get_secret() {
  aws secretsmanager get-secret-value --region "$REGION" --secret-id "$1" --query SecretString --output text
}

ENV_FILE="/etc/ceyfi-backend.env"
cat > "$ENV_FILE" <<EOF
PYTHONUNBUFFERED=1
USE_SEYLAN_REAL=false
CORS_ORIGINS=http://localhost:3000,http://localhost:3003,http://localhost:3005,https://frontend-taupe-three-96.vercel.app,https://ceyfi.app
FRONTEND_BASE_URL=https://frontend-taupe-three-96.vercel.app
MPGS_API_VERSION=62
MPGS_ENABLE=true
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
DATABASE_URL=$(get_secret ceyfi/database-url)
GROQ_API_KEY=$(get_secret ceyfi/groq-api-key)
DEMO_SESSION_SECRET=$(get_secret ceyfi/demo-session-secret)
DEMO_ADMIN_KEY=$(get_secret ceyfi/demo-admin-key)
MPGS_MERCHANT_ID=$(get_secret ceyfi/mpgs-merchant-id)
MPGS_API_PASSWORD=$(get_secret ceyfi/mpgs-api-password)
EOF
chmod 600 "$ENV_FILE"

docker rm -f ceyfi-backend 2>/dev/null || true
docker run -d \
  --name ceyfi-backend \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 127.0.0.1:8080:8080 \
  "$IMAGE"

# --- Caddy (reverse proxy + automatic HTTPS via Let's Encrypt) ---
ARCH="amd64"
curl -sSL "https://caddyserver.com/api/download?os=linux&arch=${ARCH}" -o /usr/local/bin/caddy
chmod +x /usr/local/bin/caddy

mkdir -p /etc/caddy
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
  reverse_proxy 127.0.0.1:8080
}
EOF

cat > /etc/systemd/system/caddy.service <<'EOF'
[Unit]
Description=Caddy reverse proxy
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/caddy run --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now caddy

# --- Auto-redeploy on new image (polls ECR digest every 2 min, no extra infra needed) ---
cat > /usr/local/bin/ceyfi-redeploy-check.sh <<EOSCRIPT
#!/bin/bash
set -euo pipefail
REGION="ap-southeast-1"
IMAGE="${IMAGE}"
aws ecr get-login-password --region "\$REGION" \\
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com" >/dev/null
LOCAL_DIGEST="\$(docker inspect --format='{{index .RepoDigests 0}}' ceyfi-backend 2>/dev/null || echo none)"
docker pull "\$IMAGE" >/dev/null
REMOTE_DIGEST="\$(docker inspect --format='{{index .RepoDigests 0}}' "\$IMAGE" 2>/dev/null || echo none)"
if [ "\$LOCAL_DIGEST" != "\$REMOTE_DIGEST" ]; then
  echo "New image detected, redeploying..."
  docker rm -f ceyfi-backend || true
  docker run -d --name ceyfi-backend --restart unless-stopped --env-file /etc/ceyfi-backend.env -p 127.0.0.1:8080:8080 "\$IMAGE"
fi
EOSCRIPT
chmod +x /usr/local/bin/ceyfi-redeploy-check.sh

cat > /etc/systemd/system/ceyfi-redeploy.timer <<'EOF'
[Unit]
Description=Check for new CEYFI backend image every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
EOF

cat > /etc/systemd/system/ceyfi-redeploy.service <<'EOF'
[Unit]
Description=Redeploy CEYFI backend if a new image is available

[Service]
Type=oneshot
ExecStart=/usr/local/bin/ceyfi-redeploy-check.sh
EOF

systemctl daemon-reload
systemctl enable --now ceyfi-redeploy.timer
