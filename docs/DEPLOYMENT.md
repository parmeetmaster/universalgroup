# Deployment

## Server

- **Host:** `194.163.133.119`
- **SSH:** `ssh inrexa` (key-based, no password)
- **Panel:** aaPanel at `/www/`
- **Directory:** `/www/wwwroot/pakistani_serials_server/`
- **Process:** PM2 cluster x2, name `pakistani_serials_server_prod`, port 786
- **Domain:** `pak-ott.animekill.com` (nginx vhost at `/www/server/panel/vhost/nginx/node_pakistanott.conf` reverse-proxies to `127.0.0.1:786`)
- **DB:** MySQL `pakistani_serials` (user `pakistani_serials_user`, localhost-only)

## First-time setup (Phase 7 only)

Every `CONFIRM ⇒` step pauses for user approval.

### 1. SSH access
```bash
ssh inrexa
```

### 2. Node & PM2 sanity
```bash
node --version     # should match package.json engines
pm2 --version
pm2 list
```

### 3. CONFIRM ⇒ create MySQL DB + user
(On the server, via MySQL CLI or aaPanel DB UI)

```sql
CREATE DATABASE pakistani_serials CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pakistani_serials_user'@'localhost' IDENTIFIED BY '<generated-strong-password>';
GRANT ALL PRIVILEGES ON pakistani_serials.* TO 'pakistani_serials_user'@'localhost';
FLUSH PRIVILEGES;
```

Save the password in local `.env.prod` (never commit).

### 4. CONFIRM ⇒ create deploy directory
```bash
mkdir -p /www/wwwroot/pakistani_serials_server
```

### 5. CONFIRM ⇒ first rsync (--delete)
From local workstation:
```bash
rsync -az --delete \
  --exclude node_modules \
  --exclude .env* \
  --exclude dist \
  ./pakistani_serials_server/ \
  inrexa:/www/wwwroot/pakistani_serials_server/
```

### 6. Install & build on server
```bash
ssh inrexa
cd /www/wwwroot/pakistani_serials_server
npm ci --omit=dev
npm run build
```

### 7. Place .env.prod
From local:
```bash
scp pakistani_serials_server/.env.prod \
  inrexa:/www/wwwroot/pakistani_serials_server/.env
```

### 8. CONFIRM ⇒ run migrations
```bash
npm run migration:run
```

### 9. CONFIRM ⇒ seed
```bash
npm run seed
```
Admin email + password shown once. Save it.

### 10. CONFIRM ⇒ start PM2
```bash
pm2 start dist/main.js \
  --name pakistani_serials_server_prod \
  -i 2 \
  --env-from-file /www/wwwroot/pakistani_serials_server/.env
pm2 save
pm2 startup   # on first setup only
```

### 11. CONFIRM ⇒ port 786 is private (nginx only)
Port 786 binds to `0.0.0.0` but external traffic enters via nginx on :80 at `pak-ott.animekill.com`. No need to open 786 on the firewall.

### 12. Smoke test
```bash
curl -sS http://pak-ott.animekill.com/v1/health | jq
curl -sS http://pak-ott.animekill.com/v1/genres | jq
open http://pak-ott.animekill.com/v1/docs
```

## Ongoing deploys

```bash
# Local workstation
cd pakistani_serials_server
git pull
rsync -az --delete \
  --exclude node_modules \
  --exclude .env* \
  --exclude dist \
  ./ inrexa:/www/wwwroot/pakistani_serials_server/

# On server
ssh inrexa
cd /www/wwwroot/pakistani_serials_server
npm ci --omit=dev
npm run build
npm run migration:run  # if new migrations
pm2 reload pakistani_serials_server_prod
```

## Android APK build (MVP)

```bash
cd pakistani_serials
fvm flutter build apk --release \
  --dart-define=API_BASE_URL=http://pak-ott.animekill.com/v1
```

APK at `build/app/outputs/flutter-apk/app-release.apk`.

Install on device:
```bash
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

## Rollback

```bash
ssh inrexa
cd /www/wwwroot/pakistani_serials_server
git checkout <previous-commit>
npm ci --omit=dev
npm run build
npm run migration:revert   # one step back; run multiple times for more
pm2 reload pakistani_serials_server_prod
```
