/** Полезная нагрузка JWT: команда и её активная сессия. */
export interface JwtPayload {
  sub: string;
  sid: string;
}
