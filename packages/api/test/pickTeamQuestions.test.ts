import { describe, expect, it } from 'vitest';
import { pickTeamQuestions } from '../src/utils/question/pickTeamQuestions.js';

const OWN = { id: 'own', teamSlugs: ['team_garaj', 'team_dinamit'] };
const STRANGER = { id: 'stranger', teamSlugs: ['team_matrix'] };
const SHARED = { id: 'shared', teamSlugs: [] };

describe('pickTeamQuestions', () => {
  it('отдаёт команде её именной вариант', () => {
    expect(pickTeamQuestions([SHARED, STRANGER, OWN], 'team_garaj')).toEqual([OWN]);
  });

  it('без именного варианта берёт общие', () => {
    expect(pickTeamQuestions([SHARED, STRANGER], 'team_garaj')).toEqual([SHARED]);
  });

  /** Ответ у вариантов один, поэтому чужой текст лучше, чем аудитория без вопроса */
  it('когда общих не осталось, отдаёт что есть', () => {
    expect(pickTeamQuestions([STRANGER], 'team_garaj')).toEqual([STRANGER]);
  });
});
