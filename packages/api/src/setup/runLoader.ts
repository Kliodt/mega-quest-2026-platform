import mongoose from 'mongoose';

/**
 * Загрузка данных живёт отдельно от приложения и запускается руками с консоли сервера,
 * поэтому и к базе подключается сама: ни конфига, ни сервисов приложения ей не нужно.
 */
export async function runLoader(load: () => Promise<void>): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log(`Connected to ${uri}`);
    await load();
    console.log('Data loaded');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}
