const AQI_BASE = "https://apiserver.aqi.in";
const TOKEN_PAGE = "https://www.aqi.in/in/dashboard/india/delhi/new-delhi";
const TOKEN_REGEX = /token2\?":\s*\?"(eyJ[a-zA-Z0-9._-]+)\?"/;
const TOKEN_TTL = 6 * 60 * 60 * 1000; // 6 hours
const MAX_RETRIES = 2;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cachedToken: string | null = null;
let tokenFetchedAt = 0;

// --------------- interfaces ---------------

export interface Pollutant {
  name: string;
  value: number;
  unit: string;
}

export interface AqiData {
  location: {
    name: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  aqi: {
    us: number;
    india: number;
    category: string;
    color: string;
  };
  pollutants: {
    pm25: Pollutant;
    pm10: Pollutant;
    o3: Pollutant;
    no2: Pollutant;
    so2: Pollutant;
    co: Pollutant;
  };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
  };
  updatedAt: string;
}

// --------------- helpers ---------------

async function extractToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - tokenFetchedAt < TOKEN_TTL) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_PAGE, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch AQI token page: HTTP ${res.status}`);

  const html = await res.text();
  const match = html.match(TOKEN_REGEX);
  if (!match) throw new Error("Could not extract AQI token from page");

  cachedToken = match[1];
  tokenFetchedAt = now;
  return cachedToken;
}

function clearToken() {
  cachedToken = null;
  tokenFetchedAt = 0;
}

function mapPollutant(raw: Record<string, unknown>, key: string): Pollutant {
  return {
    name: key,
    value: Number(raw?.[key] ?? 0),
    unit: key === "co" ? "mg/m3" : "ug/m3",
  };
}

// --------------- public ---------------

export async function getAqiByLocation(lat: number, lng: number): Promise<AqiData> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await extractToken();
      const url = `${AQI_BASE}/aqi/v2/getNearestLocation?lat=${lat}&long=${lng}&type=2&source=web`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          Referer: "https://www.aqi.in/",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (res.status === 401 || res.status === 403) {
        clearToken();
        if (attempt < MAX_RETRIES) continue;
        throw new Error(`AQI auth failed after retries: HTTP ${res.status}`);
      }

      if (!res.ok) throw new Error(`AQI API error: HTTP ${res.status}`);

      const json = await res.json();
      const data = json.data || json;

      const loc = data.location || data;
      const pollutants = data.pollutants || data;
      const weather = data.weather || data;

      return {
        location: {
          name: loc.name || loc.station_name || "",
          city: loc.city || "",
          state: loc.state || "",
          country: loc.country || "India",
          lat: Number(loc.lat || lat),
          lng: Number(loc.lng || loc.long || lng),
        },
        aqi: {
          us: Number(data.aqi_us || data.aqi || 0),
          india: Number(data.aqi_india || data.aqi_in || 0),
          category: data.category || data.aqi_category || "",
          color: data.color || data.aqi_color || "",
        },
        pollutants: {
          pm25: mapPollutant(pollutants, "pm25"),
          pm10: mapPollutant(pollutants, "pm10"),
          o3: mapPollutant(pollutants, "o3"),
          no2: mapPollutant(pollutants, "no2"),
          so2: mapPollutant(pollutants, "so2"),
          co: mapPollutant(pollutants, "co"),
        },
        weather: {
          temperature: Number(weather.temperature || weather.temp || 0),
          humidity: Number(weather.humidity || 0),
          windSpeed: Number(weather.wind_speed || weather.windSpeed || 0),
          windDirection: weather.wind_direction || weather.windDirection || "",
          pressure: Number(weather.pressure || 0),
        },
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES) {
        clearToken();
        continue;
      }
    }
  }

  throw lastError || new Error("getAqiByLocation failed after retries");
}
