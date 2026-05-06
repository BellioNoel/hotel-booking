import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('Testing MongoDB connection with minimal options...');

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Database connection successful');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✅ Found ${collections.length} collections`);
  
  await mongoose.disconnect();
  console.log('✅ Test completed');
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
