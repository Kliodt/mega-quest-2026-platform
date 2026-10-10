import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Константы окружения читаются при импорте src/config/env.ts; база в тестах — mongodb-memory-server
    env: {
      MONGO_URI: 'mongodb://unused-in-tests',
      JWT_SECRET: 'test-secret',
      ADMIN_TOKEN: 'test-admin-token',
      MOCK_CODE: 'mock0000',
      // Та же мажорная версия, что в docker compose: свежие сборки mongod на macOS не запускаются
      MONGOMS_VERSION: '7.0.14',
    },
  },
});
