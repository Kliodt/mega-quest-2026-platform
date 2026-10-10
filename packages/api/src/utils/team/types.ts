import { type TeamStatus, type TeamStep } from '@quest/shared';
import { type TimeAdjustment } from '../../models/Team.js';
import { type ProgressQuestionInput, type ProgressStateInput } from '../progress/types.js';

export interface AdminTeamDetailInput {
  team: {
    id: string;
    name: string;
    status: TeamStatus;
    sequence: TeamStep[];
    currentStepIndex: number;
  };
  states: ProgressStateInput[];
  /** Вопросы маршрута по ключу аудитории (`toRoomKey`); в аудитории их бывает несколько */
  questionsByRoom: ReadonlyMap<string, ProgressQuestionInput[]>;
  timeAdjustments: TimeAdjustment[];
  now: Date;
}
