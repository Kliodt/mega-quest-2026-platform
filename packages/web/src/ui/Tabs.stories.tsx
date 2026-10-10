import { type Meta, type StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Tabs } from './Tabs.js';

const ITEMS = [
  { id: 'route', label: 'Маршрут' },
  { id: 'time', label: 'Штрафы и бонусы' },
  { id: 'team', label: 'Данные команды' },
];

function TabsDemo(): ReactNode {
  const [active, setActive] = useState('route');
  return (
    <div style={{ width: 480 }}>
      <Tabs items={ITEMS} activeId={active} onChange={setActive} label="Разделы команды" />
      <p className="muted">Открыт раздел: {active}</p>
    </div>
  );
}

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => <TabsDemo />,
};
