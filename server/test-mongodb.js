// Test MongoDB connection with different cluster name formats
import mongoose from 'mongoose';

const possibleClusterNames = [
  'franchotel-cluster.mongodb.net',
  'franchotel-cluster.xxxxx.mongodb.net',
  'cluster0.mongodb.net', // Common default name
  'mongodb.net' // Just to test DNS
];

const testConnection = async (clusterName) => {
  console.log(`\n🔍 Testing: ${clusterName}`);
  try {
    const uri = `mongodb+srv://noeltebei478_db_user:9OyuTJ4MLDiKDcrK@${clusterName}/hotel-booking?retryWrites=true&w=majority`;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ SUCCESS: Connected to ${clusterName}`);
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
};

async function runTests() {
  console.log('🧪 Testing MongoDB Cluster Names');
  console.log('===================================');
  
  for (const clusterName of possibleClusterNames) {
    await testConnection(clusterName);
  }
  
  console.log('\n💡 If none of these work, please check:');
  console.log('1. Your MongoDB Atlas cluster name');
  console.log('2. Network access (IP whitelist)');
  console.log('3. Database user permissions');
  console.log('4. Cluster status (is it running?)');
}

runTests().catch(console.error);
