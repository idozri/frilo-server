/** @format */

import { MongoClient } from 'mongodb';

async function fixEmailIndex() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/frilo';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('users');

    // Drop the existing email index
    try {
      await collection.dropIndex('email_1');
      console.log('Dropped existing email index');
    } catch (error) {
      console.log('No existing email index to drop');
    }

    // Create new sparse unique index
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique email index');
  } catch (error) {
    console.error('Error fixing email index:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixEmailIndex().catch(console.error);
