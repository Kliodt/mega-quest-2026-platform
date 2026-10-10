import { buildApp } from './app.js';
import { API_HOST, API_PORT, MOCK_CODE, MONGO_URI } from './config/env.js';
import { connectDb } from './db/connect.js';
import { validateAllTeamSequences } from './services/startupValidation/validateAllTeamSequences.js';

async function main(): Promise<void> {
  const app = await buildApp();

  try {
    await connectDb(MONGO_URI);
    app.log.info('Connected to Mongo');
  } catch (error) {
    app.log.error({ err: error }, 'Failed to connect to Mongo');
    process.exit(1);
  }

  const validation = await validateAllTeamSequences();
  if (!validation.ok) {
    for (const { teamName, errors } of validation.problems) {
      app.log.error(`Team "${teamName}": ${errors.join('; ')}`);
    }
    app.log.error(
      'Invalid team sequences in database, refusing to start. If the data model changed, reload the data: npm run load-questions and npm run load-teams',
    );
    process.exit(1);
  }
  app.log.info('Team sequences validated');

  if (MOCK_CODE !== null) {
    app.log.warn('MOCK_CODE is set: this code opens any game. Do not use in a real quest.');
  }

  await app.listen({ port: API_PORT, host: API_HOST });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
