import { IApiClient, ApiResponse } from "@/domain/interfaces/api-client";

export class HttpClient implements IApiClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        return {
          data: null as T,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async get<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "GET", headers });
  }

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "DELETE", headers });
  }
}
