export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export interface ApiResponseWithPagination<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}
