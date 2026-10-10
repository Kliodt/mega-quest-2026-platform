import { Location, LocationTitles, type AdminCellDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { MINESWEEPER_SIZE } from '../../games/minesweeper/minesweeperSize.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useSaveCellMutation } from '../queries.js';
import styles from './CellForm.module.scss';

const CODE_PATTERN = '[a-zA-Z0-9]{8}';

interface CellFormProps {
  /** Код, который правим; null — заводим новый */
  cell: AdminCellDto | null;
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * Заведение кода клетки и перенос его на другую клетку. Клетки нумеруются с единицы,
 * как их видит организатор на странице проверки кодов, а в базе они с нуля.
 */
export function CellForm({ cell, onSaved, onCancel }: CellFormProps): ReactNode {
  const save = useSaveCellMutation();
  const [code, setCode] = useState(cell?.code ?? '');
  const [location, setLocation] = useState<Location>(cell?.location ?? Location.CRONVA);
  const [roomNumber, setRoomNumber] = useState(cell?.roomNumber ?? '');
  const [col, setCol] = useState(String((cell?.col ?? 0) + 1));
  const [row, setRow] = useState(String((cell?.row ?? 0) + 1));

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    save.mutate(
      {
        code: code.trim(),
        location,
        roomNumber: roomNumber.trim(),
        col: Number(col) - 1,
        row: Number(row) - 1,
      },
      { onSuccess: onSaved },
    );
  };

  let errorMessage: string | null = null;
  if (save.isError) {
    errorMessage = getErrorMessage(save.error);
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <ErrorBanner message={errorMessage} />
      <div className={styles.fields}>
        <label className="field">
          <span>Код клетки</span>
          <input
            className="input mono"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            pattern={CODE_PATTERN}
            title="8 латинских букв или цифр, регистр важен"
            required
            readOnly={cell !== null}
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
          <span>Аудитория вопроса</span>
          <input
            className="input mono"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
            required
            maxLength={20}
            disabled={save.isPending}
          />
        </label>
        <label className="field">
          <span>Столбец</span>
          <input
            className="input mono"
            type="number"
            value={col}
            onChange={(event) => setCol(event.target.value)}
            min={1}
            max={MINESWEEPER_SIZE.cols}
            required
            disabled={save.isPending}
          />
        </label>
        <label className="field">
          <span>Строка</span>
          <input
            className="input mono"
            type="number"
            value={row}
            onChange={(event) => setRow(event.target.value)}
            min={1}
            max={MINESWEEPER_SIZE.rows}
            required
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
