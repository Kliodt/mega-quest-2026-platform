import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { type GameContentProps } from '../types.js';
import styles from './SocialNetworksContent.module.scss';

const VIDEO_SRC = '/videos/quest.mp4';
const VIDEO_POSTER = '/videos/quest-poster.jpg';

/**
 * Соцсети: ответ команда не вводит. В ролике лежит ссылка на `/pub/confirm_video`, и
 * переход по ней с того же устройства засчитывает задание.
 */
export function SocialNetworksContent({ question }: GameContentProps): ReactNode {
  return (
    <div className={styles.game}>
      <QuestionPrompt content={question.content} />

      {/* Субтитров к ролику организаторы не дали; появятся — добавить сюда <track> */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        className={styles.video}
        src={VIDEO_SRC}
        poster={VIDEO_POSTER}
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
}
