import { type ApiErrorGroup } from './types.js';

export const BindingErrors = {
  notFound: {
    code: 'binding__not_found',
    message: 'Код на двери не найден',
  },
  roomInvalid: {
    code: 'binding__room_invalid',
    message: 'В аудитории нет номера: пометка в скобках не считается',
  },
} as const satisfies ApiErrorGroup;
