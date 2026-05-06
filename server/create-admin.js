// One-time script to create or update the primary admin user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: '.env' });

const ADMIN_USER = {
  firstName: 'ADMIN',
  lastName: 'HOTEL',
  email: 'noeltebei478@gmail.com',
  phone: '678507737',
  password: 'BillionNoel1',
  role: 'admin',
  isActive: true,
  emailVerified: true,
};

async function createOrUpdateAdmin() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in server/.env');
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_USER.email.toLowerCase() });

    if (existing) {
      existing.firstName = ADMIN_USER.firstName;
      existing.lastName = ADMIN_USER.lastName;
      existing.phone = ADMIN_USER.phone;
      existing.role = 'admin';
      existing.isActive = true;
      existing.emailVerified = true;
      existing.password = ADMIN_USER.password;
      await existing.save();

      console.log('Admin user updated successfully.');
      console.log(`Email: ${ADMIN_USER.email}`);
      return;
    }

    const admin = new User(ADMIN_USER);
    await admin.save();

    console.log('Admin user created successfully.');
    console.log(`Email: ${ADMIN_USER.email}`);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createOrUpdateAdmin().catch((error) => {
  console.error('Failed to create/update admin user:', error.message || error);
  process.exitCode = 1;
});
