import { type Preview } from '@storybook/react-vite';
import { Background } from '../src/ui/Background.js';
import '../src/ui/styles/base.scss';

/** Компоненты живут на фоне квеста, поэтому и в сторибуке фон настоящий. */
const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: 320, maxWidth: 720, padding: 24 }}>
        <Background />
        <Story />
      </div>
    ),
  ],
};

export default preview;
