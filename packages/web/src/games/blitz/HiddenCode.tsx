import { type ReactNode } from 'react';
import styles from './HiddenCode.module.scss';

interface HiddenCodeProps {
  /** Номер следующей аудитории: глазом его не видно, он проявляется контрастностью */
  code: string;
  /** Попытка задаёт наклон: перепройденный раунд выглядит иначе прошлого */
  attempt: number;
}

/**
 * Код на заднем фоне викторины. Цвет отличается от подложки на единицу по каждому
 * каналу, буквы наклонены и растянуты — прочитать их можно, только подняв контрастность
 * снимка экрана.
 */
export function HiddenCode({ code, attempt }: HiddenCodeProps): ReactNode {
  const tilt = -14 - (attempt % 3) * 5;

  return (
    <div className={styles.layer} aria-hidden="true">
      <span
        className={styles.code}
        style={{ transform: `rotate(${tilt}deg) skewX(-12deg) scaleY(1.45)` }}
      >
        {code}
      </span>
    </div>
  );
}
