import { type AdminTeamDetailDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { RouteForm } from './RouteForm.js';
import styles from './RouteSection.module.scss';
import { StepsMap } from './StepsMap.js';

interface RouteSectionProps {
  detail: AdminTeamDetailDto;
  onRewind: (stepIndex: number) => void;
  rewinding: boolean;
  onAnswer: () => void;
  answering: boolean;
  onScan: () => void;
  scanning: boolean;
}

/** Маршрут команды: как она его проходит, а по кнопке — те же шаги в редакторе. */
export function RouteSection({
  detail,
  onRewind,
  rewinding,
  onAnswer,
  answering,
  onScan,
  scanning,
}: RouteSectionProps): ReactNode {
  const [editing, setEditing] = useState(false);

  return (
    <section className="stack">
      <div className={styles.header}>
        <h2 className="sectionTitle">Маршрут</h2>
        <button
          type="button"
          className="btn btn--secondary btn--small"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Закрыть редактор' : 'Изменить маршрут'}
        </button>
      </div>
      {!editing && (
        <StepsMap
          steps={detail.steps}
          onRewind={onRewind}
          rewinding={rewinding}
          onAnswer={onAnswer}
          answering={answering}
          onScan={onScan}
          scanning={scanning}
        />
      )}
      {editing && (
        <RouteForm
          key={JSON.stringify(detail.team.sequence)}
          detail={detail}
          onSaved={() => setEditing(false)}
        />
      )}
    </section>
  );
}
