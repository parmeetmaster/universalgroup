import mysql from "mysql2/promise";

const pools: Record<string, mysql.Pool> = {};

type AppDb = "anime" | "pak" | "aviation" | "manga" | "chinese-drama";

function getPool(app: AppDb): mysql.Pool {
  if (pools[app]) return pools[app];

  const configs: Record<AppDb, mysql.PoolOptions> = {
    anime: {
      host: process.env.ANIME_DB_HOST,
      port: Number(process.env.ANIME_DB_PORT) || 3306,
      user: process.env.ANIME_DB_USER,
      password: process.env.ANIME_DB_PASS,
      database: process.env.ANIME_DB_NAME,
    },
    pak: {
      host: process.env.PAK_DB_HOST,
      port: Number(process.env.PAK_DB_PORT) || 3306,
      user: process.env.PAK_DB_USER,
      password: process.env.PAK_DB_PASS,
      database: process.env.PAK_DB_NAME,
    },
    aviation: {
      host: process.env.AVIATION_DB_HOST,
      port: Number(process.env.AVIATION_DB_PORT) || 3306,
      user: process.env.AVIATION_DB_USER,
      password: process.env.AVIATION_DB_PASS,
      database: process.env.AVIATION_DB_NAME,
    },
    manga: {
      host: process.env.MANGA_DB_HOST,
      port: Number(process.env.MANGA_DB_PORT) || 3306,
      user: process.env.MANGA_DB_USER,
      password: process.env.MANGA_DB_PASS,
      database: process.env.MANGA_DB_NAME,
    },
    "chinese-drama": {
      host: process.env.CHINESE_DRAMA_DB_HOST,
      port: Number(process.env.CHINESE_DRAMA_DB_PORT) || 3306,
      user: process.env.CHINESE_DRAMA_DB_USER,
      password: process.env.CHINESE_DRAMA_DB_PASS,
      database: process.env.CHINESE_DRAMA_DB_NAME,
    },
  };

  pools[app] = mysql.createPool({
    ...configs[app],
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
  });

  return pools[app];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(app: AppDb, sql: string, params?: any[]) {
  const pool = getPool(app);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows] = await pool.execute(sql, params as any);
  return rows;
}

export type AppDbType = AppDb;
