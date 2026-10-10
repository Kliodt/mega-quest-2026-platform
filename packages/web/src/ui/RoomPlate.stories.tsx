import { type Meta, type StoryObj } from '@storybook/react-vite';
import { RoomPlate, RoomPlateSize } from './RoomPlate.js';

const meta: Meta<typeof RoomPlate> = {
  title: 'UI/RoomPlate',
  component: RoomPlate,
  args: { roomNumber: '1216', caption: 'Кронверкский' },
};

export default meta;
type Story = StoryObj<typeof RoomPlate>;

/** Куда идти прямо сейчас: номер занимает экран целиком */
export const Hero: Story = {};

/** Аудитория пройденного шага в строке карточки */
export const Compact: Story = {
  args: { size: RoomPlateSize.COMPACT, caption: '4:12' },
};

/** Шаг ведёт в несколько аудиторий: номера склеивает вызывающий */
export const Several: Story = {
  args: { roomNumber: '2403 / 2407' },
};
