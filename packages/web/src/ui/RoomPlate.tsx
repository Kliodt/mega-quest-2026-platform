import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './RoomPlate.module.scss';

export enum RoomPlateSize {
  /** Во весь экран: куда идти прямо сейчас */
  HERO = 'hero',
  /** В строке карточки: где команда уже была */
  COMPACT = 'compact',
}

const SIZE_CLASS: Record<RoomPlateSize, string | undefined> = {
  [RoomPlateSize.HERO]: styles.hero,
  [RoomPlateSize.COMPACT]: styles.compact,
};

interface RoomPlateProps {
  /** Номер на двери: главный ориентир команды. Несколько номеров склеивает вызывающий */
  roomNumber: string;
  /** Корпус или пояснение под номером */
  caption?: ReactNode;
  size?: RoomPlateSize;
  className?: string | undefined;
}

/** Табличка на двери: номер аудитории набран витринным шрифтом с синим сдвигом. */
export function RoomPlate({
  roomNumber,
  caption,
  size = RoomPlateSize.HERO,
  className,
}: RoomPlateProps): ReactNode {
  return (
    <div className={classNames(styles.plate, SIZE_CLASS[size], className)}>
      <span className={styles.number}>{roomNumber}</span>
      {caption !== undefined && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}
