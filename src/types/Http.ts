export interface IResponse<T> {
  data: T;
  error?: Error;
  isLoading?: boolean;
}
