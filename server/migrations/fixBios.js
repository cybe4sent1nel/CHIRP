import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "../models/User.js";

// Load env vars
const envPath = path.resolve(process.cwd(), ".env");
console.log("Loading env from:", envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error loading .env:", result.error);
} else {
  console.log("Loaded env vars:", Object.keys(result.parsed || {}).length);
}

// Migration script to update default bios for Chirp
async function fixBios() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("MONGO_URI available:", !!mongoUri);
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment variables");
    }
    
    // Connect to database
    await mongoose.connect(`${mongoUri}/chirp`);
    console.log("Database connected");

    // Update all documents where bio is empty or needs update
    const result = await User.updateMany(
      { $or: [{ bio: "" }, { bio: null }, { bio: /old default/ }] },
      { $set: { bio: "Hey there! I am using Chirp!" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s) with new bio`);

    // Also handle the exact default
    const result2 = await User.updateMany(
      { bio: "Hey there! I am using Chirp (beta)!" },
      { $set: { bio: "Hey there! I am using Chirp!" } }
    );

    console.log(`✅ Updated ${result2.modifiedCount} user(s) with default bio`);

    await mongoose.connection.close();
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

fixBios();
