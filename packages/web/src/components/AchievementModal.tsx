import { type AchievementDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { Modal } from '../ui/index.js';
import styles from './AchievementModal.module.scss';

interface AchievementModalProps {
  /** Что показываем; `null` — окно закрыто */
  achievement: AchievementDto | null;
  onClose: () => void;
  /** Кнопка под названием: с тоста она уводит на карту */
  action?: ReactNode;
}

/** Достижение крупно: его разглядывают, собирая ответ на стикерах. */
export function AchievementModal({
  achievement,
  onClose,
  action,
}: AchievementModalProps): ReactNode {
  return (
    <Modal open={achievement !== null} title="Достижение" onClose={onClose}>
      {achievement !== null && (
        <div className={styles.card}>
          <img className={styles.image} src={achievement.image} alt="" />
          <p className={styles.title}>{achievement.title}</p>
          {action}
        </div>
      )}
    </Modal>
  );
}
