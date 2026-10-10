import { Location, LocationTitles, type AdminBindingDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useAdminBindingsQuery, useSaveBindingMutation } from '../queries.js';
import styles from './BindingForm.module.scss';

const CODE_PATTERN = '[a-zA-Z0-9]{8}';

/** Номер из введённого: пометка в скобках — для организаторов, платформа знает номер */
function toRoomNumber(value: string): string {
  return value.trim().split(/[\s(]/)[0] ?? '';
}

interface BindingFormProps {
  /** Код, который правим; null — заводим новый */
  binding: AdminBindingDto | null;
  onSaved: () => void;
  onCancel: () => void;
}

/** Заведение кода и перенос его в другую аудиторию: у кода одна дверь, у двери кодов бывает и два. */
export function BindingForm({ binding, onSaved, onCancel }: BindingFormProps): ReactNode {
  const save = useSaveBindingMutation();
  const bindingsQuery = useAdminBindingsQuery();
  const [code, setCode] = useState(binding?.code ?? '');
  const [location, setLocation] = useState<Location>(binding?.location ?? Location.LOMO);
  // Аудиторию правят так же, как пишут в таблице: «107 (Б14)», номер платформа возьмёт сама
  const [roomNumber, setRoomNumber] = useState(binding?.roomTitle ?? '');

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    save.mutate(
      { code: code.trim(), location, roomNumber: roomNumber.trim() },
      { onSuccess: onSaved },
    );
  };

  let errorMessage: string | null = null;
  if (save.isError) {
    errorMessage = getErrorMessage(save.error);
  }

  // Второй код на ту же дверь разрешён: предупреждаем, но не мешаем
  const number = toRoomNumber(roomNumber);
  const neighbours = (bindingsQuery.data?.bindings ?? []).filter(
    (other) =>
      other.code !== code.trim() && other.location === location && other.roomNumber === number,
  );

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <ErrorBanner message={errorMessage} />
      {neighbours.length > 0 && (
        <p className={styles.notice}>
          У этой аудитории уже есть код {neighbours.map((other) => other.code).join(', ')}. Ничего
          страшного: сработает любой из них.
        </p>
      )}
      <div className={styles.fields}>
        <label className="field">
          <span>Код на двери</span>
          <input
            className="input mono"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            pattern={CODE_PATTERN}
            title="8 латинских букв или цифр, регистр важен"
            required
            readOnly={binding !== null}
            disabled={save.isPending}
          />
        </label>
        <label className="field">
          <span>Корпус</span>
          <select
            className="input"
            value={location}
            onChange={(event) => setLocation(event.target.value as Location)}
            disabled={save.isPending}
          >
            {Object.values(Location).map((value) => (
              <option key={value} value={value}>
                {LocationTitles[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Аудитория</span>
          <input
            className="input mono"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
            required
            maxLength={30}
            title="Номер, при необходимости с пометкой: 107 (Б14)"
            disabled={save.isPending}
          />
        </label>
      </div>
      <div className={styles.actions}>
        <button className="btn" type="submit" disabled={save.isPending}>
          {save.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button
          className="btn btn--secondary"
          type="button"
          onClick={onCancel}
          disabled={save.isPending}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
