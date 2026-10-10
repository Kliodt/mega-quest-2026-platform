import { type YagodnoeQuestionContentDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { QuestionHtml } from '../../components/QuestionHtml.js';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { TextAnswer } from '../basicGame/TextAnswer.js';
import { type GameContentProps } from '../types.js';
import styles from './YagodnoeContent.module.scss';

const PHOTO_SRC = '/games/yagodnoe.jpg';

function readContent(content: unknown): Partial<YagodnoeQuestionContentDto> {
  if (typeof content === 'object' && content !== null) {
    return content;
  }
  return {};
}

/** Ягодное: вводная, анкеты участников в таблице и ответ строкой. */
export function YagodnoeContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
}: GameContentProps): ReactNode {
  const { intro, tableUrl } = readContent(question.content);

  return (
    <TextAnswer
      onSubmit={onSubmit}
      submitting={submitting}
      lastResult={lastResult}
      onSaveState={onSaveState}
      state={question.state}
    >
      <img className={styles.photo} src={PHOTO_SRC} alt="" />

      {intro !== undefined && <QuestionHtml className={styles.intro} html={intro.html} />}

      {tableUrl !== undefined && (
        <a className={styles.table} href={tableUrl} target="_blank" rel="noreferrer">
          Анкеты участников
        </a>
      )}

      <QuestionPrompt content={question.content} />
    </TextAnswer>
  );
}
