import { AuthErrors } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError, InternalApiError } from './ApiError.js';

export class UnauthorizedError extends ApiError {
  constructor() {
    super(httpStatus.UNAUTHORIZED, AuthErrors.unauthorized);
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor() {
    super(httpStatus.UNAUTHORIZED, AuthErrors.invalidCredentials);
  }
}

export class SessionReplacedError extends ApiError {
  constructor() {
    super(httpStatus.UNAUTHORIZED, AuthErrors.sessionReplaced);
  }
}

export class AdminUnauthorizedError extends ApiError {
  constructor() {
    super(httpStatus.UNAUTHORIZED, AuthErrors.adminUnauthorized);
  }
}

export class SessionMissingError extends InternalApiError {
  constructor(teamId: string) {
    super(AuthErrors.sessionMissing, { teamId });
  }
}
