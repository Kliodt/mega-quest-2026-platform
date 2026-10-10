import { type QuestionUsage } from './types.js';

interface WithId {
  id: string;
}

/**
 * Из вопросов одной аудитории — тот, что дольше всего свободен: сначала ни разу не выданные,
 * потом освободившиеся раньше всех. Занятые прямо сейчас уходят в конец: пока команда не
 * ответила, второй её вопрос отдавать некуда.
 */
export function pickFreeQuestion<T extends WithId>(questions: T[], usage: QuestionUsage[]): T {
  const byQuestion = new Map(usage.map((entry) => [entry.questionId, entry]));
  const [chosen] = [...questions].sort((left, right) =>
    compareFreedom(byQuestion.get(left.id), byQuestion.get(right.id)),
  );
  if (!chosen) {
    throw new Error('pickFreeQuestion: no questions to pick from');
  }
  return chosen;
}

/** Меньше — выдаём раньше: свободные перед занятыми, среди них — освободившиеся давно. */
function compareFreedom(left: QuestionUsage | undefined, right: QuestionUsage | undefined): number {
  if (!left || !right) {
    // Ни разу не выданный ждал дольше всех
    return Number(Boolean(left)) - Number(Boolean(right));
  }
  if (left.busy !== right.busy) {
    return Number(left.busy) - Number(right.busy);
  }
  return left.usedAt.getTime() - right.usedAt.getTime();
}
