import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AqiResponseDto } from '../dto/aqi-response.dto';

const WAQI_MAP = 'https://api.waqi.info/mapq/bounds';
const WAQI_FEED = 'https://api.waqi.info/api/feed';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const MAX_RETRIES = 2;

const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

@Injectable()
export class AqiScraper {
  private readonly logger = new Logger(AqiScraper.name);

  constructor(private readonly http: HttpService) {}

  async getAqiByLocation(lat: number, lon: number): Promise<AqiResponseDto> {
    const [stationData, weatherData] = await Promise.all([
      this.fetchNearestStation(lat, lon),
      this.fetchWeather(lat, lon),
    ]);

    return this.buildResponse(lat, lon, stationData, weatherData);
  }

  private async fetchNearestStation(lat: number, lon: number): Promise<any> {
    return this.withRetry(async () => {
      const delta = 0.5;
      const bounds = `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`;

      const { data: stations } = await firstValueFrom(
        this.http.get<any[]>(`${WAQI_MAP}?bounds=${bounds}`, {
          headers: { Referer: 'https://aqicn.org/' },
          timeout: 10000,
        }),
      );

      if (!stations?.length) {
        throw new Error('No AQI stations found near this location');
      }

      // Find nearest station
      let nearest = stations[0];
      let minDist = Infinity;
      for (const s of stations) {
        const d = Math.pow(s.lat - lat, 2) + Math.pow(s.lon - lon, 2);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }

      // Fetch full station data
      const { data: feed } = await firstValueFrom(
        this.http.get<any>(`${WAQI_FEED}/@${nearest.x}/aqi.json`, {
          headers: { Referer: 'https://aqicn.org/' },
          timeout: 10000,
        }),
      );

      const msg = feed?.rxs?.obs?.[0]?.msg;
      if (!msg) {
        throw new Error('Invalid station data response');
      }

      return msg;
    }, 'fetchNearestStation');
  }

  private async fetchWeather(lat: number, lon: number): Promise<any> {
    return this.withRetry(async () => {
      const params = [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'weather_code',
        'uv_index',
      ].join(',');

      const { data } = await firstValueFrom(
        this.http.get<any>(
          `${WEATHER_BASE}?latitude=${lat}&longitude=${lon}&current=${params}&timezone=auto`,
          { timeout: 10000 },
        ),
      );

      return data.current || {};
    }, 'fetchWeather');
  }

  private buildResponse(lat: number, lon: number, station: any, weather: any): AqiResponseDto {
    const iaqi = station.iaqi || {};
    const city = station.city || {};
    const cityName = city.name || '';
    const cityParts = cityName.split(',').map((s: string) => s.trim());

    return {
      location: {
        city: cityParts.length > 1 ? cityParts[1] : cityParts[0] || '',
        state: cityParts.length > 2 ? cityParts[2] : '',
        country: cityParts[cityParts.length - 1] || '',
        station: cityName,
        latitude: city.geo?.[0] ?? lat,
        longitude: city.geo?.[1] ?? lon,
        slug: city.url || '',
      },
      aqi: {
        aqiUS: station.aqi ?? null,
        aqiIN: null,
        pm25: iaqi.pm25?.v ?? null,
        pm10: iaqi.pm10?.v ?? null,
        o3: iaqi.o3?.v ?? null,
        no2: iaqi.no2?.v ?? null,
        so2: iaqi.so2?.v ?? null,
        co: iaqi.co?.v ?? null,
      },
      weather: {
        temperature: weather.temperature_2m ?? null,
        feelsLike: weather.apparent_temperature ?? null,
        humidity: weather.relative_humidity_2m ?? null,
        windSpeed: weather.wind_speed_10m ?? null,
        windDirection: this.degreesToDirection(weather.wind_direction_10m),
        pressure: weather.pressure_msl ?? null,
        visibility: null,
        uvIndex: weather.uv_index ?? null,
        uvCondition: this.getUvCondition(weather.uv_index),
        cloud: weather.cloud_cover ?? null,
        precipitation: weather.precipitation ?? null,
        condition: {
          text: WMO_WEATHER_CODES[weather.weather_code] || '',
          icon: '',
          code: weather.weather_code ?? null,
        },
      },
      updatedAt: station.time?.iso || '',
      isOnline: true,
    };
  }

  private degreesToDirection(deg: number | null | undefined): string {
    if (deg == null) return '';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  private getUvCondition(uv: number | null | undefined): string {
    if (uv == null) return '';
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  }

  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`${context} attempt ${attempt + 1} failed: ${lastError.message}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
}
