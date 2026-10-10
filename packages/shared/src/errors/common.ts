import { type ApiErrorGroup } from './types.js';

export const CommonErrors = {
  internal: {
    code: 'common__internal',
    message: 'Внутренняя ошибка сервера',
  },
  notFound: {
    code: 'common__not_found',
    message: 'Не найдено',
  },
  validation: {
    code: 'common__validation',
    message: 'Некорректный запрос',
  },
  requestRejected: {
    code: 'common__request_rejected',
    message: 'Запрос отклонён',
  },
  network: {
    code: 'common__network',
    message: 'Нет связи с сервером',
  },
} as const satisfies ApiErrorGroup;
