import { type BlitzQuestionContentDto, type BlitzQuizItemDto } from '@quest/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QuestionHtml } from '../../components/QuestionHtml.js';
import { Button, ButtonVariant, TimeValue } from '../../ui/index.js';
import { formatDuration } from '../../utils/format.js';
import { RoomCodeAnswer } from '../roomCodeAnswer/RoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';
import styles from './BlitzContent.module.scss';
import {
  BlitzPhase,
  BLITZ_ROUND_SECONDS,
  countCorrect,
  getBlitzPhase,
  getOptionOrder,
  getSecondsLeft,
  getTextOpacity,
  readAttempts,
  type BlitzRound,
} from './blitzRound.js';
import { HiddenCode } from './HiddenCode.js';

function readQuiz(content: unknown): BlitzQuizItemDto[] {
  if (typeof content === 'object' && content !== null) {
    const typed = content as Partial<BlitzQuestionContentDto>;
    return Array.isArray(typed.quiz) ? typed.quiz : [];
  }
  return [];
}

/**
 * МегаКвиз: восемь вопросов про фотографию и минута на всё. Верные варианты по ходу
 * раунда не подсвечиваются, счёт команда узнаёт в конце. Настоящий ответ шага — номер
 * следующей аудитории, и он спрятан в фоне викторины: виден только по контрастности.
 */
