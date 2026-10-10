import { type MinesweeperFieldDto } from '@quest/shared';

/**
 * Поле, которое проходится рассуждением, без угадывания. Алгоритм взят из
 * github.com/w29ahmed/minesweeper: раскладываем поле, прогоняем по нему решатель
 * с детерминированными правилами и, пока не сошлось, переставляем мины местами.
 * Поиск ограничен по времени, чтобы первый клик не подвисал.
 */
const TIME_BUDGET_MS = 250;
/** Доля мин, переставляемых в потомке */
const MUTATION_SWAP_PERCENT = 3;
/** Сколько мутаций без улучшения терпим, прежде чем начать с нуля */
const MUTATION_PATIENCE = 100;

type Direction = readonly [number, number];

const DIRECTIONS: readonly Direction[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export interface Cell {
  row: number;
  col: number;
}

type Grid = boolean[][];

function at(grid: Grid, row: number, col: number): boolean {
  return grid[row]?.[col] ?? false;
}

function set(grid: Grid, row: number, col: number, value: boolean): void {
  const line = grid[row];
  if (line) {
    line[col] = value;
  }
}

function toGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function generateSolvableField(
  rows: number,
  cols: number,
  mines: number,
  safe: Cell,
): MinesweeperFieldDto {
  const start = Date.now();
  const swapCount = Math.max(1, Math.ceil((mines * MUTATION_SWAP_PERCENT) / 100));
  let parent: Grid | null = null;
  let best: Grid | null = null;
  let bestScore = -1;
  let noImprove = 0;
  let attempts = 0;

  while (attempts === 0 || Date.now() - start < TIME_BUDGET_MS) {
    attempts += 1;
    if (parent && noImprove >= MUTATION_PATIENCE) {
      parent = null;
      noImprove = 0;
    }

    const mutated = parent ? mutate(parent, safe, swapCount) : null;
    const field: Grid = mutated ?? toRandomField(rows, cols, mines, safe);

    // Первый клик должен открыть пустую область, иначе игра начинается с угадывания
    if (countAdjacent(field, safe.row, safe.col) !== 0) {
      continue;
    }

    const { solved, score } = solve(field, safe);
    if (solved) {
      return field;
    }
    if (score > bestScore) {
      bestScore = score;
      best = field;
      parent = field;
      noImprove = 0;
      continue;
    }
    noImprove += 1;
  }

  return best ?? toRandomField(rows, cols, mines, safe);
}

/** Мины в случайных клетках; клетка первого клика и её соседи остаются пустыми. */
function toRandomField(rows: number, cols: number, mines: number, safe: Cell): Grid {
  const candidates: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!isSafeZone(row, col, safe)) {
        candidates.push({ row, col });
      }
    }
  }
  shuffle(candidates);

  const field = toGrid(rows, cols);
  for (const { row, col } of candidates.slice(0, mines)) {
    set(field, row, col, true);
  }
  return field;
}

/** Потомок: несколько мин переезжают в свободные клетки, число мин не меняется. */
function mutate(parent: Grid, safe: Cell, swapCount: number): Grid | null {
  const field = parent.map((row) => [...row]);
  const mined: Cell[] = [];
  const empty: Cell[] = [];
  field.forEach((cells, row) =>
    cells.forEach((isMine, col) => {
      if (isSafeZone(row, col, safe)) {
        return;
      }
      if (isMine) {
        mined.push({ row, col });
        return;
      }
      empty.push({ row, col });
    }),
  );
  if (mined.length < swapCount || empty.length < swapCount) {
    return null;
  }

  shuffle(mined);
  shuffle(empty);
  for (let index = 0; index < swapCount; index += 1) {
    const from = mined[index];
    const to = empty[index];
    if (!from || !to) {
      continue;
    }
    set(field, from.row, from.col, false);
    set(field, to.row, to.col, true);
  }
  return field;
}

interface Constraint {
  unknowns: Cell[];
  remaining: number;
}

interface SolveResult {
  solved: boolean;
  /** Сколько клеток решатель осилил: по нему выбираем лучшее поле, если идеального нет */
  score: number;
}

/** Проходится ли поле рассуждением от этой клетки, без единого угадывания. */
export function isSolvableWithoutGuessing(field: MinesweeperFieldDto, safe: Cell): boolean {
  return solve(field, safe).solved;
}

/**
 * Детерминированный решатель: сначала два школьных правила («цифра набрана —
 * остальные соседи чистые», «цифре не хватает ровно столько — все они мины»),
 * а когда они встают — правило подмножеств для более человеческих выводов.
 */
