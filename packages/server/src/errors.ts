export class RouteError extends Error {
  statusCode: number;

  constructor({
    statusCode,
    message,
  }: {
    statusCode: number;
    message?: string;
  }) {
    super(message);
    this.statusCode = statusCode;
  }
}
