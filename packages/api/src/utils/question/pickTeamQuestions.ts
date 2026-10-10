interface WithTeams {
  teamSlugs: string[];
}

/**
 * Варианты вопроса, из которых выбирают для этой команды: заведённые на неё, если такие
 * есть, иначе общие. Общих не осталось — отдаём что есть: ответ у вариантов один, и
 * команда скорее решит чужой текст, чем упрётся в аудиторию без вопроса.
 */
export function pickTeamQuestions<T extends WithTeams>(questions: T[], teamSlug: string): T[] {
  const own = questions.filter((question) => question.teamSlugs.includes(teamSlug));
  if (own.length > 0) {
    return own;
  }
  const shared = questions.filter((question) => question.teamSlugs.length === 0);
  if (shared.length > 0) {
    return shared;
  }
  return questions;
}
