import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentEnvPath = resolve(__dirname, '..', '..', '.env');

// Load parent .env first
config({ path: parentEnvPath });

const initializeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      email: process.env.SMTP_USER || 'info.ops.chirp@gmail.com'
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      email: process.env.SMTP_USER || 'info.ops.chirp@gmail.com',
      name: 'Chirp Support Team',
      role: 'super_admin',
      permissions: {
        can_manage_users: true,
        can_manage_content: true,
        can_manage_reports: true,
        can_view_analytics: true,
        can_manage_admins: true
      }
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Role:', superAdmin.role);

    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
};

initializeAdmin();
