import { type Meta, type StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Button } from './Button.js';
import { Modal } from './Modal.js';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ScannerDemo(): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Сканировать код</Button>
      <Modal open={open} title="Код на двери" onClose={() => setOpen(false)}>
        <p>Здесь живёт камера: содержимое монтируется, только пока окно открыто.</p>
      </Modal>
    </>
  );
}

/** Открывается по кнопке, закрывается крестиком, Esc или кликом мимо панели */
export const Scanner: Story = {
  render: () => <ScannerDemo />,
};
