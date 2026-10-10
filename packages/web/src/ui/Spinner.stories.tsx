import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner.js';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Bare: Story = {};

export const WithLabel: Story = {
  args: { label: 'Загружаем команды…' },
};
