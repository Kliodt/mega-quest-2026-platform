import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from './Button.js';
import { StepCard, StepCardState } from './StepCard.js';
import { TimeAdjustmentValue } from './TimeAdjustmentValue.js';
import { TimeValue } from './TimeValue.js';

const meta: Meta<typeof StepCard> = {
  title: 'UI/StepCard',
  component: StepCard,
  args: {
    index: 4,
    state: StepCardState.DONE,
    stateLabel: 'пройдено',
    title: 'ауд. 1216, Ломоносова',
  },
  render: (args) => (
    <div style={{ width: 520 }}>
      <StepCard {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof StepCard>;

export const Done: Story = {
  args: {
    meta: (
      <>
        <span>
          Время <TimeValue>00:07:12</TimeValue>
        </span>
        <span>
          Поправки <TimeAdjustmentValue seconds={120}>+2 мин</TimeAdjustmentValue>
        </span>
        <span>Подсказки 1</span>
      </>
    ),
    actions: (
      <Button size={ButtonSize.SMALL} variant={ButtonVariant.SECONDARY}>
        Ответы
      </Button>
    ),
  },
};

export const Active: Story = {
  args: { state: StepCardState.ACTIVE, stateLabel: 'сейчас', title: 'ауд. 1600, Ломоносова' },
};

export const AwaitingCode: Story = {
  args: {
    state: StepCardState.AWAITING_CODE,
    stateLabel: 'ждёт код',
    title: 'переход между аудиториями',
  },
};

export const Locked: Story = {
  args: { state: StepCardState.LOCKED, stateLabel: 'впереди', title: 'переход между корпусами' },
};

/** Так карта маршрута выглядит целиком */
export const RouteMap: Story = {
  render: () => (
    <div style={{ width: 520, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StepCard
        index={1}
        state={StepCardState.DONE}
        stateLabel="пройдено"
        title="ауд. 1, Гривцова"
      />
      <StepCard
        index={2}
        state={StepCardState.DONE}
        stateLabel="пройдено"
        title="переход между аудиториями"
      />
      <StepCard
        index={3}
        state={StepCardState.ACTIVE}
        stateLabel="сейчас"
        title="ауд. 458, Гривцова"
        meta={
          <span>
            Время <TimeValue>00:02:41</TimeValue>
          </span>
        }
      />
      <StepCard
        index={4}
        state={StepCardState.LOCKED}
        stateLabel="впереди"
        title="переход между корпусами"
      />
    </div>
  ),
};
