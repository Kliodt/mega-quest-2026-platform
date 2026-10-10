import { LocationTitles, type AdminCellDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { MINESWEEPER_SIZE } from '../../games/minesweeper/minesweeperSize.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { AdminModal } from '../components/AdminModal.js';
import { CellForm } from '../components/CellForm.js';
import { useAdminCellsQuery, useDeleteCellMutation } from '../queries.js';
import styles from './AdminCellsPage.module.scss';

/** Клетка глазами организатора: столбец и строка с единицы, как на `/pub/minesweeper`. */
function formatCell(cell: AdminCellDto): string {
  return `${cell.col + 1}-${cell.row + 1}`;
}

/** Коды клеток сапёра: их расклеивают в аудитории, и правятся они как коды на дверях. */
export function AdminCellsPage(): ReactNode {
  const cellsQuery = useAdminCellsQuery();
  const remove = useDeleteCellMutation();
  const [editing, setEditing] = useState<AdminCellDto | null>(null);
  const [creating, setCreating] = useState(false);

  const closeForm = (): void => {
    setCreating(false);
    setEditing(null);
  };

  const handleDelete = (cell: AdminCellDto): void => {
    const confirmed = window.confirm(
      `Убрать код ${cell.code} с клетки ${formatCell(cell)}? Выбрать её будет нечем.`,
    );
    if (confirmed) {
      remove.mutate(cell.code);
    }
  };

  if (cellsQuery.isPending) {
    return <Spinner label="Загружаем клетки…" />;
  }
  if (cellsQuery.isError) {
    return <ErrorBanner message={getErrorMessage(cellsQuery.error)} />;
  }

  const cells = cellsQuery.data.cells;
  const total = MINESWEEPER_SIZE.rows * MINESWEEPER_SIZE.cols;

  let removeError: string | null = null;
  if (remove.isError) {
    removeError = getErrorMessage(remove.error);
  }

  return (
    <>
      <div className={styles.header}>
        <h1>Коды клеток сапёра</h1>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          Завести код
        </button>
      </div>

      <ErrorBanner message={removeError} />

      <AdminModal
        open={creating || editing !== null}
        title={editing === null ? 'Новый код клетки' : `Код ${editing.code}`}
        onClose={closeForm}
      >
        <CellForm
          key={editing?.code ?? 'new'}
          cell={editing}
          onSaved={closeForm}
          onCancel={closeForm}
        />
      </AdminModal>

      <p className="muted">
        Клеток с кодами: {cells.length} из {total} (поле {MINESWEEPER_SIZE.cols} ×{' '}
        {MINESWEEPER_SIZE.rows}). Клетка записана как столбец-строка, счёт с единицы.
      </p>

      <table className="table">
        <thead>
          <tr>
            <th>Корпус</th>
            <th>Аудитория</th>
            <th>Клетка</th>
            <th>Код</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {cells.map((cell) => (
            <tr key={cell.code}>
              <td>{LocationTitles[cell.location]}</td>
              <td className="mono">{cell.roomNumber}</td>
              <td className="mono">{formatCell(cell)}</td>
              <td className="mono">{cell.code}</td>
              <td className={styles.actions}>
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => {
                    setCreating(false);
                    setEditing(cell);
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  disabled={remove.isPending}
                  onClick={() => handleDelete(cell)}
                >
                  Убрать
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
