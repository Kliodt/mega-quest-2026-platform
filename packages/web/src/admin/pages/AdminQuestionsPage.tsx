import { LocationTitles, toRoomKey } from '@quest/shared';
import classNames from 'classnames';
import { Fragment, useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { gameTypes } from '../../games/registry.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { AnswerFlags } from '../components/AnswerFlags.js';
import { useAdminQuestionsQuery } from '../queries.js';
import { toRoomVariantCounts } from '../utils/toRoomVariantCounts.js';
import { toSortedQuestions } from '../utils/toSortedQuestions.js';
import styles from './AdminQuestionsPage.module.scss';

/** Все вопросы квеста; содержимое с ответами рисует компонент типа игры. */
export function AdminQuestionsPage(): ReactNode {
  const questionsQuery = useAdminQuestionsQuery();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (questionsQuery.isPending) {
    return <Spinner label="Загружаем вопросы…" />;
  }
  if (questionsQuery.isError) {
    return <ErrorBanner message={getErrorMessage(questionsQuery.error)} />;
  }

  const questions = toSortedQuestions(questionsQuery.data.questions);
  const variantCounts = toRoomVariantCounts(questionsQuery.data.questions);

  return (
    <>
      <h1>Вопросы</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Тип</th>
            <th>Ответ</th>
            <th>Аудитории</th>
            <th>Команды</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => {
            const isOpen = openIndex === index;
            const AdminQuestions = gameTypes[question.gameType].AdminQuestions;
            return (
              // Вопросы одного типа стоят в одних и тех же аудиториях, поэтому различает их только порядок
              <Fragment key={index}>
                <tr>
                  <td>{gameTypes[question.gameType].label}</td>
                  <td className={styles.flags}>
                    <AnswerFlags
                      answerIsNextRoom={question.answerIsNextRoom}
                      hasDynamicAnswer={question.hasDynamicAnswer}
                      waitsForExternalAnswer={question.waitsForExternalAnswer}
                    />
                  </td>
                  <td className={classNames('mono', styles.room)}>
                    {question.rooms.map((room, roomIndex) => {
                      const variants = variantCounts.get(toRoomKey(room)) ?? 1;
                      return (
                        <span key={toRoomKey(room)}>
                          {roomIndex > 0 && ', '}
                          {`${room.roomNumber} (${LocationTitles[room.location]})`}
                          {variants > 1 && (
                            <span
                              className={styles.variants}
                              title={`Вариантов вопроса в этой аудитории: ${variants}`}
                            >
                              ×{variants}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </td>
                  <td className={styles.teams}>
                    {question.teamNames.length === 0 && <span className="muted">всем</span>}
                    {question.teamNames.length > 0 && (
                      <span title={question.teamNames.join(', ')}>{question.teamNames.length}</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? 'Скрыть' : 'Показать'}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={5} className={styles.content}>
                      <AdminQuestions questions={[question.content]} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
