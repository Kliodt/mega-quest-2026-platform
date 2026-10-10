import {
  MinesweeperAnswer,
  type MinesweeperCellDto,
  type MinesweeperFieldDto,
  type MinesweeperStateDto,
} from '@quest/shared';
import classNames from 'classnames';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { QrScanner } from '../../components/QrScanner.js';
import { Banner, BannerTone, Button, ButtonSize, ButtonVariant } from '../../ui/index.js';
import { toWrongAnswerMessage } from '../../utils/format.js';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { type GameContentProps } from '../types.js';
import { generateSolvableField } from './generateSolvableField.js';
import { getCellLabel } from './getCellLabel.js';
import styles from './MinesweeperContent.module.scss';
import { MINESWEEPER_MODE_LABEL, MINESWEEPER_MODES, MinesweeperMode } from './minesweeperMode.js';
import { MinesweeperOverlay, type MinesweeperOverlayHandle } from './MinesweeperOverlay.js';
import { MINESWEEPER_SIZE } from './minesweeperSize.js';
import { openMinesweeperCells } from './openMinesweeperCells.js';
import { readMinesweeperCells } from './readMinesweeperCells.js';
import { readMinesweeperField } from './readMinesweeperField.js';

const UNKNOWN_CODE = 'Этот код не от клетки поля';

/** Выбранная клетка: в ручном режиме кода у неё нет, только место на поле */
interface SelectedCell {
  row: number;
  col: number;
}

function readCells(state: unknown, key: keyof MinesweeperStateDto): Set<number> {
  if (typeof state === 'object' && state !== null) {
    const cells = (state as Partial<MinesweeperStateDto>)[key];
    if (Array.isArray(cells)) {
      return new Set(cells.filter((cell): cell is number => typeof cell === 'number'));
    }
  }
  return new Set();
}

/**
 * Клетку команда выбирает не пальцем, а сканированием: коды клеток расклеены в аудитории.
 * Игру ведёт фронт — он же раскладывает поле, на бэкенд уходит только исход.
 */
