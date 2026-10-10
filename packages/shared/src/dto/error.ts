import { Type, type Static } from '@sinclair/typebox';
import { type ApiErrorCode } from '../errors/index.js';

/** Форма ответа с ошибкой; в OpenAPI не публикуется, контракт кодов лежит в `errors/`. */
export const ApiErrorSchema = Type.Object({
  code: Type.Unsafe<ApiErrorCode>({ type: 'string' }),
  message: Type.String(),
  data: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});
export type ApiErrorDto = Static<typeof ApiErrorSchema>;

export const OkSchema = Type.Object({ ok: Type.Literal(true) });
export type OkDto = Static<typeof OkSchema>;
