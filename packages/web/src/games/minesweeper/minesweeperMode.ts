/**
 * Как команда выбирает клетку. Режим переключается на экране: коды в аудитории могут
 * не читаться, а разложенное поле иногда удобнее видеть прямо на стене.
 */
export enum MinesweeperMode {
  /** Клетка выбирается пальцем на поле, камера не нужна */
  MANUAL = 'manual',
  /** Клетку называет отсканированный код, поле стоит под камерой */
  SCAN = 'scan',
  /** Поле рисуется прямо в кадре вокруг отсканированного кода */
  AUGMENTED = 'augmented',
}

export const MINESWEEPER_MODE_LABEL: Record<MinesweeperMode, string> = {
  [MinesweeperMode.MANUAL]: 'Вручную',
  [MinesweeperMode.SCAN]: 'Сканер',
  [MinesweeperMode.AUGMENTED]: 'В кадре',
};

/**
 * Режимы, которые команда видит на экране. На квесте оставлен один — скан кода клетки:
 * коды расклеены в аудитории, и выбирать клетку пальцем или ловить поле в кадре не нужно.
 * Остальные режимы работают, их достаточно раскомментировать.
 */
export const MINESWEEPER_MODES: MinesweeperMode[] = [
  // MinesweeperMode.MANUAL,
  MinesweeperMode.SCAN,
  // MinesweeperMode.AUGMENTED,
];
