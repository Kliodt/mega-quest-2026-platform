import { GameType, SocialNetworksAnswer } from '@quest/shared';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useProgressQuery, useSubmitAnswerMutation } from '../api/queries.js';
import { useAuth } from '../auth/AuthContext.js';
import { Banner, BannerTone, PageTitle, QuestShell, Spinner } from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import styles from './PubConfirmVideoPage.module.scss';

const NO_SESSION = 'Откройте эту ссылку на устройстве, с которого команда вошла в квест.';
const NO_QUESTION = 'Сейчас у команды нет открытого задания — засчитывать нечего.';
const OTHER_QUESTION = 'Эта ссылка засчитывает только задание из ролика.';
const NOT_ACCEPTED = 'Ответ не засчитан. Позовите организатора.';

/** Ссылка из ролика: открыл её с устройства команды — задание засчитано. */
export function PubConfirmVideoPage(): ReactNode {
  const { token } = useAuth();
  const progressQuery = useProgressQuery();
  const submit = useSubmitAnswerMutation();
  const sent = useRef(false);

  const question = progressQuery.data?.question ?? null;
  // Чужое задание не засчитываем: иначе переход по ссылке не вовремя стоил бы команде штрафа
  const mine = question !== null && question.gameType === GameType.SOCIAL_NETWORKS;

  useEffect(() => {
    if (!mine || sent.current) {
      return;
    }
    sent.current = true;
    submit.mutate({ answer: { text: SocialNetworksAnswer.CONFIRMED } });
  }, [mine, submit]);

  let content: ReactNode = <Spinner label="Засчитываем задание…" />;
  if (token === null) {
    content = <Banner tone={BannerTone.WARNING} message={NO_SESSION} />;
  } else if (submit.isSuccess && submit.data.correct) {
    content = (
      <>
        <Banner tone={BannerTone.SUCCESS} message="Ответ принят" />
        <p className={styles.lead}>Возвращайтесь к прохождению: вас ждёт следующий шаг.</p>
        <Link className={styles.back} to="/">
          К заданию
        </Link>
      </>
    );
  } else if (submit.isSuccess) {
    content = <Banner message={NOT_ACCEPTED} />;
  } else if (submit.isError) {
    content = <Banner message={getErrorMessage(submit.error)} />;
  } else if (progressQuery.isPending) {
    content = <Spinner label="Проверяем задание команды…" />;
  } else if (progressQuery.isError) {
    content = <Banner message={getErrorMessage(progressQuery.error)} />;
  } else if (question === null) {
    content = <Banner tone={BannerTone.WARNING} message={NO_QUESTION} />;
  } else if (!mine) {
    content = <Banner tone={BannerTone.WARNING} message={OTHER_QUESTION} />;
  }

  return (
    <QuestShell>
      <div className={styles.page}>
        <PageTitle>Ролик</PageTitle>
        {content}
      </div>
    </QuestShell>
  );
}
