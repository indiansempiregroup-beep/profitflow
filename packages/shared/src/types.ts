export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  success: true;
  token: string;
  user: AuthUser;
}
