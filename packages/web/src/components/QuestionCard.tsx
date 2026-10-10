import { LocationTitles, type QuestionViewDto } from '@quest/shared';
import { type ReactNode } from 'react';
import {
  useEnterCodeMutation,
  useRoomNumberMutation,
  useSaveStateMutation,
  useSubmitAnswerMutation,
} from '../api/queries.js';
import { useQuestionStateWatch } from '../api/useQuestionStateWatch.js';
import { gameTypes } from '../games/registry.js';
import { type LastAnswerResult } from '../games/types.js';
import { Banner, RoomPlate, RoomPlateSize } from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { formatRoomNumber, isNamedPlace } from '../utils/formatRoomNumber.js';
import { HintsPanel } from './HintsPanel.js';
import styles from './QuestionCard.module.scss';
import { SupportButton } from './SupportButton.js';

interface QuestionCardProps {
  question: QuestionViewDto;
}

/** Рамка вопроса от core; содержимое и форму ответа рисует компонент типа игры. */
export function QuestionCard({ question }: QuestionCardProps): ReactNode {
  const submit = useSubmitAnswerMutation();
  const saveState = useSaveStateMutation();
  const roomNumber = useRoomNumberMutation();
  const enterCode = useEnterCodeMutation();
  const { Content, fullscreen = false } = gameTypes[question.gameType];

  // Ответ придёт извне: ждём его долгим запросом, чтобы экран сменился сам
  useQuestionStateWatch(question.waitsForExternalAnswer);

  let lastResult: LastAnswerResult | null = null;
  if (submit.isSuccess) {
    lastResult = {
      correct: submit.data.correct,
      penaltySecondsAdded: submit.data.penaltySecondsAdded,
    };
  }

  // Корпус всегда строкой ниже, под номером; «ауд.» к месту со своим именем не приписываем
  const location = <span className={styles.location}>{LocationTitles[question.location]}</span>;
  let caption: ReactNode = location;
  if (!isNamedPlace(question.roomNumber)) {
    caption = (
      <>
        ауд.
        {location}
      </>
    );
  }

  let errorMessage: string | null = null;
  if (submit.isError) {
    errorMessage = getErrorMessage(submit.error);
  } else if (saveState.isError) {
    errorMessage = `Черновик не сохранился: ${getErrorMessage(saveState.error)}`;
  }

  const content = (
    <Content
      key={`game-${question.stepIndex}`}
      question={question}
      onSubmit={(answer) => submit.mutateAsync({ answer })}
      submitting={submit.isPending}
      lastResult={lastResult}
      onSaveState={(state) => saveState.mutate(state)}
      onReadRoomNumber={async (code) => (await roomNumber.mutateAsync({ code })).roomNumber}
      onEnterCode={async (code) => {
        await enterCode.mutateAsync({ code });
      }}
    />
  );

  // Игра во весь экран рисует и рамку вопроса сама: аудитория, подсказки и ошибки — в её окне
  if (fullscreen) {
    return content;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.head}>
        <div className={styles.row}>
          <RoomPlate
            size={RoomPlateSize.COMPACT}
            roomNumber={formatRoomNumber(question.roomNumber)}
            caption={caption}
          />
          <div className={styles.tools}>
            <SupportButton />
            <HintsPanel hints={question.hints} nextHintIndex={question.nextHintIndex} />
          </div>
        </div>
        {question.wrongAttemptsCount > 0 && (
          <span className={styles.attempts}>неверных попыток: {question.wrongAttemptsCount}</span>
        )}
      </header>

      <Banner message={errorMessage} />

      {content}
    </div>
  );
}
