import { type ReactNode } from 'react';
import styles from './AnswerFlags.module.scss';

const NEXT_ROOM_TITLE = 'Ответ — следующая аудитория';
const DYNAMIC_TITLE = 'Номер следующей аудитории подставляется в момент открытия вопроса';
const EXTERNAL_TITLE = 'Ответ засчитывает внешний механизм: экран команды ждёт его сам';

interface AnswerFlagsProps {
  answerIsNextRoom: boolean;
  hasDynamicAnswer: boolean;
  waitsForExternalAnswer: boolean;
}

/**
 * Флаги ответа значками: стрелка — ответ-аудитория, палочка — номер подставляет ядро,
 * волны — ответ приходит извне.
 */
export function AnswerFlags({
  answerIsNextRoom,
  hasDynamicAnswer,
  waitsForExternalAnswer,
}: AnswerFlagsProps): ReactNode {
  return (
    <span className={styles.flags}>
      {answerIsNextRoom && (
        <Flag title={NEXT_ROOM_TITLE}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </Flag>
      )}
      {hasDynamicAnswer && (
        <Flag title={DYNAMIC_TITLE}>
          <path d="M4 20 14 10" />
          <path d="m16 4 1.2 2.8L20 8l-2.8 1.2L16 12l-1.2-2.8L12 8l2.8-1.2z" />
        </Flag>
      )}
      {waitsForExternalAnswer && (
        <Flag title={EXTERNAL_TITLE}>
          <circle cx="12" cy="12" r="2" />
          <path d="M7.8 7.8a5.9 5.9 0 0 0 0 8.4M16.2 16.2a5.9 5.9 0 0 0 0-8.4" />
          <path d="M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 19.4a10.5 10.5 0 0 0 0-14.8" />
        </Flag>
      )}
    </span>
  );
}

interface FlagProps {
  title: string;
  children: ReactNode;
}

function Flag({ title, children }: FlagProps): ReactNode {
  return (
    <span className={styles.flag} title={title} aria-label={title}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}
