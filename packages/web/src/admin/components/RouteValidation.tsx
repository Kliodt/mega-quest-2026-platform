import { type ReactNode } from 'react';
import { Link } from 'react-router';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useValidationMutation } from '../queries.js';
import styles from './RouteValidation.module.scss';

/** Та же проверка, что гоняется при старте API, только по кнопке. */
export function RouteValidation(): ReactNode {
  const validate = useValidationMutation();
  const result = validate.data;

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => validate.mutate()}
        disabled={validate.isPending}
      >
        {validate.isPending ? 'Проверяем…' : 'Проверить маршруты'}
      </button>

      {validate.isError && <ErrorBanner message={getErrorMessage(validate.error)} />}

      {result?.ok === true && (
        <p className={styles.ok}>
          Маршруты всех команд ({result.checkedTeams}) сходятся с вопросами.
        </p>
      )}

      {result?.ok === false && (
        <div className={styles.problems}>
          <p className={styles.bad}>
            Маршрут не сходится у {result.problems.length} команд из {result.checkedTeams}:
          </p>
          <ul className={styles.list}>
            {result.problems.map((problem) => (
              <li key={problem.teamId}>
                <Link to={`/admin/teams/${problem.teamId}`}>{problem.teamName}</Link>
                <ul>
                  {problem.errors.map((error) => (
                    <li key={error} className="muted">
                      {error}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
