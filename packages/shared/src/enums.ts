/** Типы игр (механики); описание каждой — в `api/src/games/<type>/README.md`. */
export enum GameType {
  SHAZAM = 'SHAZAM',
  BLITZ = 'BLITZ',
  GOOGLE_FORMS = 'GOOGLE_FORMS',
  ENCYCLOPEDIA = 'ENCYCLOPEDIA',
  HISTORY = 'HISTORY',
  TELEVISIONS = 'TELEVISIONS',
  LIGHT = 'LIGHT',
  MINESWEEPER = 'MINESWEEPER',
  SOCIAL_NETWORKS = 'SOCIAL_NETWORKS',
  SOUND_BUTTONS = 'SOUND_BUTTONS',
  STICKERS = 'STICKERS',
  YAGODNOE = 'YAGODNOE',
  YANDEX = 'YANDEX',
}

export enum Location {
  LOMO = 'lomo',
  CRONVA = 'cronva',
  BIRJA = 'birja',
  CHAIKA = 'chaika',
  GRIVA = 'griva',
}

export enum StepKind {
  LOCATION_TRANSITION = 'LOCATION_TRANSITION',
  ROOM_TRANSITION = 'ROOM_TRANSITION',
  QUESTION = 'QUESTION',
}

export enum QuestPhase {
  LOCATION_TRANSITION = 'LOCATION_TRANSITION',
  ROOM_TRANSITION = 'ROOM_TRANSITION',
  QUESTION = 'QUESTION',
  FINISHED = 'FINISHED',
}

export enum TeamStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

/** Только причина поправки; направление задаёт знак секунд. */
export enum TimeAdjustmentType {
  WRONG_ANSWER = 'WRONG_ANSWER',
  HINT = 'HINT',
  /** Ручной штраф организатора */
  PENALTY = 'PENALTY',
  /** Ручная компенсация времени */
  COMPENSATION = 'COMPENSATION',
  OTHER = 'OTHER',
}

export enum StepState {
  LOCKED = 'LOCKED',
  AWAITING_CODE = 'AWAITING_CODE',
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
}

// Коды ошибок API живут вместе со своими сообщениями в src/errors/
