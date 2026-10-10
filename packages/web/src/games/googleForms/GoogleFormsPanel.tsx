import { type QuestionViewDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { HintsPanel } from '../../components/HintsPanel.js';
import { ScanButton } from '../../components/ScanButton.js';
import { SupportButton } from '../../components/SupportButton.js';
import { Timer } from '../../components/Timer.js';
import { useQuestOutletContext } from '../../pages/questOutletContext.js';
import { Banner, Modal, TimeAdjustmentValue } from '../../ui/index.js';
import { formatAdjustment } from '../../utils/format.js';
import styles from './GoogleFormsPanel.module.scss';

interface GoogleFormsPanelProps {
  open: boolean;
  onClose: () => void;
  question: QuestionViewDto;
  /** Открыть сканер кода: ответ на это задание — номер следующей аудитории */
  onScan: () => void;
  scanning: boolean;
  error: string | null;
  wrongMessage: string | null;
}

/**
 * Платформа под формой: пока команда не отправила форму, её не видно вовсе. Здесь и
 * время, и подсказки, и сканер — всё, что на других заданиях стоит в шапке и под текстом.
 */
export function GoogleFormsPanel({
  open,
  onClose,
  question,
  onScan,
  scanning,
  error,
  wrongMessage,
}: GoogleFormsPanelProps): ReactNode {
  const { progress, receivedAt } = useQuestOutletContext();

  return (
    <Modal open={open} title="МегаКвест" onClose={onClose}>
      <div className={styles.panel}>
        <div className={styles.timer}>
          <Timer timer={progress.timer} receivedAt={receivedAt} paused={false} />
          {progress.timer.timeAdjustmentSeconds !== 0 && (
            <TimeAdjustmentValue seconds={progress.timer.timeAdjustmentSeconds}>
              {formatAdjustment(progress.timer.timeAdjustmentSeconds)}
            </TimeAdjustmentValue>
          )}
        </div>

        <Banner message={error} />
        <Banner message={wrongMessage} />

        <div className={styles.row}>
          <SupportButton />
          <HintsPanel hints={question.hints} nextHintIndex={question.nextHintIndex} />
        </div>

        <ScanButton loading={scanning} onClick={onScan} label="Сканировать код" />
      </div>
    </Modal>
  );
}
