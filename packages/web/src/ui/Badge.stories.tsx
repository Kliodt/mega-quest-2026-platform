import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Badge, BadgeTone } from './Badge.js';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  args: { children: 'пройдено', tone: BadgeTone.DONE },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Done: Story = {};

export const Active: Story = {
  args: { tone: BadgeTone.ACTIVE, children: 'сейчас' },
};

export const Locked: Story = {
  args: { tone: BadgeTone.LOCKED, children: 'впереди' },
};

export const Neutral: Story = {
  args: { tone: BadgeTone.NEUTRAL, children: 'ждёт код' },
};

export const Danger: Story = {
  args: { tone: BadgeTone.DANGER, children: 'штраф' },
};

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Badge tone={BadgeTone.LOCKED}>впереди</Badge>
      <Badge tone={BadgeTone.NEUTRAL}>ждёт код</Badge>
      <Badge tone={BadgeTone.ACTIVE}>сейчас</Badge>
      <Badge tone={BadgeTone.DONE}>пройдено</Badge>
      <Badge tone={BadgeTone.DANGER}>штраф</Badge>
    </div>
  ),
};
