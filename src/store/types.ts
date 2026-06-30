export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface BaseConfigState<T> {
  config: T | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
}
