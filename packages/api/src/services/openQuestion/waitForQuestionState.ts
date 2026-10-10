import { type QuestionStateDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { toQuestionStateDto } from '../../utils/question/toQuestionStateDto.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';

/** Как часто перечитываем состояние, пока команда ждёт */
const POLL_INTERVAL_MS = 1000;
/** Дольше держать запрос незачем: прокси и мобильные сети рвут долгие соединения */
const WAIT_TIMEOUT_MS = 25_000;

/**
 * Отдаёт состояние, как только оно изменится. У игр, где ответ засчитывает внешний
 * механизм, фронт висит на этом запросе вместо того, чтобы опрашивать сервер вхолостую.
 */
export async function waitForQuestionState(
  team: TeamDocument,
  since: string,
): Promise<QuestionStateDto> {
  return poll(team, since, Date.now() + WAIT_TIMEOUT_MS);
}

async function poll(
  team: TeamDocument,
  since: string,
  deadline: number,
): Promise<QuestionStateDto> {
  const { state } = await requireOpenQuestion(team);
  const current = toQuestionStateDto(state);
  if (current.updatedAt !== since || Date.now() >= deadline) {
    return current;
  }
  await delay(POLL_INTERVAL_MS);
  return poll(team, since, deadline);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
