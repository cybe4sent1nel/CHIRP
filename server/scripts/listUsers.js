// List all users in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('email full_name username emailVerified verificationToken authProvider createdAt').sort({ createdAt: -1 }).limit(10);

    console.log(`📋 Found ${users.length} users (showing last 10):\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Provider: ${user.authProvider}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Has Verification Token: ${!!user.verificationToken}`);
      if (user.verificationToken) {
        console.log(`   Token: ${user.verificationToken.substring(0, 20)}...`);
      }
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
