import { LocationTitles, type AdminBindingDto } from '@quest/shared';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { AdminModal } from '../components/AdminModal.js';
import { BindingForm } from '../components/BindingForm.js';
import { useAdminBindingsQuery, useDeleteBindingMutation } from '../queries.js';
import styles from './AdminBindingsPage.module.scss';

/** Коды на дверях: что за каждым кодом и есть ли в той аудитории вопрос. */
export function AdminBindingsPage(): ReactNode {
  const bindingsQuery = useAdminBindingsQuery();
  const remove = useDeleteBindingMutation();
  const [editing, setEditing] = useState<AdminBindingDto | null>(null);
  const [creating, setCreating] = useState(false);

  const closeForm = (): void => {
    setCreating(false);
    setEditing(null);
  };

  const handleDelete = (binding: AdminBindingDto): void => {
    const confirmed = window.confirm(
      `Убрать код ${binding.code} с аудитории ${binding.roomNumber}? Открыть её будет нечем.`,
    );
    if (confirmed) {
      remove.mutate(binding.code);
    }
  };

  if (bindingsQuery.isPending) {
    return <Spinner label="Загружаем коды…" />;
  }
  if (bindingsQuery.isError) {
    return <ErrorBanner message={getErrorMessage(bindingsQuery.error)} />;
  }

  const bindings = bindingsQuery.data.bindings;

  let removeError: string | null = null;
  if (remove.isError) {
    removeError = getErrorMessage(remove.error);
  }

  return (
    <>
      <div className={styles.header}>
        <h1>Коды на дверях</h1>
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
        title={editing === null ? 'Новый код' : `Код ${editing.code}`}
        onClose={closeForm}
      >
        <BindingForm
          key={editing?.code ?? 'new'}
          binding={editing}
          onSaved={closeForm}
          onCancel={closeForm}
        />
      </AdminModal>

      <p className="muted">Всего кодов: {bindings.length}</p>

      <table className="table">
        <thead>
          <tr>
            <th>Корпус</th>
            <th>Аудитория</th>
            <th>Код</th>
            <th>Вопросов</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bindings.map((binding) => (
            <tr key={binding.code}>
              <td>{LocationTitles[binding.location]}</td>
              <td className="mono">{binding.roomTitle}</td>
              <td className="mono">{binding.code}</td>
              <td
                className={classNames('mono', {
                  [styles.empty ?? '']: binding.questionsCount === 0,
                })}
              >
                {binding.questionsCount}
              </td>
              <td className={styles.actions}>
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => {
                    setCreating(false);
                    setEditing(binding);
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  disabled={remove.isPending}
                  onClick={() => handleDelete(binding)}
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
