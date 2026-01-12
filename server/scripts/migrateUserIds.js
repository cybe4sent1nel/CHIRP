import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../.env') });

import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

const BATCH_SIZE = 10;

async function migrateUserIds() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Find all custom auth users with old user_ format IDs
    const oldFormatUsers = await User.find({
      _id: /^user_/,
      authProvider: 'local'
    });

    console.log(`📊 Found ${oldFormatUsers.length} users to migrate\n`);

    if (oldFormatUsers.length === 0) {
      console.log('✅ No users to migrate!');
      await mongoose.disconnect();
      return;
    }

    let successful = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < oldFormatUsers.length; i += BATCH_SIZE) {
      const batch = oldFormatUsers.slice(i, i + BATCH_SIZE);
      console.log(`\n⏳ Processing batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(oldFormatUsers.length / BATCH_SIZE)}...`);

      for (const oldUser of batch) {
        try {
          const oldId = oldUser._id;
          const newId = new mongoose.Types.ObjectId();

          console.log(`  Converting ${oldId} → ${newId}`);

          // 1. Update all Connection references FIRST (before deleting old user)
          await Connection.updateMany(
            { from_user_id: oldId },
            { from_user_id: newId }
          );
          await Connection.updateMany(
            { to_user_id: oldId },
            { to_user_id: newId }
          );

          // 2. Update all Message references
          await Message.updateMany(
            { from_user_id: oldId },
            { from_user_id: newId }
          );
          await Message.updateMany(
            { to_user_id: oldId },
            { to_user_id: newId }
          );
          await Message.updateMany(
            { 'from_user_id._id': oldId },
            { 'from_user_id._id': newId }
          );
          await Message.updateMany(
            { 'to_user_id._id': oldId },
            { 'to_user_id._id': newId }
          );

          // 3. Update Post references
          await Post.updateMany(
            { user: oldId },
            { user: newId }
          );

          // 4. Update Notification references
          await Notification.updateMany(
            { actor_id: oldId },
            { actor_id: newId }
          );
          await Notification.updateMany(
            { user_id: oldId },
            { user_id: newId }
          );

          // 5. Update User arrays (followers, following, connections, blocked_users)
          await User.updateMany(
            { followers: oldId },
            { $set: { 'followers.$': newId } }
          );
          await User.updateMany(
            { following: oldId },
            { $set: { 'following.$': newId } }
          );
          await User.updateMany(
            { connections: oldId },
            { $set: { 'connections.$': newId } }
          );
          await User.updateMany(
            { blocked_users: oldId },
            { $set: { 'blocked_users.$': newId } }
          );

          // 6. Delete old user document
          await User.findByIdAndDelete(oldId);

          // 7. Create new user document with new ID (after old one is deleted)
          const newUserData = oldUser.toObject();
          delete newUserData._id;
          newUserData._id = newId;

          await User.create(newUserData);

          console.log(`  ✅ Successfully migrated ${oldId}`);
          successful++;
        } catch (error) {
          console.error(`  ❌ Failed to migrate ${oldUser._id}:`, error.message);
          failed++;
        }
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📈 Migration Complete:`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`${'='.repeat(50)}\n`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('\n' + '='.repeat(50));
console.log('🔄 User ID Migration Script');
console.log('='.repeat(50) + '\n');
console.log('⚠️  This will convert all custom auth users from');
console.log('   old format (user_xxx) to MongoDB format (24-char hex)\n');

migrateUserIds();
