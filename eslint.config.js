import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const webFiles = ['packages/web/**/*.{ts,tsx}'];

export default defineConfig(
  globalIgnores(['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/storybook-static/**']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['packages/*/tsconfig.json'],
        }),
      ],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/require-await': 'off',
      // `interface XDocument extends HydratedDocument<XDoc> {}`: интерфейс сохраняет имя в подсказках IDE, алиас раскрывается
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': 'error',
      'no-nested-ternary': 'error',
      'no-await-in-loop': 'error',
      'no-sequences': 'error',
      // Типизированная замена устаревшего core-правила no-return-await
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    },
  },
  {
    files: ['packages/api/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Утилиты — чистые функции над переданными объектами: без Mongo и без сервисов.
    files: ['packages/api/src/utils/**/*.ts', 'packages/api/src/games/*/utils/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'mongoose',
              message: 'Утилиты не читают и не пишут базу: это делают сервисы.',
            },
          ],
        },
      ],
    },
  },
  {
    // Core знает о конкретных играх только через games/registry.ts и интерфейс games/types.ts.
    files: ['packages/api/src/**/*.ts'],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: import.meta.dirname,
          zones: [
            {
              target: [
                './packages/api/src/*.ts',
                './packages/api/src/config',
                './packages/api/src/db',
                './packages/api/src/models',
                './packages/api/src/plugins',
                './packages/api/src/routes',
                './packages/api/src/services',
                './packages/api/src/utils',
              ],
              from: './packages/api/src/games',
              except: ['./types.ts', './registry.ts'],
              message:
                'Core не импортирует игры напрямую: только games/registry.ts и интерфейс games/types.ts.',
            },
            {
              target: ['./packages/api/src/utils', './packages/api/src/games/*/utils'],
              from: './packages/api/src/services',
              message:
                'Утилиты считают по переданным объектам и не ходят в сервисы: чтение базы — дело сервисов.',
            },
            {
              // Загрузка данных запускается руками с консоли и живёт отдельно от приложения
              target: './packages/api/src/setup',
              from: [
                './packages/api/src/services',
                './packages/api/src/routes',
                './packages/api/src/games',
                './packages/api/src/plugins',
                './packages/api/src/config',
                './packages/api/src/db',
              ],
              message: 'setup ни с чем не связан: только типы из shared, модели и чистые утилиты.',
            },
            {
              target: [
                './packages/api/src/*.ts',
                './packages/api/src/config',
                './packages/api/src/db',
                './packages/api/src/models',
                './packages/api/src/plugins',
                './packages/api/src/routes',
                './packages/api/src/services',
                './packages/api/src/utils',
                './packages/api/src/games',
              ],
              from: './packages/api/src/setup',
              message: 'Приложение не зависит от загрузки данных: setup запускают отдельно.',
            },
            {
              target: ['./packages/api/src/utils', './packages/api/src/games/*/utils'],
              from: './packages/api/src/games',
              except: ['./types.ts', './*/schema.ts', './*/utils'],
              message: 'Утилиты не ходят в сервисы типов игр.',
            },
          ],
        },
      ],
    },
  },
  {
    files: webFiles,
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      pluginQuery.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.js', '**/*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
