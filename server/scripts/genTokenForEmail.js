import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function genToken(email) {
  if (!email) {
    console.error('Usage: node genTokenForEmail.js <email>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error('No user found with email', email);
    process.exit(1);
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
  console.log('User ID:', user._id.toString());
  console.log('Token:', token);
  await mongoose.disconnect();
}

const email = process.argv[2];
genToken(email).catch(err => { console.error(err); process.exit(1); });
