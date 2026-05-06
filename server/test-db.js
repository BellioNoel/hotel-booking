import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('🔍 Testing Database Connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  console.log('✅ Database connection successful');
  
  // Test a simple query
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✅ Found ${collections.length} collections in database`);
  
  collections.forEach(collection => {
    console.log(`   - ${collection.name}`);
  });
  
  await mongoose.disconnect();
  console.log('✅ Database test completed successfully');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.error('❌ Full error:', error);
  process.exit(1);
}
