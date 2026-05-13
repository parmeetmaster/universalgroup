#!/bin/bash
set -e

export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"

cd "$(dirname "$0")"

echo "Building NestJS..."
npx tsc --project nest/tsconfig.json

echo "Building Next.js..."
npm run build > /dev/null 2>&1

echo "Uploading NestJS dist..."
rsync -az --delete nest/dist/ inrexa:/www/wwwroot/global-api/dist/
scp nest/ecosystem.config.js inrexa:/www/wwwroot/global-api/ > /dev/null 2>&1

echo "Uploading Next.js build..."
ssh inrexa "pm2 stop global-dashboard 2>/dev/null; rm -rf /www/wwwroot/global-dashboard/.next/cache" > /dev/null 2>&1
rsync -az --delete --exclude='cache/' .next/ inrexa:/www/wwwroot/global-dashboard/.next/

echo "Restarting PM2..."
ssh inrexa "cd /www/wwwroot/global-api && pm2 delete global-api 2>/dev/null; pm2 start ecosystem.config.js && rm -rf /www/server/nginx/proxy_cache_dir/* && pm2 restart global-dashboard && nginx -s reload && pm2 save" > /dev/null 2>&1

echo "Deploy complete!"
