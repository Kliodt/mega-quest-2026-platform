import { type Meta, type StoryObj } from '@storybook/react-vite';
import { SelectField } from './SelectField.js';

const TEAMS = [
  { value: 'garage', label: 'Гараж' },
  { value: 'bath', label: 'Баня XL' },
  { value: 'bug', label: 'БАГ' },
];

const meta: Meta<typeof SelectField> = {
  title: 'UI/SelectField',
  component: SelectField,
  args: { options: TEAMS, placeholder: 'Выберите команду', defaultValue: '' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <SelectField {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof SelectField>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: { label: 'Команда' },
};

export const Loading: Story = {
  args: { placeholder: 'Загружаем команды…', options: [], disabled: true },
};

export const WithError: Story = {
  args: { error: 'Выберите команду' },
};
