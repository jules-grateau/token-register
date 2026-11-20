import type { ApiErrorCode } from 'shared-ts';

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  /** Optional machine-readable code, returned to the client with the message. */
  constructor(
    message: string,
    public readonly code?: ApiErrorCode
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message);
  }
}
