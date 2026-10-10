import { type BasicAnswerDto } from '@quest/shared';

/**
 * Ответ на стикерах — строка эмодзи подряд, а команда набирает их как придётся: через
 * пробелы, с переносами, с пробелом в конце. Пробелы смысла не несут, поэтому убираем
 * их все ещё на экране — иначе ответ не сойдётся с записанным у вопроса.
 */
export function toStickersAnswer(answer: unknown): BasicAnswerDto {
  const { text } = (answer ?? {}) as Partial<BasicAnswerDto>;
  return { text: (text ?? '').replace(/\s+/gu, '') };
}
