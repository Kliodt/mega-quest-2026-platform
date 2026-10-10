import { type Meta, type StoryObj } from '@storybook/react-vite';
import { TimeAdjustmentValue } from './TimeAdjustmentValue.js';
import { TimeValue, TimeValueSize } from './TimeValue.js';

const meta: Meta<typeof TimeValue> = {
  title: 'UI/TimeValue',
  component: TimeValue,
  args: { children: '01:12:34' },
};

export default meta;
type Story = StoryObj<typeof TimeValue>;

export const Normal: Story = {};

/** Таймер в шапке команды */
export const Large: Story = {
  args: { size: TimeValueSize.LARGE },
};

export const Paused: Story = {
  args: { size: TimeValueSize.LARGE, paused: true },
};

/** Поправки времени: штраф красным, бонус зелёным */
export const Adjustments: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <TimeAdjustmentValue seconds={600}>+10 мин</TimeAdjustmentValue>
      <TimeAdjustmentValue seconds={-120}>−2 мин</TimeAdjustmentValue>
      <TimeAdjustmentValue seconds={0}>+0 с</TimeAdjustmentValue>
    </div>
  ),
};
