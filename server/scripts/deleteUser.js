// Delete a user by email
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const email = process.argv[2];

if (!email) {
  console.log('Usage: node deleteUser.js <email>');
  console.log('Example: node deleteUser.js info.ops.chirp@gmail.com');
  process.exit(1);
}

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user first
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      await mongoose.disconnect();
      return;
    }

    console.log('Found user:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.full_name}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Provider: ${user.authProvider}`);
    console.log(`  Email Verified: ${user.emailVerified}`);
    console.log('');

    // Delete the user
    await User.deleteOne({ email });
    console.log('✅ User deleted successfully!');
    console.log('You can now sign up with this email again.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteUser();
