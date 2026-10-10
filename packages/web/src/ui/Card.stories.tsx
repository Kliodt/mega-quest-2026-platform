import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from './Button.js';
import { Card } from './Card.js';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  args: { children: 'Содержимое карточки' },
  render: (args) => (
    <div style={{ width: 420 }}>
      <Card {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Plain: Story = {};

export const WithTitle: Story = {
  args: { title: 'Штрафы и бонусы' },
};

export const WithActions: Story = {
  args: {
    title: 'Маршрут',
    actions: (
      <Button size={ButtonSize.SMALL} variant={ButtonVariant.SECONDARY}>
        Изменить
      </Button>
    ),
  },
};
