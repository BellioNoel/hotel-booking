import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' });

async function clearDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const dbName = mongoose.connection.db.databaseName;
  console.log(`Connected to MongoDB database: ${dbName}`);

  await mongoose.connection.dropDatabase();
  console.log(`Database cleared successfully: ${dbName}`);

  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

clearDatabase()
  .then(() => {
    console.log('One-time reset completed. The system now starts from a clean database.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database reset failed:', error.message || error);
    process.exit(1);
  });
