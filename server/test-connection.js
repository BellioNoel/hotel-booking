// Test MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('URI:', process.env.MONGODB_URI);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Document creation successful!');
    
    // Clean up
    await TestModel.deleteMany({});
    console.log('✅ Cleanup successful!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 MongoDB is ready! Starting server...');
    // Start the actual server
    import('./server.js');
  } else {
    console.log('💥 MongoDB connection failed. Please check your credentials.');
  }
});
