#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Universal Database Backup → Cloudflare R2
# Daily at 12:30 PM IST | Weekly on Sunday 1:00 PM IST
#
# Safety features:
#   - Validates dump size (> min threshold) before upload
#   - Validates gzip integrity before upload
#   - Never overwrites existing R2 backups (unique timestamp)
#   - Skips cleanup if current backup batch had ANY failures
#   - Verifies R2 upload by checking file exists after upload
#   - Keeps last N backups per type, never deletes current
#   - Lockfile prevents concurrent runs
#   - Logs every action for audit trail
# ═══════════════════════════════════════════════════════════════

set -uo pipefail
# NOTE: not using set -e — we handle errors per-database

# ── Config ──
MYSQL_USER="root"
MYSQL_PASS="422b96a53a063ec1"
MYSQL_HOST="127.0.0.1"

R2_ENDPOINT="https://fc785704aff7d46c9e4e4458d18bba99.r2.cloudflarestorage.com"
R2_BUCKET="chineseanimebucket"
R2_ACCESS_KEY="0fc9d2445a014860740a5cca8d11fb5b"
R2_SECRET_KEY="979d16f5350049c610318ac1e41f84ad21fc73e5be8c9fc09fb36b4a3134b5dd"
R2_PREFIX="universal-app-backups"

BACKUP_DIR="/tmp/universal-backup-$$"
LOG_FILE="/var/log/universal-backup.log"
LOCK_FILE="/tmp/universal-backup.lock"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

DATABASES=(
  "manga_app"
  "pakistani_app"
  "anime_downloader"
  "aviation_news"
  "gym_business_db"
  "gym_db"
  "gym_db_staging"
  "bus_app"
  "animekill_new"
  "animekill_app"
)

# Minimum dump sizes (bytes) — if a dump is smaller than this, it's likely corrupt/empty
# These are conservative minimums (just headers + schema = ~500 bytes minimum)
MIN_DUMP_SIZE=200

# Retention policy
DAILY_KEEP=3    # Keep last 3 daily backups
WEEKLY_KEEP=8   # Keep last 8 weekly backups (2 months)

# ── AWS CLI config for R2 ──
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"
export AWS_DEFAULT_REGION="auto"

S3CMD="aws s3 --endpoint-url $R2_ENDPOINT"
S3API="aws s3api --endpoint-url $R2_ENDPOINT"

# ── Functions ──
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup_local() {
  rm -rf "$BACKUP_DIR"
  rm -f "$LOCK_FILE"
}

acquire_lock() {
  if [ -f "$LOCK_FILE" ]; then
    local lock_pid
    lock_pid=$(cat "$LOCK_FILE" 2>/dev/null)
    if kill -0 "$lock_pid" 2>/dev/null; then
      log "ABORT: Another backup is running (PID $lock_pid)"
      exit 1
    else
      log "WARN: Stale lock found (PID $lock_pid not running), removing"
      rm -f "$LOCK_FILE"
    fi
  fi
  echo $$ > "$LOCK_FILE"
}

preflight_check() {
  # 1. MySQL connectivity
  if ! mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" -e "SELECT 1;" &>/dev/null; then
    log "ABORT: MySQL connection failed"
    exit 1
  fi

  # 2. mysqldump available
  if ! command -v mysqldump &>/dev/null; then
    log "ABORT: mysqldump not found"
    exit 1
  fi

  # 3. AWS CLI available
  if ! command -v aws &>/dev/null; then
    log "ABORT: AWS CLI not found"
    exit 1
  fi

  # 4. R2 connectivity — try listing the bucket
  if ! $S3CMD ls "s3://${R2_BUCKET}/${R2_PREFIX}/" &>/dev/null; then
    log "ABORT: R2 connection failed — cannot list bucket"
    exit 1
  fi

  # 5. Disk space — need at least 500MB free in /tmp
  local free_mb
  free_mb=$(df -m /tmp | awk 'NR==2 {print $4}')
  if [ "$free_mb" -lt 500 ]; then
    log "ABORT: Not enough disk space in /tmp (${free_mb}MB free, need 500MB)"
    exit 1
  fi

  # 6. Verify each database exists
  local available_dbs
  available_dbs=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" -N -e "SHOW DATABASES;" 2>/dev/null)

  for db in "${DATABASES[@]}"; do
    if ! echo "$available_dbs" | grep -qx "$db"; then
      log "WARN: Database '$db' does not exist — will skip"
    fi
  done

  log "Preflight checks passed"
}

