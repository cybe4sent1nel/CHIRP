#!/usr/bin/env node

/**
 * Chirp - Unified Development Server
 * Starts both client and server with shared environment variables
 * Uses parent folder .env file for all configuration
 * 
 * Usage: npm run dev
 *        node dev.js
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const isWindows = os.platform() === 'win32';
const rootDir = __dirname;
const parentEnvPath = resolve(rootDir, '.env');

// ═══════════════════════════════════════════════════════════════════════════════════
// 1. LOAD PARENT ENV FILE
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('\n┌─────────────────────────────────────────────────────────────────┐');
console.log('│         🐦 Chirp - Unified Development Server                   │');
console.log('└─────────────────────────────────────────────────────────────────┘\n');

// Load parent .env file
if (fs.existsSync(parentEnvPath)) {
  console.log(`✓ Loading environment from: ${parentEnvPath}`);
  const envResult = config({ path: parentEnvPath });
  if (envResult.error) {
    console.warn(`⚠ Warning: Error reading .env file: ${envResult.error.message}`);
  }
} else {
  console.warn(`⚠ Warning: Parent .env file not found at ${parentEnvPath}`);
  console.log('   Create .env file in root directory with required variables');
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 2. VALIDATE ENVIRONMENT
// ═══════════════════════════════════════════════════════════════════════════════════

const requiredVars = {
  server: ['MONGO_URI'],  // AI provider is optional (defaults to ChirpAI if configured)
  client: []  // Client doesn't need parent .env vars
};

console.log('\n📋 Environment Variables Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let hasErrors = false;

// Check server requirements
const serverVars = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT || '4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  TEXT_API_URL: process.env.TEXT_API_URL,
  TEXT_API_BEARER: process.env.TEXT_API_BEARER,
  IMAGE_API_URL: process.env.IMAGE_API_URL,
  IMAGE_API_BEARER: process.env.IMAGE_API_BEARER,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
};

console.log('Server Configuration:');

// Check MONGO_URI (required)
if (!process.env.MONGO_URI) {
  console.log(`  ❌ MONGO_URI: NOT SET (Required)`);
  hasErrors = true;
} else {
  console.log(`  ✓ MONGO_URI: ${process.env.MONGO_URI.substring(0, 50)}...`);
}

// Check AI provider (one of them required)
const hasChirpAI = !!(process.env.TEXT_API_URL && process.env.TEXT_API_BEARER);
const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

if (hasChirpAI) {
  console.log(`  ✓ ChirpAI Text API: ${process.env.TEXT_API_URL}`);
  console.log(`  ✓ Text API Bearer: ${process.env.TEXT_API_BEARER.substring(0, 4)}...`);
  if (process.env.IMAGE_API_URL && process.env.IMAGE_API_BEARER) {
    console.log(`  ✓ ChirpAI Image API: ${process.env.IMAGE_API_URL}`);
    console.log(`  ✓ Image API Bearer: ${process.env.IMAGE_API_BEARER.substring(0, 4)}...`);
  } else {
    console.log(`  ⚠  Image API: Not configured (text-only AI features available)`);
  }
} else if (hasOpenRouter) {
  console.log(`  ✓ OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY.substring(0, 6)}...`);
} else {
  console.log(`  ⚠  AI Provider: Not configured`);
  console.log(`     - Using ChirpAI? Set TEXT_API_URL and TEXT_API_BEARER`);
  console.log(`     - Using OpenRouter? Set OPENROUTER_API_KEY`);
}

// Check other vars
console.log(`  ✓ PORT: ${process.env.PORT || '4000'}`);
console.log(`  ✓ FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

console.log('\nClient Configuration:');
const clientUrl = process.env.VITE_BASEURL || 'http://localhost:4000/api';
console.log(`  ✓ VITE_BASEURL: ${clientUrl}`);

if (hasErrors) {
  console.log('\n❌ Missing required environment variables!');
  console.log('\n📌 Setup Instructions:');
  console.log('   1. Open .env file in root directory');
  console.log('   2. Add required variables (see above)');
  console.log('   3. Save and run this script again\n');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 3. PREPARE ENV FOR CHILD PROCESSES
// ═══════════════════════════════════════════════════════════════════════════════════

const sharedEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

// Client-specific env vars (for Vite)
const clientEnv = {
  ...sharedEnv,
  VITE_BASEURL: clientUrl
};

// ═══════════════════════════════════════════════════════════════════════════════════
// 4. START SERVER PROCESS
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════\n');
console.log('🚀 Starting Backend Server (Port: ' + (process.env.PORT || 4000) + ')...\n');

const serverDir = resolve(rootDir, 'server');
const serverCmd = isWindows ? 'npm.cmd' : 'npm';
const serverArgs = ['run', 'dev'];

const serverProcess = spawn(serverCmd, serverArgs, {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
  env: sharedEnv
});

serverProcess.on('error', (error) => {
  console.error(`\n❌ Failed to start server: ${error.message}`);
  process.exit(1);
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 5. WAIT THEN START CLIENT PROCESS
// ═══════════════════════════════════════════════════════════════════════════════════

const serverStartupTime = 3000; // 3 seconds

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  console.log('🎨 Starting Frontend Client (Port: 5173)...\n');

  const clientDir = resolve(rootDir, 'client');
  const clientCmd = isWindows ? 'npm.cmd' : 'npm';
  const clientArgs = ['run', 'dev'];

  const clientProcess = spawn(clientCmd, clientArgs, {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true,
    env: clientEnv
  });

  clientProcess.on('error', (error) => {
    console.error(`\n❌ Failed to start client: ${error.message}`);
    serverProcess.kill();
    process.exit(1);
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // 6. START INNGEST DEV SERVER
  // ═══════════════════════════════════════════════════════════════════════════════════

  setTimeout(() => {
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    console.log('📧 Starting Inngest Dev Server (Port: 8288)...\n');

    const inngestCmd = isWindows ? 'npx.cmd' : 'npx';
    const inngestArgs = ['-y', 'inngest-cli@1.15.3', 'dev'];

    const inngestProcess = spawn(inngestCmd, inngestArgs, {
      cwd: serverDir,
      stdio: 'inherit',
      shell: true,
      env: sharedEnv
    });

    inngestProcess.on('error', (error) => {
      console.warn(`\n⚠️  Inngest failed to start: ${error.message}`);
      console.log('   Email features will use direct fallback\n');
    });

    // ═══════════════════════════════════════════════════════════════════════════════════
    // 7. HANDLE GRACEFUL SHUTDOWN
    // ═══════════════════════════════════════════════════════════════════════════════════

    const shutdown = () => {
      console.log('\n\n═══════════════════════════════════════════════════════════════════');
      console.log('🛑 Shutting down services...\n');
      
      serverProcess.kill('SIGTERM');
      clientProcess.kill('SIGTERM');
      inngestProcess.kill('SIGTERM');
      
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
        clientProcess.kill('SIGKILL');
        inngestProcess.kill('SIGKILL');
        console.log('✓ Services stopped\n');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  }, 2000); // Start Inngest 2 seconds after client

}, serverStartupTime);

// ═══════════════════════════════════════════════════════════════════════════════════
// 8. DISPLAY STARTUP INFO
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('\n📝 Environment:');
console.log(`   Parent .env: ${parentEnvPath}`);
console.log(`   Mode: ${sharedEnv.NODE_ENV}`);
console.log(`   Server: http://localhost:${process.env.PORT || 4000}`);
console.log(`   Client: http://localhost:5173`);
console.log(`   Inngest: http://localhost:8288`);
console.log('\n💡 Tips:');
console.log('   • Update .env file for configuration changes');
console.log('   • Press Ctrl+C to stop all services');
console.log('   • Server logs appear first, then client, then Inngest\n');
console.log('═══════════════════════════════════════════════════════════════════\n');
