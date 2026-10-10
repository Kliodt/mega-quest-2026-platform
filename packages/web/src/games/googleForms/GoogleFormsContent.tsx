import { type GoogleFormsQuestionContentDto } from '@quest/shared';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { CodeScanner } from '../../components/CodeScanner.js';
import { QuestionHtml } from '../../components/QuestionHtml.js';
import { readPrompt } from '../basicGame/readPrompt.js';
import { useRoomCodeAnswer } from '../roomCodeAnswer/useRoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';
import styles from './GoogleFormsContent.module.scss';
import { GoogleFormsPanel } from './GoogleFormsPanel.js';

const RULES = [
  '1. Твоя команда должна состоять из 5-6 человек;',
  '2. Необходимо, чтобы команда состояла только из первокурсников (как бакалавриата, так и магистратуры). Однако допустимо присутствие одного старшекурсника (начиная со 2 курса);',
  '3. Все члены команды должны быть с одного Мегафакультета;',
  '4. Количество команд строго ограничено. В число участников потока войдут те команды, которые успешно прошли проверку и зарегистрировались быстрее.',
];

const FACULTIES = ['ФТМиИ', 'МФ КТиУ', 'МФ ТИнТ', 'МФ НоЖ', 'ФТ МФ'];

const ROSTER_PLACEHOLDER =
  '5-6 человек включая капитана\n1. Петров Иван Федорович, 123456, Н12345\n2. ......\n3. ......';

const CONSENT =
  'Даю согласие на обработку персональных данных согласно ст. 9 Федерального закона от 27.07.2006 N 152-ФЗ (ред. от 02.07.2021) "О персональных данных"';

function readTopic(content: unknown): string {
  if (typeof content === 'object' && content !== null) {
    const { topic } = content as Partial<GoogleFormsQuestionContentDto>;
    if (typeof topic === 'string') {
      return topic;
    }
  }
  return '';
}

interface FieldLabelProps {
  children: ReactNode;
  /** У согласия на обработку данных организатор снял жирность */
  plain?: boolean;
}

function FieldLabel({ children, plain = false }: FieldLabelProps): ReactNode {
  return (
    <h3 className={classNames(styles.label, plain && styles.plain)}>
      {children}
      <span className={styles.required}>*</span>
    </h3>
  );
}

/**
 * Задание вне платформы: команда заполняет форму регистрации, слово в слово повторяющую
 * настоящую, и получает отказ. Настоящий ответ — код аудитории, до которой она дойдёт.
 */
export function GoogleFormsContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onReadRoomNumber,
  onEnterCode,
}: GameContentProps): ReactNode {
  const [faculty, setFaculty] = useState('');
  const [sent, setSent] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const answer = useRoomCodeAnswer({
    onSubmit,
    submitting,
    lastResult,
    onReadRoomNumber,
    onEnterCode,
  });
  const description = readPrompt(question.content);
  const topic = readTopic(question.content);

  let intro: ReactNode = (
    <p className={styles.text}>
      Привет, дорогой участник проекта ITMO Megabattle! Внимательно изучи правила регистрации на{' '}
      <b>МегаКвест</b> 5.0👇
    </p>
  );
  if (description !== '') {
    intro = <QuestionHtml html={description} className={styles.text} />;
  }

  return (
    <>
      <div className={styles.site}>
        <div className={styles.cover}>
          {topic !== '' && (
            <img
              className={styles.topic}
              src={`/formIcons/${encodeURIComponent(topic)}.png`}
              alt=""
            />
          )}
          <span className={styles.coverTitle}>Квест</span>
        </div>

        <form
          className={styles.column}
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <h1 className={styles.title}>Регистрация на МегаКвест 5.0</h1>
          {intro}

          <hr className={styles.divider} />
          {RULES.map((rule) => (
            <p key={rule} className={styles.text}>
              {rule}
            </p>
          ))}
          <hr className={styles.divider} />

          <FieldLabel>Название команды</FieldLabel>
          <input className={styles.input} type="text" required />
          <p className={classNames(styles.text, styles.note)}>
            Заявки команд с нецензурными или противоречивыми названиями будут отклонены
          </p>

          <FieldLabel>ФИО капитана, его номер ИСУ и номер группы</FieldLabel>
          <input
            className={styles.input}
            type="text"
            placeholder="Иванов Иван Иваночич, 123456"
            required
          />

          <FieldLabel>Ссылка на тг капитана</FieldLabel>
          <input className={styles.input} type="text" placeholder="https://t.me/name" required />

          <FieldLabel>
            Состав команды <span className={styles.plain}>(</span>ФИО, номер ИСУ и номер группы
            <span className={styles.plain}>)</span>
          </FieldLabel>
          <textarea className={styles.textarea} placeholder={ROSTER_PLACEHOLDER} required />

          <FieldLabel>
            Мегафакультет<span className={styles.plain}>,</span> за который играет ваша команда
          </FieldLabel>
          <div className={styles.options}>
            {FACULTIES.map((item) => (
              <label
                key={item}
                className={classNames(styles.option, faculty === item && styles.optionChosen)}
              >
                <input
                  className={styles.optionInput}
                  type="radio"
                  name="faculty"
                  checked={faculty === item}
                  onChange={() => setFaculty(item)}
                  required
                />
                {item}
              </label>
            ))}
          </div>

          <FieldLabel plain>{CONSENT}</FieldLabel>
          <label className={styles.consent}>
            <input className={styles.checkbox} type="checkbox" required />
            Да.
          </label>

          <div>
            <button className={styles.submit} type="submit">
              Зарегистрировать команду
              <svg
                className={styles.arrow}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {sent && <p className={styles.outdated}>Данная форма устарела, попробуйте раньше</p>}
        </form>
      </div>

      {/* Дверь на платформу: подсказки и сканер нужны команде в любой момент */}
      <button type="button" className={styles.badge} onClick={() => setPanelOpen(true)}>
        Made with Megabattle <span aria-hidden="true">✳</span>
      </button>

      <GoogleFormsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        question={question}
        scanning={answer.disabled}
        error={answer.error}
        wrongMessage={answer.wrongMessage}
        onScan={() => {
          setPanelOpen(false);
          answer.setScanning(true);
        }}
      />

      <CodeScanner
        open={answer.scanning}
        title="Код нужной аудитории"
        submitting={answer.disabled}
        error={answer.error ?? answer.wrongMessage}
        onClose={() => answer.setScanning(false)}
        onCode={answer.handleCode}
      />
    </>
  );
}
