import { type ReactNode } from 'react';
import styles from './LocationTransition.module.scss';
import { QuestionHtml } from './QuestionHtml.js';

interface LocationTransitionProps {
  /** Корпус, в который команда идёт; null, если маршрут его не называет */
  locationTitle: string | null;
  /** Первый шаг маршрута: корпуса позади ещё нет */
  start: boolean;
  /** Текст организаторов про дорогу; приходит с сервера и бывает пустым */
  html: string | null;
}

/** Пауза на дорогу между корпусами: куда идти, что со временем и что сказали организаторы. */
export function LocationTransition({
  locationTitle,
  start,
  html,
}: LocationTransitionProps): ReactNode {
  return (
    <div className={styles.transition}>
      <p className={styles.lead}>
        {start && 'Квест начинается. Ваш первый корпус:'}
        {!start && 'Вы завершили прохождение корпуса. Ваш следующий корпус:'}
      </p>
      {locationTitle !== null && <p className={styles.place}>{locationTitle}</p>}
      <p className={styles.lead}>На время перехода таймер прохождения остановлен.</p>
      {html !== null && html !== '' && <QuestionHtml html={html} className={styles.note} />}
    </div>
  );
}
