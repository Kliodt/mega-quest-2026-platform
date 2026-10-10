import { type Meta, type StoryObj } from '@storybook/react-vite';
import { PasswordField } from './PasswordField.js';

const meta: Meta<typeof PasswordField> = {
  title: 'UI/PasswordField',
  component: PasswordField,
  args: { placeholder: 'Пароль', defaultValue: 'iitbgi' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <PasswordField {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

/** По кнопке-глазу пароль показывается: его вводят с телефона вслепую */
export const Default: Story = {};

export const WithLabel: Story = {
  args: { label: 'Пароль команды' },
};

export const WithError: Story = {
  args: { error: 'Неверный пароль' },
};
