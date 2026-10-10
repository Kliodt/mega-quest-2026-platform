import { type LoginRequestDto, type LoginResponseDto } from '@quest/shared';
import { toJwtPayload } from '../../utils/auth/toJwtPayload.js';
import { type JwtPayload } from '../../utils/auth/types.js';
import { toLoginResponseDto } from '../../utils/team/toLoginResponseDto.js';
import { loginTeam } from './loginTeam.js';

/** Подписывает JWT; приходит из плагина, поэтому сервис не знает про Fastify. */
export type SignToken = (payload: JwtPayload) => string;

/** Вход команды: проверка пароля, новая сессия и подписанный токен. */
export async function openSession(
  { name, password }: LoginRequestDto,
  sign: SignToken,
): Promise<LoginResponseDto> {
  const team = await loginTeam(name, password);
  return toLoginResponseDto(sign(toJwtPayload(team)), team);
}
