// Simple test server to verify MongoDB connection
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://noeltebei478_db_user:9OyuTJ4MLDiKDcrK@cluster.mongodb.net/hotel-booking?retryWrites=true&w=majority';

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ name: 'Test Document' });
    await testDoc.save();
    console.log('✅ Document creation successful!');
    
    // Clean up
    await TestModel.deleteMany({});
    console.log('✅ Cleanup successful!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 All tests passed! The MongoDB connection is working correctly.');
  } else {
    console.log('💥 Tests failed. Please check your MongoDB configuration.');
  }
});
