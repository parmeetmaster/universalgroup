import { HttpClient } from "./http-client";
import { API_CONFIG } from "@/config/api";

const config = API_CONFIG["anime-downloader"];

export class AnimeApi {
  private client: HttpClient;
  private adminHeaders: Record<string, string>;

  constructor() {
    this.client = new HttpClient(config.base);
    this.adminHeaders = { "X-Admin-Token": config.adminToken };
  }

  async getHealth() {
    return this.client.get<{ status: string }>(config.endpoints.health);
  }

  async triggerScrape() {
    return this.client.get<unknown>(config.endpoints.scrape);
  }

  async triggerPoll() {
    return this.client.post<unknown>(config.endpoints.poll);
  }

  async getKvValue(key: string) {
    return this.client.get<{ key: string; value: unknown }>(
      `${config.endpoints.kv}/${key}`
    );
  }

  async setKvValue(key: string, value: unknown) {
    return this.client.put<unknown>(
      `${config.endpoints.adminKv}/${key}`,
      { value },
      this.adminHeaders
    );
  }

  async deleteKvValue(key: string) {
    return this.client.delete<unknown>(
      `${config.endpoints.adminKv}/${key}`,
      this.adminHeaders
    );
  }

  async getBlockedCountries() {
    return this.client.get<string[]>(
      config.endpoints.blockedCountries,
      this.adminHeaders
    );
  }

  async getRegisteredCountries() {
    return this.client.get<string[]>(
      config.endpoints.registeredCountries,
      this.adminHeaders
    );
  }
}

export const animeApi = new AnimeApi();