export function BlitzContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
  onReadRoomNumber,
  onEnterCode,
}: GameContentProps): ReactNode {
  const quiz = readQuiz(question.content);
  // Номер приходит с вопросом: по задумке команда достаёт его из фона сама
  const roomNumber = question.answers[0] ?? '';

  const [attempts, setAttempts] = useState(() => readAttempts(question.state));
  const [round, setRound] = useState<BlitzRound | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const secondsLeft = round === null ? BLITZ_ROUND_SECONDS : getSecondsLeft(round.startedAt, now);
  const phase = getBlitzPhase(round, quiz.length, secondsLeft);
  const ended = phase === BlitzPhase.TIMEOUT || phase === BlitzPhase.RESULT;

  useEffect(() => {
    if (phase !== BlitzPhase.RUNNING) {
      return undefined;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Попытка засчитывается, когда раунд кончился: успели ответить на всё или не успели
  const counted = useRef(false);
  useEffect(() => {
    if (!ended || counted.current) {
      return;
    }
    counted.current = true;
    const next = attempts + 1;
    setAttempts(next);
    onSaveState({ attempts: next });
  }, [ended, attempts, onSaveState]);

  const start = (): void => {
    counted.current = false;
    setNow(Date.now());
    setRound({ startedAt: Date.now(), chosen: [] });
  };

  const choose = (option: number): void => {
    setRound((current) => {
      if (current === null) {
        return current;
      }
      return { ...current, chosen: [...current.chosen, option] };
    });
  };

  return (
    <RoomCodeAnswer
      onSubmit={onSubmit}
      submitting={submitting}
      lastResult={lastResult}
      onReadRoomNumber={onReadRoomNumber}
      onEnterCode={onEnterCode}
    >
      <section className={styles.screen}>
        <HiddenCode code={roomNumber} attempt={attempts} />

        <div className={styles.content} style={{ opacity: getTextOpacity(attempts) }}>
          {phase === BlitzPhase.INTRO && <Intro attempts={attempts} onStart={start} />}

          {phase === BlitzPhase.RUNNING && round !== null && (
            <Round
              quiz={quiz}
              answered={round.chosen.length}
              attempts={attempts}
              secondsLeft={secondsLeft}
              onChoose={choose}
            />
          )}

          {phase === BlitzPhase.TIMEOUT && round !== null && (
            <Timeout
              answered={round.chosen.length}
              total={quiz.length}
              attempts={attempts}
              onRestart={start}
            />
          )}

          {phase === BlitzPhase.RESULT && round !== null && (
            <Result chosen={round.chosen} quiz={quiz} attempts={attempts} onRestart={start} />
          )}
        </div>
      </section>
    </RoomCodeAnswer>
  );
}

/** Сколько раундов команда уже отыграла: столько же раз выцвели вопросы */
function Attempts({ attempts }: { attempts: number }): ReactNode {
  if (attempts === 0) {
    return null;
  }
  return <span className={styles.attempts}>Попыток: {attempts}</span>;
}

function Intro({ attempts, onStart }: { attempts: number; onStart: () => void }): ReactNode {
  return (
    <div className={styles.screenText}>
      <div className={styles.head}>
        <h2 className={styles.title}>МегаКвиз</h2>
        <Attempts attempts={attempts} />
      </div>
      <p className={styles.lead}>
        Интеллектуальное соревнование, где важны не конкретные знания, а эрудиция и кругозор. Вместе
        со своей командой ты увидишь полноценное шоу: со своим лором, тематическим оформлением и
        номерами.
      </p>
      <Button fullWidth onClick={onStart}>
        Начать раунд
      </Button>
    </div>
  );
}

interface RoundProps {
  quiz: BlitzQuizItemDto[];
  answered: number;
  attempts: number;
  secondsLeft: number;
  onChoose: (option: number) => void;
}

function Round({ quiz, answered, attempts, secondsLeft, onChoose }: RoundProps): ReactNode {
  const item = quiz[answered];
  if (!item) {
    return null;
  }
  const passed = Math.round((answered / quiz.length) * 100);
  const order = getOptionOrder(item.options.length, attempts, answered);

  return (
    <div className={styles.round}>
      <header className={styles.status}>
        <span className={styles.counter}>
          Вопрос {answered + 1} из {quiz.length}
        </span>
        <TimeValue>{formatDuration(secondsLeft)}</TimeValue>
      </header>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${passed}%` }} />
      </div>

      <QuestionHtml html={item.html} className={styles.question} />

      <div className={styles.options}>
        {order.map((optionIndex) => (
          <button
            key={optionIndex}
            type="button"
            className={styles.option}
            onClick={() => onChoose(optionIndex)}
          >
            <QuestionHtml html={item.options[optionIndex]?.html ?? ''} as="span" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface TimeoutProps {
  answered: number;
  total: number;
  attempts: number;
  onRestart: () => void;
}

function Timeout({ answered, total, attempts, onRestart }: TimeoutProps): ReactNode {
  return (
    <div className={styles.screenText}>
      <div className={styles.head}>
        <h2 className={styles.title}>Время вышло</h2>
        <Attempts attempts={attempts} />
      </div>
      <p className={styles.lead}>
        Успели ответить на {answered} из {total}. Раунд не засчитан — начните заново.
      </p>
      <Button fullWidth onClick={onRestart}>
        Пройти заново
      </Button>
    </div>
  );
}

interface ResultProps {
  chosen: number[];
  quiz: BlitzQuizItemDto[];
  attempts: number;
  onRestart: () => void;
}

/** Где ошиблись — видно, верный вариант — нет: иначе раунд теряет смысл. */
function Verdict({ correct }: { correct: boolean }): ReactNode {
  if (correct) {
    return <span className={styles.right}>верно</span>;
  }
  return <span className={styles.wrong}>мимо</span>;
}

function Result({ chosen, quiz, attempts, onRestart }: ResultProps): ReactNode {
  const correctOptions = quiz.map((item) => item.correctOption);
  const score = countCorrect(chosen, correctOptions);

  return (
    <div className={styles.screenText}>
      <div className={styles.head}>
        <h2 className={styles.title}>Раунд пройден</h2>
        <Attempts attempts={attempts} />
      </div>
      <p className={styles.lead}>
        Верно {score} из {quiz.length}.
      </p>
      <ol className={styles.verdicts}>
        {quiz.map((item, index) => (
          <li key={index} className={styles.verdict}>
            <span className={styles.verdictIndex}>{index + 1}</span>
            <QuestionHtml html={item.html} className={styles.verdictText} as="span" />
            <Verdict correct={chosen[index] === item.correctOption} />
          </li>
        ))}
      </ol>
      <Button variant={ButtonVariant.SECONDARY} fullWidth onClick={onRestart}>
        Пройти заново
      </Button>
    </div>
  );
}
