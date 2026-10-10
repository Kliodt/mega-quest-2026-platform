import { type Meta, type StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField.js';

const meta: Meta<typeof TextField> = {
  title: 'UI/TextField',
  component: TextField,
  args: { label: 'Название команды', placeholder: 'Гараж' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <TextField {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

/** Без подписи: её роль играет placeholder, как на экране входа */
export const WithoutLabel: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <TextField placeholder="Пароль" />
    </div>
  ),
};

export const WithHint: Story = {
  args: { label: 'Комментарий', hint: 'Видит только организатор' },
};

export const WithError: Story = {
  args: { label: 'Пароль', error: 'Неверный пароль' },
};

/** Коды на дверях и номера аудиторий — моноширинными */
export const Mono: Story = {
  args: { label: 'Код на двери', mono: true, defaultValue: 'tmpb0030' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Гараж' },
};
