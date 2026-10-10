import { type BasicQuestionContentDto } from '@quest/shared';
import { type Question } from '../../models/questionFields.js';
import { toQuestionFieldDto } from './toQuestionFieldDto.js';

/** Что видит команда по умолчанию: только текст задания, без ответов. */
export function toBasicQuestionContentDto(question: Question): BasicQuestionContentDto {
  return toQuestionFieldDto(question);
}
