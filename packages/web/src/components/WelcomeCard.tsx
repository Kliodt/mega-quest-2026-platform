import { type ReactNode } from 'react';
import { Button } from '../ui/index.js';
import styles from './WelcomeCard.module.scss';

interface WelcomeCardProps {
  onStart: () => void;
}

/** Первый код отсканирован: время пошло, и об этом команду предупреждают до задания. */
export function WelcomeCard({ onStart }: WelcomeCardProps): ReactNode {
  return (
    <div className={styles.welcome}>
      <p className={styles.title}>Добро пожаловать на квест</p>
      <p className={styles.lead}>
        Ваше время пошло, помните что у вас есть только 7,5 часов на прохождение
      </p>
      <p className={styles.wish}>Желаем удачи</p>
      <Button fullWidth onClick={onStart}>
        Перейти к заданию
      </Button>
    </div>
  );
}
