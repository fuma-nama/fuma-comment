export type RouteResponse<T> = T | Promise<T>;

export interface AuthInfo {
  /** User ID, must be unique */
  id: string;
}
