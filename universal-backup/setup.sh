#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Setup script — run once on VPS to install deps and cron jobs
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="/www/wwwroot/universal-backup"
SCRIPT="$BACKUP_DIR/backup.sh"

echo "=== Universal Backup Setup ==="

# 1. Install AWS CLI if not present
if ! command -v aws &>/dev/null; then
  echo "Installing AWS CLI..."
  cd /tmp
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -qo awscliv2.zip
  ./aws/install --update
  rm -rf aws awscliv2.zip
  echo "AWS CLI installed: $(aws --version)"
else
  echo "AWS CLI already installed: $(aws --version)"
fi

# 2. Make script executable
chmod +x "$SCRIPT"
echo "Script ready: $SCRIPT"

# 3. Test R2 connectivity
echo "Testing R2 connection..."
export AWS_ACCESS_KEY_ID="0fc9d2445a014860740a5cca8d11fb5b"
export AWS_SECRET_ACCESS_KEY="979d16f5350049c610318ac1e41f84ad21fc73e5be8c9fc09fb36b4a3134b5dd"
export AWS_DEFAULT_REGION="auto"

if aws s3 ls s3://chineseanimebucket/ --endpoint-url "https://fc785704aff7d46c9e4e4458d18bba99.r2.cloudflarestorage.com" &>/dev/null; then
  echo "R2 connection OK"
else
  echo "ERROR: R2 connection failed — check credentials"
  exit 1
fi

# 4. Test mysqldump
echo "Testing MySQL connection..."
if mysqldump -u root -p'422b96a53a063ec1' -h 127.0.0.1 --single-transaction --no-data anime_downloader >/dev/null 2>&1; then
  echo "MySQL connection OK"
else
  echo "ERROR: MySQL connection failed"
  exit 1
fi

# 5. Create log file
touch /var/log/universal-backup.log
echo "Log file: /var/log/universal-backup.log"

# 6. Setup cron jobs
# Daily at 12:30 PM IST (7:00 AM UTC)
# Weekly on Sunday at 1:00 PM IST (7:30 AM UTC)
CRON_DAILY="0 7 * * * $SCRIPT daily >> /var/log/universal-backup.log 2>&1"
CRON_WEEKLY="30 7 * * 0 $SCRIPT weekly >> /var/log/universal-backup.log 2>&1"

# Remove old entries if any, then add new
(crontab -l 2>/dev/null | grep -v "universal-backup" || true; echo "$CRON_DAILY"; echo "$CRON_WEEKLY") | crontab -

echo ""
echo "=== Cron jobs installed ==="
echo "Daily:  Every day at 12:30 PM IST (7:00 AM UTC)"
echo "Weekly: Every Sunday at 1:00 PM IST (7:30 AM UTC)"
echo ""
crontab -l | grep "universal-backup"
echo ""
echo "=== Setup complete ==="
echo "Run a test: $SCRIPT daily"
