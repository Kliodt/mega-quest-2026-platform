import {
  StepKind,
  type LocationTransitionCardDto,
  type QuestionCardDto,
  type StepCardDto,
} from '@quest/shared';

/** Корпус на карте: переход в него и задания, которые команда решает внутри. */
export interface RouteChapter {
  transition: LocationTransitionCardDto;
  questions: QuestionCardDto[];
}

/**
 * Маршрут главами по корпусам: переход между корпусами открывает главу, вопросы
 * до следующего перехода — её содержимое. Последний переход остаётся без вопросов: это финиш.
 */
export function toRouteChapters(cards: StepCardDto[]): RouteChapter[] {
  const chapters: RouteChapter[] = [];
  cards.forEach((card) => {
    if (card.kind === StepKind.LOCATION_TRANSITION) {
      chapters.push({ transition: card, questions: [] });
      return;
    }
    chapters.at(-1)?.questions.push(card);
  });
  return chapters;
}
