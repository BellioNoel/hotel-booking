// One-time script to create admin user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema (simplified version for this script)
    const userSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      phone: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      isActive: { type: Boolean, default: true },
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'firstadmin@gmail.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('56798TYTY', salt);

    // Create admin user
    const admin = new User({
      firstName: 'FirstAdmin',
      lastName: 'User',
      email: 'firstadmin@gmail.com',
      password: hashedPassword,
      phone: '+237123456789',
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: firstadmin@gmail.com');
    console.log('🔑 Password: 56798TYTY');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

createAdmin();
