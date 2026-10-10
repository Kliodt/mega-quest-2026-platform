import { type QuestionFieldDto } from '@quest/shared';
import { type QuestionField } from '../../models/questionFields.js';

/** Наружу уходит DTO, а не поддокумент Mongo; пустой `data` не отдаём. */
export function toQuestionFieldDto(field: QuestionField): QuestionFieldDto {
  if (field.data === undefined || field.data === null) {
    return { html: field.html };
  }
  return { html: field.html, data: field.data };
}
