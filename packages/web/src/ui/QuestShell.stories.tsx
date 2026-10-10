import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';
import { PageTitle } from './PageTitle.js';
import { QuestShell } from './QuestShell.js';
import { RoomPlate } from './RoomPlate.js';

const meta: Meta<typeof QuestShell> = {
  title: 'UI/QuestShell',
  component: QuestShell,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof QuestShell>;

/** Экран действия: узор в полную силу, в середине одна кнопка */
export const Loud: Story = {
  render: () => (
    <QuestShell>
      <PageTitle>Квест</PageTitle>
      <RoomPlate roomNumber="1216" caption="ждём вас здесь" />
      <Button fullWidth>Сканировать код</Button>
    </QuestShell>
  ),
};

/** Экран с длинным текстом: узор приглушён, читать ничего не мешает */
export const Quiet: Story = {
  render: () => (
    <QuestShell quiet>
      <p>
        На таких экранах живёт задание: три абзаца текста, ссылки и картинки. Фон уходит назад,
        чтобы буквы не соревновались со звёздами.
      </p>
    </QuestShell>
  ),
};
