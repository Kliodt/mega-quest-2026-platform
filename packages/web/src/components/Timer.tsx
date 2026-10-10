import { type TimerDto } from '@quest/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { TimeValue, TimeValueSize } from '../ui/index.js';
import { formatDuration } from '../utils/format.js';
import styles from './Timer.module.scss';

interface TimerProps {
  timer: TimerDto;
  receivedAt: number;
  paused: boolean;
}

/** Часы показывают настоящее время на заданиях; поправки стоят под ними отдельной строкой. */
export function computeDisplaySeconds(timer: TimerDto, receivedAt: number, now: number): number {
  if (!timer.running) {
    return timer.elapsedSeconds;
  }
  const sinceReceived = Math.max(0, Math.floor((now - receivedAt) / 1000));
  return timer.elapsedSeconds + sinceReceived;
}

/** Время команды: тикает от серверного значения, на переходе между корпусами стоит. */
export function Timer({ timer, receivedAt, paused }: TimerProps): ReactNode {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer.running) {
      return undefined;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const seconds = computeDisplaySeconds(timer, receivedAt, now);

  return (
    <TimeValue size={TimeValueSize.LARGE} paused={paused} className={styles.timer}>
      {formatDuration(seconds)}
    </TimeValue>
  );
}
