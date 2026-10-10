import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Badge, BadgeTone } from './Badge.js';
import { Table } from './Table.js';
import { TimeValue } from './TimeValue.js';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Teams: Story = {
  render: () => (
    <div style={{ width: 640 }}>
      <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>Команда</th>
            <th>Статус</th>
            <th>Шаг</th>
            <th>Итог</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Гараж</td>
            <td>
              <Badge tone={BadgeTone.DONE}>финиш</Badge>
            </td>
            <td>27 / 27</td>
            <td>
              <TimeValue>01:42:07</TimeValue>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>Баня XL</td>
            <td>
              <Badge tone={BadgeTone.ACTIVE}>в пути</Badge>
            </td>
            <td>14 / 27</td>
            <td>
              <TimeValue>00:58:12</TimeValue>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>БАГ</td>
            <td>
              <Badge tone={BadgeTone.LOCKED}>не начали</Badge>
            </td>
            <td>0 / 27</td>
            <td>
              <TimeValue>00:00:00</TimeValue>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  ),
};

/** Таблица маршрутов шире экрана и прокручивается вбок */
export const Scrollable: Story = {
  render: () => (
    <div style={{ width: 420 }}>
      <Table scrollable>
        <thead>
          <tr>
            <th>Команда</th>
            <th>Корпус 1</th>
            <th>Корпус 2</th>
            <th>Корпус 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Гараж</td>
            <td>1 → 458 → 405 → 125</td>
            <td>1 → 1216 → 1600 → 3408</td>
            <td>1 → 2124 → 2241 → 2101</td>
          </tr>
        </tbody>
      </Table>
    </div>
  ),
};