export function MinesweeperContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
}: GameContentProps): ReactNode {
  const { rows, cols, mines } = MINESWEEPER_SIZE;
  const codes = useMemo(() => readMinesweeperCells(question.content), [question.content]);
  /** Поле раскладывается по первому открытию — под него, чтобы игра не начиналась с угадывания */
  const [field, setField] = useState(() => readMinesweeperField(question.state));
  const [openedCells, setOpenedCells] = useState(() => readCells(question.state, 'openedCells'));
  const [blownCells, setBlownCells] = useState(() => readCells(question.state, 'blownCells'));
  const [flaggedCells, setFlaggedCells] = useState(() => readCells(question.state, 'flaggedCells'));
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [mode, setMode] = useState(MinesweeperMode.SCAN);
  const overlayRef = useRef<MinesweeperOverlayHandle>(null);
  /** Клетка кода, который в кадре прямо сейчас: по ней слой поверх камеры строит поле */
  const visibleCellRef = useRef<MinesweeperCellDto | null>(null);

  const safeCellCount = rows * cols - mines;
  const solved = safeCellCount > 0 && openedCells.size >= safeCellCount;

  const saveState = (
    currentField: MinesweeperFieldDto,
    opened: Set<number>,
    blown: Set<number>,
    flagged: Set<number>,
  ): void => {
    const state: MinesweeperStateDto = {
      field: currentField,
      openedCells: [...opened],
      blownCells: [...blown],
      flaggedCells: [...flagged],
    };
    onSaveState(state);
  };

  const handleScan = (value: string | null): void => {
    if (value === null || solved) {
      visibleCellRef.current = null;
      return;
    }
    const cell = codes.get(value.trim().toLowerCase());
    if (!cell) {
      visibleCellRef.current = null;
      setScanError(UNKNOWN_CODE);
      return;
    }
    visibleCellRef.current = cell;
    setScanError(null);
    setSelected(cell);
  };

  const selectedIndex = selected === null ? null : selected.row * cols + selected.col;
  const isOpened = selectedIndex !== null && openedCells.has(selectedIndex);
  const isBlown = selectedIndex !== null && blownCells.has(selectedIndex);
  const isFlagged = selectedIndex !== null && flaggedCells.has(selectedIndex);

  const handleOpen = (): void => {
    if (selected === null || selectedIndex === null || isOpened || isBlown || isFlagged) {
      return;
    }
    const { row, col } = selected;
    const currentField = field ?? generateSolvableField(rows, cols, mines, { row, col });
    if (field === null) {
      setField(currentField);
    }

    if (currentField[row]?.[col] === true) {
      const blown = new Set(blownCells).add(selectedIndex);
      setBlownCells(blown);
      setSelected(null);
      saveState(currentField, openedCells, blown, flaggedCells);
      void onSubmit({ text: MinesweeperAnswer.EXPLODED });
      return;
    }

    const opened = openMinesweeperCells(currentField, openedCells, row, col);
    setOpenedCells(opened);
    setSelected(null);
    saveState(currentField, opened, blownCells, flaggedCells);
    if (opened.size >= safeCellCount) {
      void onSubmit({ text: MinesweeperAnswer.SOLVED });
    }
  };

  const handleFlag = (): void => {
    if (selectedIndex === null || isOpened || isBlown) {
      return;
    }
    const flagged = new Set(flaggedCells);
    if (isFlagged) {
      flagged.delete(selectedIndex);
    } else {
      flagged.add(selectedIndex);
    }
    setFlaggedCells(flagged);
    // До первого открытия поля ещё нет, и сохранять нечего: флаг доживёт до него на экране
    if (field !== null) {
      saveState(field, openedCells, blownCells, flagged);
    }
  };

  let feedback: ReactNode = null;
  if (solved) {
    feedback = <Banner tone={BannerTone.SUCCESS} message="Поле пройдено" />;
  } else if (lastResult !== null && !lastResult.correct) {
    feedback = <Banner message={toWrongAnswerMessage('Мина', lastResult.penaltySecondsAdded)} />;
  }

  const manual = mode === MinesweeperMode.MANUAL;
  const augmented = mode === MinesweeperMode.AUGMENTED;

  let selection = 'Наведите камеру на код клетки';
  if (manual) {
    selection = 'Выберите клетку на поле';
  }
  if (selected !== null) {
    selection = `Клетка ${selected.col + 1}-${selected.row + 1}`;
  }

  return (
    <div className={styles.game}>
      {MINESWEEPER_MODES.length > 1 && (
        <div className={styles.modes} role="group" aria-label="Как выбирать клетку">
          {MINESWEEPER_MODES.map((value) => (
            <Button
              key={value}
              size={ButtonSize.SMALL}
              variant={value === mode ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
              fullWidth
              onClick={() => setMode(value)}
            >
              {MINESWEEPER_MODE_LABEL[value]}
            </Button>
          ))}
        </div>
      )}

      {!manual && (
        <div className={styles.camera}>
          <QrScanner
            onCode={handleScan}
            paused={solved}
            onCorners={(corners) => overlayRef.current?.draw(corners, visibleCellRef.current)}
            overlay={
              augmented ? (
                <MinesweeperOverlay
                  ref={overlayRef}
                  field={field}
                  openedCells={openedCells}
                  blownCells={blownCells}
                  flaggedCells={flaggedCells}
                />
              ) : null
            }
          />
        </div>
      )}
      <p className={styles.selection}>{selection}</p>

      <Banner message={scanError} />
      {feedback}

      {/* В кадре поле уже нарисовано: второе такое же под камерой только мешает */}
      {!augmented && (
        <div className={styles.field} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: rows * cols }, (_, cell) => {
            const row = Math.floor(cell / cols);
            const col = cell % cols;
            const opened = openedCells.has(cell);
            const blown = blownCells.has(cell);
            const flagged = flaggedCells.has(cell);
            return (
              <button
                key={cell}
                type="button"
                className={classNames(
                  styles.cell,
                  opened && styles.opened,
                  blown && styles.blown,
                  cell === selectedIndex && styles.selected,
                )}
                disabled={!manual || solved}
                onClick={() => setSelected({ row, col })}
              >
                {getCellLabel(field, row, col, { opened, blown, flagged })}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          fullWidth
          disabled={selected === null || isOpened || isBlown || isFlagged || solved}
          loading={submitting}
          loadingLabel="Проверяем…"
          onClick={handleOpen}
        >
          Открыть
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          fullWidth
          disabled={selected === null || isOpened || isBlown || solved}
          onClick={handleFlag}
        >
          {isFlagged ? 'Снять флаг' : 'Поставить флаг'}
        </Button>
      </div>

      <p className={styles.counters}>
        <span>Мин: {mines}</span>
        <span>Флагов: {flaggedCells.size}</span>
        <span>
          Открыто: {openedCells.size} из {safeCellCount}
        </span>
      </p>

      {/* Задание внизу: сверху должно помещаться главное — камера, поле и кнопки */}
      <QuestionPrompt content={question.content} />
    </div>
  );
}
