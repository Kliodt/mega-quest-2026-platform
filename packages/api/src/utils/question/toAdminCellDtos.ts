import { type AdminCellDto, type RoomRef } from '@quest/shared';

interface CellsQuestion {
  rooms: RoomRef[];
  cells: { code: string; row: number; col: number }[];
}

/**
 * Коды клеток для организатора: у каждого видно, к какому вопросу он относится.
 * Вопрос называет его первая аудитория — клетки расклеены именно там, где он стоит.
 */
export function toAdminCellDtos(questions: CellsQuestion[]): AdminCellDto[] {
  return questions.flatMap((question) => {
    const room = question.rooms[0];
    if (!room) {
      return [];
    }
    return question.cells.map((cell) => ({
      location: room.location,
      roomNumber: room.roomNumber,
      code: cell.code,
      row: cell.row,
      col: cell.col,
    }));
  });
}
