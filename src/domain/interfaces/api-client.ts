export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface IApiClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
}
