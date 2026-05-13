export function wrapSuccess(data: unknown) {
  return { success: true as const, data };
}

export function wrapError(code: string, message: string, status = 400) {
  return {
    success: false as const,
    error: { code, message },
    _status: status,
  };
}

export type SuccessResponse = ReturnType<typeof wrapSuccess>;
export type ErrorResponse = ReturnType<typeof wrapError>;
export type ApiResponse = SuccessResponse | ErrorResponse;
