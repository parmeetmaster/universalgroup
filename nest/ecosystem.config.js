const common = {
  NODE_ENV: 'production',

  // Anime Downloader DB
  ANIME_DB_HOST: '127.0.0.1',
  ANIME_DB_PORT: '3306',
  ANIME_DB_USER: 'anime_downloader',
  ANIME_DB_PASS: 'asd1236547899',
  ANIME_DB_NAME: 'anime_downloader',

  // Pakistani Serials DB
  PAK_DB_HOST: '127.0.0.1',
  PAK_DB_PORT: '3306',
  PAK_DB_USER: 'pakistani_app',
  PAK_DB_PASS: 'asd1236547899',
  PAK_DB_NAME: 'pakistani_app',

  // Aviation News DB
  AVIATION_DB_HOST: '127.0.0.1',
  AVIATION_DB_PORT: '3306',
  AVIATION_DB_USER: 'aviation_news',
  AVIATION_DB_PASS: 'asd1236547899',
  AVIATION_DB_NAME: 'aviation_news',

  // Manga DB
  MANGA_DB_HOST: '127.0.0.1',
  MANGA_DB_PORT: '3306',
  MANGA_DB_USER: 'manga_app',
  MANGA_DB_PASS: 'asd1236547899',
  MANGA_DB_NAME: 'manga_app',

  // Animekill App DB (auth)
  ANIMEKILL_APP_DB_HOST: '127.0.0.1',
  ANIMEKILL_APP_DB_PORT: '3306',
  ANIMEKILL_APP_DB_USER: 'animekill_app',
  ANIMEKILL_APP_DB_PASS: 'asd1236547899',
  ANIMEKILL_APP_DB_NAME: 'animekill_app',

  // ImageBan (Pakistani poster hosting) — shared key from anime backend
  IMAGEBAN_SECRET_KEY: 'HcllsPjSpOCGg9DMHzQaDeT3IXO2LAStS4c',

  // Admin
  ADMIN_TOKEN: '7bd153c10371970a58dd9f0a84571d00413cac7387556d4d9f6aca0e43022e84',
  SEED_LOGIN_EMAIL: 'parmeets834@gmail.com',
  SEED_LOGIN_PASSWORD: 'asd1236547899',

  // Anime scraper
  GOGO_BASE_URL: 'https://gogoanimes.cv/',
  POLL_INTERVAL_MINUTES: '10',

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_PATH: '/www/wwwroot/global-api/firebase/anime-firebase.json',
  AVIATION_FIREBASE_PATH: '/www/wwwroot/global-api/firebase/aviation-firebase.json',
  PAK_FIREBASE_PATH: '/www/wwwroot/global-api/firebase/pak-firebase.json',
};

module.exports = {
  apps: [
    {
      name: 'global-api',
      script: 'dist/main.js',
      cwd: '/www/wwwroot/global-api',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: { ...common, PORT: 3090 },
      error_file: '/www/wwwlogs/global-api_err.log',
      out_file: '/www/wwwlogs/global-api_out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
