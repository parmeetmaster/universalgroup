import { HttpClient } from "./http-client";
import { API_CONFIG } from "@/config/api";

const config = API_CONFIG["pakistani-serials"];

export class PakistaniApi {
  private client: HttpClient;
  private adminHeaders: Record<string, string>;

  constructor() {
    this.client = new HttpClient(config.base);
    this.adminHeaders = { Authorization: `Bearer ${config.adminToken}` };
  }

  async getHome() {
    return this.client.get<unknown>(config.endpoints.home);
  }

  async getDramas(page = 1) {
    return this.client.get<unknown>(`${config.endpoints.dramas}?page=${page}`);
  }

  async getDrama(slug: string) {
    return this.client.get<unknown>(`${config.endpoints.dramas}/${slug}`);
  }

  async getGenres() {
    return this.client.get<unknown>(config.endpoints.genres);
  }

  async search(query: string) {
    return this.client.get<unknown>(
      `${config.endpoints.search}?q=${encodeURIComponent(query)}`
    );
  }

  async getConfig() {
    return this.client.get<unknown>(config.endpoints.config);
  }

  async getAdminStats() {
    return this.client.get<unknown>(
      `${config.endpoints.admin}/stats`,
      this.adminHeaders
    );
  }
}

export const pakistaniApi = new PakistaniApi();
