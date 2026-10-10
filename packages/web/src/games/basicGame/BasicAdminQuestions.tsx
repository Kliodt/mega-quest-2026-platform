import { type BasicAdminQuestionDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { QuestionHtml } from '../../components/QuestionHtml.js';
import { formatPenalty } from '../../utils/format.js';
import { type AdminQuestionsProps } from '../types.js';
import styles from './BasicAdminQuestions.module.scss';

/** Вопросы игры для организатора: с правильными ответами и подсказками. */
export function BasicAdminQuestions({ questions }: AdminQuestionsProps): ReactNode {
  const typed = questions as BasicAdminQuestionDto[];
  if (typed.length === 0) {
    return <p className="muted">Содержимого нет.</p>;
  }

  return (
    <ol className={styles.list}>
      {typed.map((question, index) => (
        <li key={index} className={styles.item}>
          <div className={styles.prompt}>
            <span className="muted">#{index + 1}</span>
            <QuestionHtml html={question.html} />
          </div>
          <dl className={styles.meta}>
            <dt>Ответы</dt>
            <dd>
              {question.hasDynamicAnswer && (
                <span className="muted">
                  подставляется при открытии: аудитория следующего вопроса команды
                </span>
              )}
              {question.acceptedAnswers.map((answer, answerIndex) => (
                <QuestionHtml key={answerIndex} html={answer.html} />
              ))}
              {question.answerIsNextRoom && !question.hasDynamicAnswer && (
                <span className="muted">это номер следующей аудитории</span>
              )}
            </dd>
            <dt>Штраф за ошибку</dt>
            <dd className="mono">{formatPenalty(question.wrongAttemptPenaltySeconds)}</dd>
            <dt>Подсказки</dt>
            <dd>
              <ol className={styles.hints}>
                {question.hints.map((hint, hintIndex) => (
                  <li key={hintIndex}>
                    <QuestionHtml html={hint.html} />
                    <span className="mono muted">{formatPenalty(hint.penaltySeconds)}</span>
                  </li>
                ))}
              </ol>
            </dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}