validate_dump() {
  local filepath="$1"
  local db="$2"

  # 1. File must exist
  if [ ! -f "$filepath" ]; then
    log "VALIDATE FAIL: $db — dump file does not exist"
    return 1
  fi

  # 2. File must not be empty
  local filesize
  filesize=$(stat -c%s "$filepath" 2>/dev/null || stat -f%z "$filepath" 2>/dev/null)
  if [ "$filesize" -lt "$MIN_DUMP_SIZE" ]; then
    log "VALIDATE FAIL: $db — dump too small (${filesize} bytes, min ${MIN_DUMP_SIZE})"
    return 1
  fi

  # 3. Gzip integrity check
  if ! gzip -t "$filepath" 2>/dev/null; then
    log "VALIDATE FAIL: $db — gzip integrity check failed (corrupt archive)"
    return 1
  fi

  # 4. Verify it contains SQL (check first few bytes for mysqldump header)
  local header
  header=$(zcat "$filepath" 2>/dev/null | head -c 200)
  if ! echo "$header" | grep -qi "mysqldump\|mariadb-dump\|Server version\|Dump completed"; then
    # Some dumps start with comments or SET statements, check for those too
    if ! echo "$header" | grep -qi "^--\|^/\*\|^SET "; then
      log "VALIDATE FAIL: $db — does not look like a valid SQL dump"
      return 1
    fi
  fi

  log "VALIDATE OK: $db (${filesize} bytes)"
  return 0
}

verify_r2_upload() {
  local r2_key="$1"
  local expected_size="$2"
  local db="$3"

  # Check file exists on R2 and size matches
  local r2_size
  r2_size=$($S3API head-object --bucket "$R2_BUCKET" --key "$r2_key" --query 'ContentLength' --output text 2>/dev/null || echo "0")

  if [ "$r2_size" = "0" ] || [ "$r2_size" = "None" ]; then
    log "VERIFY FAIL: $db — file not found on R2 after upload"
    return 1
  fi

  if [ "$r2_size" != "$expected_size" ]; then
    log "VERIFY FAIL: $db — size mismatch (local: ${expected_size}, R2: ${r2_size})"
    return 1
  fi

  return 0
}

