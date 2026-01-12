import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chirp';

async function makeAdmin(email) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log(`Finding user with email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`User found: ${user.email}`);
    console.log(`Current role: ${user.role}`);
    console.log(`Current isAdmin: ${user.isAdmin}`);

    user.role = 'admin';
    user.isAdmin = true;

    await user.save();

    console.log('User updated successfully');
    console.log(`New role: ${user.role}`);
    console.log(`New isAdmin: ${user.isAdmin}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node make-admin.js <email>');
  process.exit(1);
}

makeAdmin(email);
