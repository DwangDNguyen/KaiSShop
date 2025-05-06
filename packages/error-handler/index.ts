export class AppError extends Error {
  public readonly details?: any;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resources not found') {
    super(message, 404, true);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: any) {
    super(message, 400, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: any) {
    super(message, 401, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request data', details?: any) {
    super(message, 422, true, details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, 401, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: any) {
    super(message, 403, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: any) {
    super(message, 500, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests, please try again later',
    details?: any
  ) {
    super(message, 429, true, details);
  }
}
