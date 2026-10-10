import { type Meta, type StoryObj } from '@storybook/react-vite';
import { PageTitle } from './PageTitle.js';

const meta: Meta<typeof PageTitle> = {
  title: 'UI/PageTitle',
  component: PageTitle,
  args: { children: 'КВЕСТ' },
};

export default meta;
type Story = StoryObj<typeof PageTitle>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: { children: 'Гараж', subtitle: 'финиш, шаг 27 из 27' },
};
