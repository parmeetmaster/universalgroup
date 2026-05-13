import { HttpClient } from "./http-client";
import { API_CONFIG } from "@/config/api";

const config = API_CONFIG["aviation-news"];

export class AviationApi {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(config.base);
  }

  async getHome() {
    return this.client.get<unknown>(config.endpoints.home);
  }

  async getCategory(slug: string, page = 1) {
    return this.client.get<unknown>(
      `${config.endpoints.category}/${slug}?page=${page}`
    );
  }

  async getArticle(path: string) {
    return this.client.get<unknown>(
      `${config.endpoints.article}?path=${encodeURIComponent(path)}`
    );
  }

  async search(query: string, page = 1) {
    return this.client.get<unknown>(
      `${config.endpoints.search}?q=${encodeURIComponent(query)}&page=${page}`
    );
  }

  async getLatest(page = 1) {
    return this.client.get<unknown>(`${config.endpoints.latest}?page=${page}`);
  }

  async getAqi(lat: number, lng: number) {
    return this.client.get<unknown>(
      `${config.endpoints.aqi}?lat=${lat}&lng=${lng}`
    );
  }

  async getFlights(lat: number, lon: number, nm = 250) {
    return this.client.get<unknown>(
      `${config.endpoints.flights}/${lat}/${lon}/${nm}`
    );
  }

  async getYoutubeShorts() {
    return this.client.get<unknown>(config.endpoints.youtubeShorts);
  }

  async subscribeDevice(token: string) {
    return this.client.post<unknown>(
      `${config.endpoints.notifications}/subscribe`,
      { token }
    );
  }
}

export const aviationApi = new AviationApi();
