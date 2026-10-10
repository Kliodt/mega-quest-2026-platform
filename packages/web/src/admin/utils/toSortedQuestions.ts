import { Location, type AdminQuestionDto } from '@quest/shared';

/** Корпуса идут в порядке enum: так же они перечислены везде в проекте */
const LOCATION_ORDER = Object.values(Location);

function toRank(question: AdminQuestionDto): [number, number, string] {
  const room = question.rooms[0];
  if (!room) {
    return [LOCATION_ORDER.length, Number.MAX_SAFE_INTEGER, ''];
  }
  const locationRank = LOCATION_ORDER.indexOf(room.location);
  const roomRank = Number.parseInt(room.roomNumber, 10);
  return [
    locationRank,
    Number.isNaN(roomRank) ? Number.MAX_SAFE_INTEGER : roomRank,
    room.roomNumber,
  ];
}

/** Вопросы по корпусам, внутри корпуса — по номеру аудитории. Вопрос стоит там, где первая. */
export function toSortedQuestions(questions: AdminQuestionDto[]): AdminQuestionDto[] {
  return [...questions].sort((left, right) => {
    const [leftLocation, leftRoom, leftText] = toRank(left);
    const [rightLocation, rightRoom, rightText] = toRank(right);
    if (leftLocation !== rightLocation) {
      return leftLocation - rightLocation;
    }
    if (leftRoom !== rightRoom) {
      return leftRoom - rightRoom;
    }
    return leftText.localeCompare(rightText);
  });
}
