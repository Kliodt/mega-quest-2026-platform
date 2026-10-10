import { QuestPhase, StepKind, type ProgressDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { FinishedCard } from '../components/FinishedCard.js';
import { LocationTransition } from '../components/LocationTransition.js';
import { NextStep } from '../components/NextStep.js';
import { WelcomeCard } from '../components/WelcomeCard.js';
import { isWelcomeSeen, setWelcomeSeen } from '../utils/welcomeSeen.js';
import { useQuestOutletContext } from './questOutletContext.js';

/** Корпус, в который ведёт текущий переход: его называет карточка этого шага. */
function getTransitionTitle(progress: ProgressDto): string | null {
  const card = progress.steps.find((step) => step.stepIndex === progress.currentStepIndex);
  if (card?.kind !== StepKind.LOCATION_TRANSITION) {
    return null;
  }
  return card.locationTitle;
}

/** Что делать прямо сейчас: отсканировать код, увидеть финиш или уйти на страницу задания. */
export function QuestPage(): ReactNode {
  const { progress } = useQuestOutletContext();
  const [welcomeSeen, markWelcomeSeen] = useState(() => isWelcomeSeen(progress.team.id));

  if (progress.question !== null) {
    // Первый код отсканирован: сначала приветствие, задание открывается по кнопке
    if (progress.solvedCount === 0 && !welcomeSeen) {
      return (
        <WelcomeCard
          onStart={() => {
            setWelcomeSeen(progress.team.id);
            markWelcomeSeen(true);
          }}
        />
      );
    }
    return <Navigate to="/question" replace />;
  }
  if (progress.phase === QuestPhase.FINISHED) {
    return <FinishedCard timer={progress.timer} />;
  }

  let intro: ReactNode = null;
  // Первый код корпуса висит на входе, а не на двери аудитории: команда ещё не знает, куда идти
  let lead: string | undefined;
  if (progress.phase === QuestPhase.LOCATION_TRANSITION) {
    intro = (
      <LocationTransition
        locationTitle={getTransitionTitle(progress)}
        start={progress.currentStepIndex === 0}
        html={progress.transitionHtml}
      />
    );
    lead = 'Отсканируйте код на входе в корпус.';
  }

  return <NextStep nextRoomNumbers={progress.nextRoomNumbers} intro={intro} lead={lead} />;
}
