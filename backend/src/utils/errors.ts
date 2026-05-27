// Centralized HTTP error types so route handlers stay terse.
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message = "Bad request", details?: unknown) =>
  new HttpError(400, "bad_request", message, details);

export const Unauthorized = (message = "Unauthorized") =>
  new HttpError(401, "unauthorized", message);

export const Forbidden = (message = "Forbidden") =>
  new HttpError(403, "forbidden", message);

export const NotFound = (message = "Not found") =>
  new HttpError(404, "not_found", message);

export const Conflict = (message = "Conflict") =>
  new HttpError(409, "conflict", message);

export const TooMany = (message = "Too many requests") =>
  new HttpError(429, "too_many_requests", message);

export const ServerError = (message = "Internal server error") =>
  new HttpError(500, "internal_error", message);

export const ServiceUnavailable = (message = "Service unavailable") =>
  new HttpError(503, "service_unavailable", message);
