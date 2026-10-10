import { type YandexQuestionContentDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { TextAnswer } from '../basicGame/TextAnswer.js';
import { type GameContentProps } from '../types.js';
import styles from './YandexContent.module.scss';

const VIDEO_TITLE = 'Яндекс в ИТМО: что студенты думают об этой точке на карте?';

function readVideoUrl(content: unknown): string | null {
  if (typeof content !== 'object' || content === null) {
    return null;
  }
  const { videoUrl } = content as Partial<YandexQuestionContentDto>;
  if (typeof videoUrl !== 'string' || videoUrl === '') {
    return null;
  }
  return videoUrl;
}

/** Яндекс: у каждой команды свой ролик, ответ — расшифрованное слово. */
export function YandexContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
}: GameContentProps): ReactNode {
  const videoUrl = readVideoUrl(question.content);

  return (
    <TextAnswer
      onSubmit={onSubmit}
      submitting={submitting}
      lastResult={lastResult}
      onSaveState={onSaveState}
      state={question.state}
    >
      <h2 className={styles.title}>{VIDEO_TITLE}</h2>

      {videoUrl !== null && (
        // Субтитров к ролику организаторы не дали; появятся — добавить сюда <track>
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video className={styles.video} src={videoUrl} controls playsInline preload="metadata" />
      )}

      <QuestionPrompt content={question.content} />
    </TextAnswer>
  );
}
