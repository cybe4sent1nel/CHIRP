// Debug script to check if user exists with verification token
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const token = process.argv[2];

if (!token) {
  console.log('Usage: node checkToken.js <verification-token>');
  console.log('Example: node checkToken.js 82a018557153b6a9e38949be675f2a3d08b3f07e55d209e9d4afcb8082fdcf59');
  process.exit(1);
}

async function checkToken() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Searching for token:', token);
    console.log('Token length:', token.length);
    console.log('');

    // Find user with this token
    const user = await User.findOne({ verificationToken: token });

    if (user) {
      console.log('✅ USER FOUND!');
      console.log('User ID:', user._id);
      console.log('Email:', user.email);
      console.log('Full Name:', user.full_name);
      console.log('Email Verified:', user.emailVerified);
      console.log('Stored Token:', user.verificationToken);
      console.log('Token Match:', user.verificationToken === token);
    } else {
      console.log('❌ NO USER FOUND with this token\n');
      
      // Check all users with verification tokens
      const usersWithTokens = await User.find({ 
        verificationToken: { $exists: true, $ne: null } 
      }).select('email verificationToken emailVerified');
      
      console.log(`Found ${usersWithTokens.length} users with verification tokens:`);
      usersWithTokens.forEach((u, i) => {
        console.log(`\n${i + 1}. Email: ${u.email}`);
        console.log(`   Token: ${u.verificationToken}`);
        console.log(`   Verified: ${u.emailVerified}`);
        console.log(`   Token Length: ${u.verificationToken?.length}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkToken();
