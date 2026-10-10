import { type StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/ui/**/*.stories.tsx'],
  // Шрифты берутся из public/fonts, как и в приложении
  staticDirs: ['../public'],
};

export default config;
