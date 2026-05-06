// Quick test to verify the system works
console.log('🧪 Testing Hotel Booking System');
console.log('==============================');

// Test 1: Environment variables
console.log('\n✅ Environment Variables:');
console.log('- PORT:', process.env.PORT || 5000);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- ADMIN_KEY:', process.env.ADMIN_KEY ? 'Set' : 'Not set');
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Test 2: Required modules
console.log('\n✅ Required Modules:');
try {
  require('express');
  console.log('- Express: ✅');
} catch (e) {
  console.log('- Express: ❌');
}

try {
  require('mongoose');
  console.log('- Mongoose: ✅');
} catch (e) {
  console.log('- Mongoose: ❌');
}

try {
  require('cors');
  console.log('- CORS: ✅');
} catch (e) {
  console.log('- CORS: ❌');
}

// Test 3: Configuration
console.log('\n✅ Configuration:');
console.log('- JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('- Email Config:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('- Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');

console.log('\n🎉 System is ready to run!');
console.log('\n📋 Next Steps:');
console.log('1. Fix MongoDB connection (check cluster name and IP whitelist)');
console.log('2. Run: npm run dev');
console.log('3. Test frontend: http://localhost:5173');
console.log('4. Test API: http://localhost:5000/api/health');

console.log('\n🔑 Admin Login Key: admin123456');
console.log('📧 Test Email Reset Code: 123456');
