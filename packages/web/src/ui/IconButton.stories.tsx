import { type Meta, type StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton.js';

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  args: { label: 'Убрать шаг', children: '✕' },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

/** Так кнопки стоят в редакторе маршрута */
export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 4 }}>
      <IconButton label="Выше">↑</IconButton>
      <IconButton label="Ниже">↓</IconButton>
      <IconButton label="Убрать шаг">✕</IconButton>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
