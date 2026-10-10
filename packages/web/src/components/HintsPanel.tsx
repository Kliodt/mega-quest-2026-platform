import { type HintDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { useTakeHintMutation } from '../api/queries.js';
import { Banner, Button, ButtonSize, ButtonVariant, Modal } from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { formatAdjustment, pluralizeMinutes } from '../utils/format.js';
import styles from './HintsPanel.module.scss';
import { QuestionHtml } from './QuestionHtml.js';

interface HintsPanelProps {
  hints: HintDto[];
  nextHintIndex: number | null;
}

const SECONDS_IN_MINUTE = 60;

function toMinutes(seconds: number): number {
  return Math.round(seconds / SECONDS_IN_MINUTE);
}

/** Подсказки одинаковы для всех типов игр, поэтому кнопка и запрос — часть core. */
export function HintsPanel({ hints, nextHintIndex }: HintsPanelProps): ReactNode {
  const takeHint = useTakeHintMutation();
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState<number | null>(null);

  if (hints.length === 0) {
    return null;
  }

  const takenCount = hints.filter((hint) => hint.taken).length;

  const take = (hint: HintDto): void => {
    takeHint.mutate({ hintIndex: hint.index }, { onSuccess: () => setAsking(null) });
  };

  const close = (): void => {
    setOpen(false);
    setAsking(null);
  };

  let errorMessage: string | null = null;
  if (takeHint.isError) {
    errorMessage = getErrorMessage(takeHint.error);
  }

  return (
    <>
      <Button
        className={styles.button}
        size={ButtonSize.SMALL}
        variant={ButtonVariant.SECONDARY}
        onClick={() => setOpen(true)}
      >
        {/* Лампочка из Font Awesome Free 6.7 (иконки — CC BY 4.0, fontawesome.com/license/free) */}
        <svg className={styles.bulb} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.7 54.4 49.2 86.2l160 0zM192 512c44.2 0 80-35.8 80-80l0-16-160 0 0 16c0 44.2 35.8 80 80 80zM112 176c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80z" />
        </svg>
        Подсказки {takenCount} из {hints.length}
      </Button>

      <Modal open={open} title="Подсказки" onClose={close}>
        <Banner message={errorMessage} />

        <ol className={styles.list}>
          {hints.map((hint) => (
            <li key={hint.index} className={styles.item}>
              <span className={styles.label}>Подсказка {hint.index + 1}</span>

              {hint.taken && hint.html !== null && (
                <QuestionHtml html={hint.html} className={styles.text} />
              )}

              {!hint.taken && hint.index === nextHintIndex && asking !== hint.index && (
                <Button
                  size={ButtonSize.SMALL}
                  variant={ButtonVariant.SECONDARY}
                  onClick={() => setAsking(hint.index)}
                >
                  Открыть за {formatAdjustment(hint.penaltySeconds)}
                </Button>
              )}

              {!hint.taken && asking === hint.index && (
                <div className={styles.confirm}>
                  <p className={styles.ask}>
                    Открыть подсказку за{' '}
                    <span className={styles.penalty}>
                      {toMinutes(hint.penaltySeconds)} штрафных{' '}
                      {pluralizeMinutes(toMinutes(hint.penaltySeconds))}
                    </span>
                  </p>
                  <div className={styles.confirmActions}>
                    <Button
                      size={ButtonSize.SMALL}
                      loading={takeHint.isPending}
                      loadingLabel="Открываем…"
                      onClick={() => take(hint)}
                    >
                      Открыть подсказку
                    </Button>
                    <Button
                      size={ButtonSize.SMALL}
                      variant={ButtonVariant.GHOST}
                      onClick={() => setAsking(null)}
                    >
                      Не надо
                    </Button>
                  </div>
                </div>
              )}

              {!hint.taken && hint.index !== nextHintIndex && (
                <span className={styles.locked}>
                  откроется следующей, {formatAdjustment(hint.penaltySeconds)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
