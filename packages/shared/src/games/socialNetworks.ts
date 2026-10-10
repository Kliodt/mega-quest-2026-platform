/**
 * Ответ соцсетей команда не вводит: она переходит по ссылке из ролика на `/pub/confirm_video`,
 * и страница отправляет за неё вот это значение. Оно же лежит в `acceptedAnswers` вопроса.
 */
export enum SocialNetworksAnswer {
  CONFIRMED = '1',
}
