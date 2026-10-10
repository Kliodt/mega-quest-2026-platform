import { type ApiErrorGroup } from './types.js';

export const TeamErrors = {
  notFound: {
    code: 'team__not_found',
    message: 'Команда не найдена',
  },
  nameTaken: {
    code: 'team__name_taken',
    message: 'Команда с таким названием уже есть',
  },
  routeInvalid: {
    code: 'team__route_invalid',
    message: 'Маршрут составлен неверно',
  },
  routePrefixLocked: {
    code: 'team__route_prefix_locked',
    message: 'Команда уже прошла часть маршрута, эти шаги менять нельзя',
  },
  timeAdjustmentNotFound: {
    code: 'team__time_adjustment_not_found',
    message: 'Поправка времени не найдена',
  },
  timeAdjustmentStepInvalid: {
    code: 'team__time_adjustment_step_invalid',
    message: 'Поправку можно привязать только к шагу-вопросу маршрута команды',
  },
  rewindStepInvalid: {
    code: 'team__rewind_step_invalid',
    message: 'Вернуть команду можно только к шагу-вопросу, который она уже открывала',
  },
} as const satisfies ApiErrorGroup;
