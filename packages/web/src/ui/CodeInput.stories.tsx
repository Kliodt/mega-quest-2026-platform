import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';
import { CodeInput } from './CodeInput.js';

const meta: Meta<typeof CodeInput> = {
  title: 'UI/CodeInput',
  component: CodeInput,
  args: { placeholder: '········' },
  render: (args) => (
    <div style={{ width: 360 }}>
      <CodeInput {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof CodeInput>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { defaultValue: 'tmpb0030' },
};

export const Disabled: Story = {
  args: { defaultValue: 'tmpb0030', disabled: true },
};

/** Так выглядит экран ввода кода у двери */
export const InForm: Story = {
  render: () => (
    <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CodeInput placeholder="········" />
      <Button fullWidth>Открыть вопрос</Button>
    </div>
  ),
};