backup_database() {
  local db="$1"
  local type="$2"
  local filename="${db}_${TIMESTAMP}.sql.gz"
  local local_path="${BACKUP_DIR}/${filename}"
  local r2_key="${R2_PREFIX}/${type}/${DATE}/${filename}"
  local r2_path="s3://${R2_BUCKET}/${r2_key}"

  # 1. Check database exists
  if ! mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" -N -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$db';" 2>/dev/null | grep -q "$db"; then
    log "SKIP: $db — database does not exist"
    return 2  # special return code for "skip"
  fi

  # 2. Check if backup already exists on R2 (never overwrite)
  if $S3API head-object --bucket "$R2_BUCKET" --key "$r2_key" &>/dev/null; then
    log "SKIP: $db — backup already exists on R2 ($r2_key)"
    return 2
  fi

  # 3. Dump + gzip (capture stderr for error reporting)
  local dump_err
  dump_err=$(mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" \
    --single-transaction --routines --triggers --events \
    "$db" 2>&1 | gzip > "$local_path" 2>&1) || true

  # Check if the file was created and has content
  if [ ! -f "$local_path" ] || [ ! -s "$local_path" ]; then
    log "ERROR: mysqldump failed for $db — ${dump_err:-unknown error}"
    rm -f "$local_path"
    return 1
  fi

  # 4. Validate the dump
  if ! validate_dump "$local_path" "$db"; then
    log "ERROR: $db dump failed validation — NOT uploading"
    rm -f "$local_path"
    return 1
  fi

  local filesize
  filesize=$(stat -c%s "$local_path" 2>/dev/null || stat -f%z "$local_path" 2>/dev/null)
  local human_size
  human_size=$(du -sh "$local_path" | cut -f1)

  # 5. Upload to R2
  if ! $S3CMD cp "$local_path" "$r2_path" --quiet 2>/dev/null; then
    log "ERROR: R2 upload failed for $db ($type)"
    rm -f "$local_path"
    return 1
  fi

  # 6. Verify upload integrity (size match)
  if ! verify_r2_upload "$r2_key" "$filesize" "$db"; then
    log "ERROR: $db upload verification failed — file may be corrupt on R2"
    # Don't delete from R2 — leave it for manual inspection
    rm -f "$local_path"
    return 1
  fi

  # 7. Clean up local file
  rm -f "$local_path"

  log "OK: $db → $type ($human_size, verified)"
  return 0
}

cleanup_old_backups() {
  local type="$1"
  local keep="$2"

  log "Cleanup: checking $type backups (keep last $keep)"

  # List all date folders for this type, sorted newest first
  local folders
  folders=$($S3CMD ls "s3://${R2_BUCKET}/${R2_PREFIX}/${type}/" 2>/dev/null \
    | grep "PRE" | awk '{print $NF}' | sed 's|/$||' | sort -r)

  if [ -z "$folders" ]; then
    log "Cleanup: no $type folders found"
    return
  fi

  local count=0
  local deleted=0
  for folder in $folders; do
    count=$((count + 1))
    if [ "$count" -gt "$keep" ]; then
      # Safety: count files in folder before deleting
      local file_count
      file_count=$($S3CMD ls "s3://${R2_BUCKET}/${R2_PREFIX}/${type}/${folder}/" 2>/dev/null | grep -c "\.sql\.gz" || echo "0")

      if [ "$file_count" -gt 0 ]; then
        log "CLEANUP: Removing $type/$folder ($file_count files)"
        $S3CMD rm "s3://${R2_BUCKET}/${R2_PREFIX}/${type}/${folder}/" --recursive --quiet 2>/dev/null || true
        deleted=$((deleted + 1))
      fi
    fi
  done

  log "Cleanup done: kept $keep, removed $deleted old $type backups"
}

# ── Main ──
TYPE="${1:-daily}"

# Validate type
if [ "$TYPE" != "daily" ] && [ "$TYPE" != "weekly" ]; then
  echo "Usage: $0 [daily|weekly]"
  exit 1
fi

# Acquire lock (prevent concurrent runs)
acquire_lock
trap cleanup_local EXIT

log ""
log "═══════════════════════════════════════"
log "BACKUP STARTED — type=$TYPE, date=$DATE"
log "═══════════════════════════════════════"

# Run all preflight checks
preflight_check

# Create temp dir
mkdir -p "$BACKUP_DIR"

SUCCESS=0
FAILED=0
SKIPPED=0

for db in "${DATABASES[@]}"; do
  result=0
  backup_database "$db" "$TYPE" || result=$?

  if [ "$result" -eq 0 ]; then
    SUCCESS=$((SUCCESS + 1))
  elif [ "$result" -eq 2 ]; then
    SKIPPED=$((SKIPPED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
done

log "───────────────────────────────────────"
log "RESULT: $SUCCESS ok, $FAILED failed, $SKIPPED skipped (out of ${#DATABASES[@]} databases)"

# SAFETY: Only cleanup old backups if ALL databases succeeded (no failures)
if [ "$FAILED" -eq 0 ]; then
  if [ "$TYPE" = "daily" ]; then
    cleanup_old_backups "daily" "$DAILY_KEEP"
  elif [ "$TYPE" = "weekly" ]; then
    cleanup_old_backups "weekly" "$WEEKLY_KEEP"
  fi
else
  log "SAFETY: Skipping old backup cleanup because $FAILED database(s) failed"
  log "SAFETY: Old backups are preserved until next fully successful run"
fi

log "═══════════════════════════════════════"
log "BACKUP FINISHED — type=$TYPE"
log "═══════════════════════════════════════"

# Exit with error if any failed
[ "$FAILED" -eq 0 ] || exit 1
