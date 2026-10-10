import { Type, type Static } from '@sinclair/typebox';
import { TeamStatus } from '../enums.js';

/** Названия команд для выпадающего списка на входе; пароль всё равно вводится руками. */
export const TeamNamesSchema = Type.Object({ names: Type.Array(Type.String()) });
export type TeamNamesDto = Static<typeof TeamNamesSchema>;

export const LoginRequestSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  password: Type.String({ minLength: 1, maxLength: 200 }),
});
export type LoginRequestDto = Static<typeof LoginRequestSchema>;

export const TeamSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: Type.Enum(TeamStatus),
});
export type TeamDto = Static<typeof TeamSchema>;

export const LoginResponseSchema = Type.Object({
  token: Type.String(),
  team: TeamSchema,
});
export type LoginResponseDto = Static<typeof LoginResponseSchema>;
