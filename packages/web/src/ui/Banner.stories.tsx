import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Banner, BannerTone } from './Banner.js';

const meta: Meta<typeof Banner> = {
  title: 'UI/Banner',
  component: Banner,
  args: { message: 'Неверный код' },
  render: (args) => (
    <div style={{ width: 420 }}>
      <Banner {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Error: Story = {};

export const Warning: Story = {
  args: {
    tone: BannerTone.WARNING,
    message: 'Вход выполнен на другом устройстве. Войдите снова, чтобы продолжить здесь.',
  },
};

export const Success: Story = {
  args: { tone: BannerTone.SUCCESS, message: 'Ответ принят' },
};

export const Info: Story = {
  args: { tone: BannerTone.INFO, message: 'Шаги до №5 команда уже прошла, их менять нельзя.' },
};

/** Пустое сообщение — плашки нет вовсе */
export const Empty: Story = {
  args: { message: null },
};
