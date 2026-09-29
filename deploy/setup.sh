#!/usr/bin/env bash
# First-time setup on a fresh Debian/Ubuntu box. Run as root.
#
#   scp -r . root@your-server:/srv/terminal
#   ssh root@your-server 'bash /srv/terminal/deploy/setup.sh'
#
# Idempotent: safe to run again.

set -euo pipefail

APP_DIR=/srv/terminal
ENV_FILE=/etc/terminal.env
NODE_MAJOR=20

echo "==> Node"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> service user"
id -u terminal >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin terminal

echo "==> build"
cd "$APP_DIR"
npm ci
npm run build
chown -R terminal:terminal "$APP_DIR"

echo "==> secrets"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# Credentials for Regulatory Terminal.
# Leave blank to run open; set both to require a login.
AUTH_USER=
AUTH_PASS=
EOF
  echo "    created $ENV_FILE — fill it in, then: systemctl restart terminal"
fi
chown root:terminal "$ENV_FILE"
chmod 640 "$ENV_FILE"

echo "==> service"
cp "$APP_DIR/deploy/regulatory-terminal.service" /etc/systemd/system/regulatory-terminal.service
systemctl daemon-reload
systemctl enable terminal
systemctl restart terminal
sleep 2
systemctl --no-pager --lines=10 status terminal || true

echo
echo "==> health"
curl -fsS http://127.0.0.1:8080/healthz && echo
echo
echo "Done. Terminal is on 127.0.0.1:8080."
echo "Put nginx in front (deploy/regulatory-terminal.nginx.conf) and run certbot for TLS."