function solve(field: Grid, safe: Cell): SolveResult {
  const rows = field.length;
  const cols = field[0]?.length ?? 0;
  const opened = toGrid(rows, cols);
  const flagged = toGrid(rows, cols);
  const safeCells = rows * cols - countMines(field);

  let openedCount = open(field, opened, flagged, safe.row, safe.col);
  let flaggedCount = 0;
  let progress = true;

  while (progress) {
    progress = false;
    const toOpen: Cell[] = [];
    const toFlag: Cell[] = [];
    const constraints: Constraint[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!at(opened, row, col)) {
          continue;
        }
        const unknowns: Cell[] = [];
        let flags = 0;
        for (const [dRow, dCol] of DIRECTIONS) {
          const nRow = row + dRow;
          const nCol = col + dCol;
          if (!inBounds(rows, cols, nRow, nCol)) {
            continue;
          }
          if (at(flagged, nRow, nCol)) {
            flags += 1;
            continue;
          }
          if (!at(opened, nRow, nCol)) {
            unknowns.push({ row: nRow, col: nCol });
          }
        }
        if (unknowns.length === 0) {
          continue;
        }

        const adjacent = countAdjacent(field, row, col);
        if (adjacent - flags >= 0) {
          constraints.push({ unknowns, remaining: adjacent - flags });
        }
        if (adjacent === flags) {
          toOpen.push(...unknowns);
        } else if (adjacent === flags + unknowns.length) {
          toFlag.push(...unknowns);
        }
      }
    }

    if (toOpen.length === 0 && toFlag.length === 0 && constraints.length > 1) {
      const subset = applySubsetRule(constraints);
      toOpen.push(...subset.safe);
      toFlag.push(...subset.mines);
    }

    for (const { row, col } of toFlag) {
      if (at(flagged, row, col) || at(opened, row, col)) {
        continue;
      }
      set(flagged, row, col, true);
      flaggedCount += 1;
      progress = true;
    }
    for (const { row, col } of toOpen) {
      const added = open(field, opened, flagged, row, col);
      if (added > 0) {
        openedCount += added;
        progress = true;
      }
    }
  }

  return { solved: openedCount >= safeCells, score: openedCount + flaggedCount };
}

/**
 * Правило подмножеств: если неизвестные соседи одной цифры целиком входят в соседей
 * другой, про разницу между ними известно всё — там либо только чистые, либо только мины.
 */
function applySubsetRule(constraints: Constraint[]): { safe: Cell[]; mines: Cell[] } {
  const toKey = ({ row, col }: Cell): string => `${row}-${col}`;
  const sets = constraints.map((constraint) => ({
    ...constraint,
    keys: new Set(constraint.unknowns.map(toKey)),
  }));
  const safe = new Map<string, Cell>();
  const mines = new Map<string, Cell>();

  for (const inner of sets) {
    for (const outer of sets) {
      if (inner === outer || inner.keys.size >= outer.keys.size) {
        continue;
      }
      if (![...inner.keys].every((key) => outer.keys.has(key))) {
        continue;
      }
      const diff = outer.unknowns.filter((cell) => !inner.keys.has(toKey(cell)));
      if (diff.length === 0) {
        continue;
      }
      const remainingDiff = outer.remaining - inner.remaining;
      if (remainingDiff === 0) {
        diff.forEach((cell) => safe.set(toKey(cell), cell));
      } else if (remainingDiff === diff.length) {
        diff.forEach((cell) => mines.set(toKey(cell), cell));
      }
    }
  }

  return { safe: [...safe.values()], mines: [...mines.values()] };
}

/** Открывает клетку и, если она пустая, всё вокруг неё; возвращает число открытых. */
function open(field: Grid, opened: Grid, flagged: Grid, row: number, col: number): number {
  if (at(opened, row, col) || at(flagged, row, col) || at(field, row, col)) {
    return 0;
  }
  set(opened, row, col, true);
  let count = 1;
  if (countAdjacent(field, row, col) !== 0) {
    return count;
  }
  const rows = field.length;
  const cols = field[0]?.length ?? 0;
  for (const [dRow, dCol] of DIRECTIONS) {
    const nRow = row + dRow;
    const nCol = col + dCol;
    if (inBounds(rows, cols, nRow, nCol)) {
      count += open(field, opened, flagged, nRow, nCol);
    }
  }
  return count;
}

function countAdjacent(field: Grid, row: number, col: number): number {
  return DIRECTIONS.filter(([dRow, dCol]) => at(field, row + dRow, col + dCol)).length;
}

function countMines(field: Grid): number {
  return field.reduce((count, row) => count + row.filter((isMine) => isMine).length, 0);
}

function inBounds(rows: number, cols: number, row: number, col: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/** Клетка первого клика и восемь её соседей: там мин не бывает */
function isSafeZone(row: number, col: number, safe: Cell): boolean {
  return Math.abs(row - safe.row) <= 1 && Math.abs(col - safe.col) <= 1;
}

function shuffle<T>(items: T[]): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    const left = items[index] as T;
    const right = items[other] as T;
    items[index] = right;
    items[other] = left;
  }
}
