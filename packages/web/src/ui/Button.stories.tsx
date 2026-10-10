import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Войти' },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: ButtonVariant.SECONDARY, children: 'Отмена' },
};

export const Danger: Story = {
  args: { variant: ButtonVariant.DANGER, children: 'Удалить команду' },
};

export const Ghost: Story = {
  args: { variant: ButtonVariant.GHOST, children: 'Выйти' },
};

export const Small: Story = {
  args: { size: ButtonSize.SMALL, variant: ButtonVariant.SECONDARY, children: 'Ответы' },
};

/** Пока идёт запрос, кнопка сама блокируется и меняет надпись */
export const Loading: Story = {
  args: { loading: true, loadingLabel: 'Входим…' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button>Войти</Button>
      <Button variant={ButtonVariant.SECONDARY}>Отмена</Button>
      <Button variant={ButtonVariant.DANGER}>Удалить</Button>
      <Button variant={ButtonVariant.GHOST}>Выйти</Button>
    </div>
  ),
};
