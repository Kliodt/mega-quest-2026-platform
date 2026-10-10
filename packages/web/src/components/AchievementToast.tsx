import { type AchievementDto } from '@quest/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button, ButtonVariant } from '../ui/index.js';
import { AchievementModal } from './AchievementModal.js';
import styles from './AchievementToast.module.scss';

/**
 * Три секунды на виду и ещё чуть-чуть на отъезд за край: столько же стоит в анимации
 * `slide-out`, поэтому тост пропадает ровно тогда, когда уехал.
 */
const VISIBLE_MS = 3280;

interface AchievementToastProps {
  /** Полученные достижения по порядку: последнее и есть свежее */
  achievements: AchievementDto[];
}

/** Достижение за засчитанный ответ: выезжает из правого верхнего угла и уходит само. */
export function AchievementToast({ achievements }: AchievementToastProps): ReactNode {
  const navigate = useNavigate();
  const seenCount = useRef<number | null>(null);
  const [earned, setEarned] = useState<AchievementDto | null>(null);
  /** Открытое окно живёт своей жизнью: тост к этому времени уже уехал */
  const [opened, setOpened] = useState<AchievementDto | null>(null);

  useEffect(() => {
    const seen = seenCount.current;
    seenCount.current = achievements.length;
    // Первое прохождение — только запоминаем: перезагрузка страницы не повод для тоста
    if (seen === null || achievements.length <= seen) {
      return;
    }
    setEarned(achievements[achievements.length - 1] ?? null);
  }, [achievements]);

  useEffect(() => {
    if (earned === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setEarned(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [earned]);

  const openMap = (): void => {
    setOpened(null);
    void navigate('/map');
  };

  return (
    <>
      {earned !== null && (
        <button
          type="button"
          className={styles.toast}
          onClick={() => setOpened(earned)}
          aria-label={`${earned.title}. Посмотреть достижение`}
        >
          <img className={styles.image} src={earned.image} alt="" />
          <span className={styles.title}>{earned.title}</span>
        </button>
      )}

      <AchievementModal
        achievement={opened}
        onClose={() => setOpened(null)}
        action={
          <Button variant={ButtonVariant.SECONDARY} onClick={openMap}>
            Все достижения
          </Button>
        }
      />
    </>
  );
}
