import mongoose from 'mongoose';

export async function connectDb(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
