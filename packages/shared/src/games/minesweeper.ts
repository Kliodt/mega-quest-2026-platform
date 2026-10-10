import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/** Поле сапёра: ряды клеток, `true` — мина. */
export const MinesweeperFieldSchema = Type.Array(Type.Array(Type.Boolean()));
export type MinesweeperFieldDto = Static<typeof MinesweeperFieldSchema>;

/** Код на QR и клетка, к которой он привязан: свои коды сапёра, не коды на дверях. */
export const MinesweeperCellSchema = Type.Object({
  code: Type.String(),
  row: Type.Integer({ minimum: 0 }),
  col: Type.Integer({ minimum: 0 }),
});
export type MinesweeperCellDto = Static<typeof MinesweeperCellSchema>;

/** `QuestionViewDto.content` сапёра: задание и коды клеток поля. */
export const MinesweeperQuestionContentSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({ cells: Type.Array(MinesweeperCellSchema) }),
]);
export type MinesweeperQuestionContentDto = Static<typeof MinesweeperQuestionContentSchema>;

/** Исход игры вместо ответа: подрыв — неверный, пройденное поле — верный. */
export enum MinesweeperAnswer {
  SOLVED = '1',
  EXPLODED = '0',
}

/** Ход игры в `PUT /quest/state`; клетка — её номер `row * cols + col`. */
export const MinesweeperStateSchema = Type.Object({
  /** Поле, разложенное фронтом при первом открытии: перезагрузка его не меняет */
  field: MinesweeperFieldSchema,
  openedCells: Type.Array(Type.Integer({ minimum: 0 })),
  /** Подорванные мины: за них штраф уже взят, второй раз не берём */
  blownCells: Type.Array(Type.Integer({ minimum: 0 })),
  /** Клетки, помеченные флагом: открыть их можно только сняв флаг */
  flaggedCells: Type.Array(Type.Integer({ minimum: 0 })),
});
export type MinesweeperStateDto = Static<typeof MinesweeperStateSchema>;
