import {
  Location,
  LocationTitles,
  StepKind,
  toRoomKey,
  type RoomRefDto,
  type TeamStepDto,
} from '@quest/shared';
import classNames from 'classnames';
import { type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { STEP_KIND_LABEL } from '../labels.js';
import { useAdminQuestionsQuery } from '../queries.js';
import styles from './RouteEditor.module.scss';

interface RouteEditorProps {
  value: TeamStepDto[];
  onChange: (sequence: TeamStepDto[]) => void;
  /** Шаги с индексом ≤ этого уже пройдены командой и не редактируются; -1 — всё свободно */
  lockedThroughIndex: number;
}

const KINDS = [StepKind.LOCATION_TRANSITION, StepKind.ROOM_TRANSITION, StepKind.QUESTION];

const ROOMS_LABEL: Record<StepKind, string> = {
  [StepKind.QUESTION]: 'Допустимые аудитории',
  [StepKind.LOCATION_TRANSITION]: 'Аудитория выхода из корпуса',
  [StepKind.ROOM_TRANSITION]: '',
};

function describeRooms(rooms: RoomRefDto[] | undefined): string {
  if (!rooms || rooms.length === 0) {
    return '—';
  }
  return rooms
    .map((room) => `ауд. ${room.roomNumber} (${LocationTitles[room.location]})`)
    .join(', ');
}

/** У пройденного шага аудитории только показываются: перечислять все допустимые незачем. */
function StepRooms({ step }: { step: TeamStepDto }): ReactNode {
  if (step.kind === StepKind.ROOM_TRANSITION) {
    return null;
  }
  return (
    <div className={styles.rooms}>
      <div className="muted">{ROOMS_LABEL[step.kind]}</div>
      {describeRooms(step.options)}
    </div>
  );
}

function makeStep(kind: StepKind, previous: TeamStepDto | undefined): TeamStepDto {
  if (kind === StepKind.QUESTION) {
    if (previous?.kind === StepKind.QUESTION) {
      return { kind, options: previous.options };
    }
    return { kind, options: [] };
  }
  return { kind };
}

/** Список шагов; правила чередования и корпусов проверяет сервер. */
export function RouteEditor({ value, onChange, lockedThroughIndex }: RouteEditorProps): ReactNode {
  const questionsQuery = useAdminQuestionsQuery();

  const update = (index: number, step: TeamStepDto): void => {
    onChange(value.map((current, i) => (i === index ? step : current)));
  };

  const remove = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (index: number, delta: number): void => {
    const target = index + delta;
    if (target < 0 || target >= value.length || target <= lockedThroughIndex) {
      return;
    }
    const next = [...value];
    const [step] = next.splice(index, 1);
    if (step) {
      next.splice(target, 0, step);
    }
    onChange(next);
  };

  const append = (): void => {
    const last = value[value.length - 1];
    const kind = last?.kind === StepKind.QUESTION ? StepKind.ROOM_TRANSITION : StepKind.QUESTION;
    onChange([...value, makeStep(kind, undefined)]);
  };

  const toggleOption = (index: number, step: TeamStepDto, room: RoomRefDto): void => {
    if (step.kind !== StepKind.QUESTION) {
      return;
    }
    const key = toRoomKey(room);
    const options = step.options.some((option) => toRoomKey(option) === key)
      ? step.options.filter((option) => toRoomKey(option) !== key)
      : [...step.options, { location: room.location, roomNumber: room.roomNumber }];
    update(index, { kind: StepKind.QUESTION, options });
  };

  /** Аудитория выхода из корпуса: её скан закрывает предыдущий вопрос и останавливает время. */
  const setExitRoom = (index: number, room: Partial<RoomRefDto>): void => {
    const current = value[index];
    if (current?.kind !== StepKind.LOCATION_TRANSITION) {
      return;
    }
    const previous = current.options?.[0];
    const location = room.location ?? previous?.location ?? Location.LOMO;
    const roomNumber = (room.roomNumber ?? previous?.roomNumber ?? '').trim();
    if (roomNumber === '') {
      update(index, { kind: StepKind.LOCATION_TRANSITION });
      return;
    }
    update(index, { kind: StepKind.LOCATION_TRANSITION, options: [{ location, roomNumber }] });
  };

  if (questionsQuery.isPending) {
    return <Spinner label="Загружаем вопросы…" />;
  }
  if (questionsQuery.isError) {
    return <ErrorBanner message={getErrorMessage(questionsQuery.error)} />;
  }
  // Маршрут ссылается на аудитории: у вопроса их несколько, и в одной аудитории бывает несколько вопросов
  const roomsByKey = new Map(
    questionsQuery.data.questions
      .flatMap((question) => question.rooms)
      .map((room) => [toRoomKey(room), room]),
  );
  const rooms = [...roomsByKey.values()];

  return (
    <div className={styles.editor}>
      {lockedThroughIndex >= 0 && (
        <p className="muted">
          Шаги до №{lockedThroughIndex + 1} включительно команда уже прошла, их менять нельзя.
        </p>
      )}
      <ol className={styles.steps}>
        {value.map((step, index) => {
          const locked = index <= lockedThroughIndex;
          return (
            <li key={index} className={classNames(styles.step, locked && styles.locked)}>
              <span className={classNames('mono', styles.index)}>{index + 1}</span>
              <select
                className="input"
                aria-label={`Вид шага ${index + 1}`}
                value={step.kind}
                disabled={locked}
                onChange={(event) => update(index, makeStep(event.target.value as StepKind, step))}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {STEP_KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
              {locked && <StepRooms step={step} />}
              {!locked && step.kind === StepKind.LOCATION_TRANSITION && index > 0 && (
                <fieldset className={styles.options}>
                  <legend className="muted">Аудитория выхода из корпуса</legend>
                  <div className={styles.exit}>
                    <select
                      className="input"
                      aria-label={`Корпус выхода шага ${index + 1}`}
                      value={step.options?.[0]?.location ?? Location.LOMO}
                      onChange={(event) =>
                        setExitRoom(index, { location: event.target.value as Location })
                      }
                    >
                      {Object.values(Location).map((location) => (
                        <option key={location} value={location}>
                          {LocationTitles[location]}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input mono"
                      aria-label={`Аудитория выхода шага ${index + 1}`}
                      placeholder="номер"
                      value={step.options?.[0]?.roomNumber ?? ''}
                      onChange={(event) => setExitRoom(index, { roomNumber: event.target.value })}
                    />
                  </div>
                  <p className="muted">
                    Её код закрывает предыдущий вопрос и останавливает время. Пусто — если корпус
                    закрывает вопрос с обычным ответом.
                  </p>
                </fieldset>
              )}
              {!locked && step.kind === StepKind.QUESTION && (
                <fieldset className={styles.options}>
                  <legend className="muted">Допустимые аудитории</legend>
                  {rooms.map((room) => (
                    <label key={toRoomKey(room)} className={styles.option}>
                      <input
                        type="checkbox"
                        checked={step.options.some(
                          (option) => toRoomKey(option) === toRoomKey(room),
                        )}
                        onChange={() => toggleOption(index, step, room)}
                      />
                      <span>
                        ауд. {room.roomNumber}{' '}
                        <span className="muted">{LocationTitles[room.location]}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              {!locked && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => move(index, -1)}
                    disabled={index - 1 <= lockedThroughIndex}
                    aria-label="Выше"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label="Ниже"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => remove(index)}
                    aria-label="Удалить шаг"
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div>
        <button type="button" className="btn btn--secondary btn--small" onClick={append}>
          Добавить шаг
        </button>
      </div>
    </div>
  );
}
