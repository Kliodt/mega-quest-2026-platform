import classNames from 'classnames';
import { type ReactNode } from 'react';
import { Badge, BadgeTone } from './Badge.js';
import styles from './StepCard.module.scss';

export enum StepCardState {
  LOCKED = 'locked',
  AWAITING_CODE = 'awaitingCode',
  ACTIVE = 'active',
  DONE = 'done',
}

const STATE_CLASS: Record<StepCardState, string | undefined> = {
  [StepCardState.LOCKED]: styles.locked,
  [StepCardState.AWAITING_CODE]: styles.awaiting,
  [StepCardState.ACTIVE]: styles.active,
  [StepCardState.DONE]: styles.done,
};

const STATE_TONE: Record<StepCardState, BadgeTone> = {
  [StepCardState.LOCKED]: BadgeTone.LOCKED,
  [StepCardState.AWAITING_CODE]: BadgeTone.ACTIVE,
  [StepCardState.ACTIVE]: BadgeTone.ACTIVE,
  [StepCardState.DONE]: BadgeTone.DONE,
};

interface StepCardProps {
  state: StepCardState;
  /** Подпись состояния: «пройдено», «сейчас», «ждёт код» */
  stateLabel: string;
  /** Номер шага в маршруте */
  index?: number;
  title: ReactNode;
  /** Время, поправки, число подсказок — строкой под заголовком */
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Шаг маршрута: одинаково выглядит и на карте команды, и в админке. */
export function StepCard({
  state,
  stateLabel,
  index,
  title,
  meta,
  actions,
  children,
}: StepCardProps): ReactNode {
  return (
    <article className={classNames(styles.card, STATE_CLASS[state])}>
      <header className={styles.head}>
        {index !== undefined && <span className={styles.index}>{index}</span>}
        <div className={styles.headText}>
          <Badge tone={STATE_TONE[state]}>{stateLabel}</Badge>
          <div className={styles.title}>{title}</div>
        </div>
        {actions !== undefined && <div className={styles.actions}>{actions}</div>}
      </header>
      {meta !== undefined && <div className={styles.meta}>{meta}</div>}
      {children}
    </article>
  );
}
