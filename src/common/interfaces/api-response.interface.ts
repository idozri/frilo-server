export interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
}

export interface ApiResponseWithPagination<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}
