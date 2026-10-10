import mongoose from 'mongoose';

export async function dropCollection(name: string): Promise<void> {
  const collections = await mongoose.connection.db?.listCollections({ name }).toArray();
  if (collections && collections.length > 0) {
    await mongoose.connection.dropCollection(name);
  }
}
