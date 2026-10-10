import { type BasicDraftStateDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { Banner, Button, TextField } from '../../ui/index.js';
import { toWrongAnswerMessage } from '../../utils/format.js';
import { type GameContentProps, type LastAnswerResult } from '../types.js';
import styles from './TextAnswer.module.scss';

const MAX_ANSWER_LENGTH = 500;

interface TextAnswerProps {
  onSubmit: GameContentProps['onSubmit'];
  submitting: boolean;
  lastResult: LastAnswerResult | null;
  onSaveState: (state: unknown) => void;
  /** Состояние прохождения: в нём лежит черновик ответа */
  state: unknown;
  /** Текст задания рисует конкретная игра */
  children: ReactNode;
}

function readDraft(state: unknown): string {
  if (typeof state === 'object' && state !== null) {
    const draft = (state as Partial<BasicDraftStateDto>).draft;
    if (typeof draft === 'string') {
      return draft;
    }
  }
  return '';
}

/** Ответ строкой; черновик хранится в состоянии прохождения, чтобы пережить перезагрузку. */
export function TextAnswer({
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
  state,
  children,
}: TextAnswerProps): ReactNode {
  const [text, setText] = useState(() => readDraft(state));
  const [savedDraft, setSavedDraft] = useState(() => readDraft(state));

  const saveDraft = (): void => {
    if (text !== savedDraft) {
      setSavedDraft(text);
      onSaveState({ draft: text });
    }
  };

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    if (text.trim() === '') {
      return;
    }
    void onSubmit({ text });
  };

  let wrongMessage: string | null = null;
  if (lastResult !== null && !lastResult.correct) {
    wrongMessage = toWrongAnswerMessage('Неверный ответ', lastResult.penaltySecondsAdded);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {children}
      <TextField
        label="Ваш ответ"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={saveDraft}
        disabled={submitting}
        autoComplete="off"
        maxLength={MAX_ANSWER_LENGTH}
      />
      <Banner message={wrongMessage} />
      <Button
        type="submit"
        fullWidth
        disabled={text.trim() === ''}
        loading={submitting}
        loadingLabel="Проверяем…"
      >
        Ответить
      </Button>
    </form>
  );
}
