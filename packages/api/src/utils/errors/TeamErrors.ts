import { TeamErrors } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError } from './ApiError.js';

export class TeamNotFoundError extends ApiError {
  constructor() {
    super(httpStatus.NOT_FOUND, TeamErrors.notFound);
  }
}

export class TeamNameTakenError extends ApiError {
  constructor() {
    super(httpStatus.CONFLICT, TeamErrors.nameTaken);
  }
}

export class RouteInvalidError extends ApiError {
  constructor(errors: string[]) {
    super(httpStatus.BAD_REQUEST, TeamErrors.routeInvalid, { errors });
  }
}

export class RoutePrefixLockedError extends ApiError {
  constructor(lockedThroughIndex: number) {
    super(httpStatus.CONFLICT, TeamErrors.routePrefixLocked, { lockedThroughIndex });
  }
}

export class TimeAdjustmentNotFoundError extends ApiError {
  constructor() {
    super(httpStatus.NOT_FOUND, TeamErrors.timeAdjustmentNotFound);
  }
}

export class TimeAdjustmentStepInvalidError extends ApiError {
  constructor(stepIndex: number) {
    super(httpStatus.BAD_REQUEST, TeamErrors.timeAdjustmentStepInvalid, { stepIndex });
  }
}

export class RewindStepInvalidError extends ApiError {
  constructor(stepIndex: number, currentStepIndex: number) {
    super(httpStatus.CONFLICT, TeamErrors.rewindStepInvalid, { stepIndex, currentStepIndex });
  }
}
