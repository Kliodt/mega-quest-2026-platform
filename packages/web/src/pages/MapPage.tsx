import { StepKind, StepState } from '@quest/shared';
import { type ReactNode } from 'react';
import { RouteMap } from '../components/RouteMap.js';
import styles from './MapPage.module.scss';
import { useQuestOutletContext } from './questOutletContext.js';

/** Карта маршрута отдельной страницей, чтобы не отвлекать от задания. */
export function MapPage(): ReactNode {
  const { progress } = useQuestOutletContext();

  const questions = progress.steps.filter((card) => card.kind === StepKind.QUESTION);
  const solved = questions.filter((card) => card.state === StepState.DONE).length;

  return (
    <section className={styles.page}>
      <p className={styles.progress}>
        Пройдено {solved} из {questions.length} заданий
      </p>
      <RouteMap cards={progress.steps} entryAchievement={progress.achievements[0] ?? null} />
    </section>
  );
}
