import { StepKind, type AdminStepDto, type StepCardDto } from '@quest/shared';

/** Номер аудитории (или несколько через «/») по индексу шага-вопроса. */
export function getRoomNumbersByStep(steps: (StepCardDto | AdminStepDto)[]): Map<number, string> {
  const byStep = new Map<number, string>();
  for (const step of steps) {
    if (step.kind !== StepKind.QUESTION) {
      continue;
    }
    if ('roomNumbers' in step) {
      // У нерешённого вопроса аудитории нет: сервер её не отдаёт
      if (step.roomNumbers !== null) {
        byStep.set(step.stepIndex, step.roomNumbers.join(' / '));
      }
      continue;
    }
    if (step.question) {
      byStep.set(step.stepIndex, step.question.roomNumber);
    } else {
      byStep.set(step.stepIndex, step.options.map((option) => option.roomNumber).join(' / '));
    }
  }
  return byStep;
}
