import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from './Button.js';
import { EmptyState } from './EmptyState.js';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  args: { message: 'Поправок времени пока нет' },
  render: (args) => (
    <div style={{ width: 420 }}>
      <EmptyState {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    message: 'Команд пока нет',
    action: (
      <Button size={ButtonSize.SMALL} variant={ButtonVariant.SECONDARY}>
        Добавить команду
      </Button>
    ),
  },
};
