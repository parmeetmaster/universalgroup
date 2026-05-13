export const API_CONFIG = {
  "anime-downloader": {
    base: process.env.NEXT_PUBLIC_ANIME_API || "/api/anime-downloader",
    adminToken: process.env.NEXT_PUBLIC_ANIME_ADMIN_TOKEN || "",
    endpoints: {
      health: "/health",
      scrape: "/scrape",
      poll: "/poll",
      devices: "/devices",
      kv: "/kv",
      adminKv: "/admin/kv",
      blockedCountries: "/admin/blocked-countries",
      registeredCountries: "/admin/registered-countries",
    },
  },
  "pakistani-serials": {
    base: process.env.NEXT_PUBLIC_PAK_API || "/api/pakistani-serials",
    adminToken: process.env.NEXT_PUBLIC_PAK_ADMIN_TOKEN || "",
    endpoints: {
      dramas: "/dramas",
      episodes: "/episodes",
      genres: "/genres",
      home: "/home",
      search: "/search",
      config: "/config",
      admin: "/admin",
      auth: "/auth",
    },
  },
  "aviation-news": {
    base: process.env.NEXT_PUBLIC_AVIATION_API || "/api/aviation-news",
    adminToken: process.env.NEXT_PUBLIC_AVIATION_ADMIN_TOKEN || "",
    endpoints: {
      home: "/home",
      category: "/category",
      article: "/article",
      search: "/search",
      latest: "/latest",
      aqi: "/aqi",
      flights: "/flights",
      notifications: "/notifications",
      youtubeShorts: "/youtube-shorts",
    },
  },
} as const;

export type AppId = keyof typeof API_CONFIG;
