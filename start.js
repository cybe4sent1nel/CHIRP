#!/usr/bin/env node

/**
 * Chirp - Full Stack Social Media App
 * Unified Start Script for Frontend and Backend
 */

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";

// Paths
const rootDir = __dirname;
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");

console.log("\n═══════════════════════════════════════════════════════════");
console.log("🐦 Starting Chirp Social Media App");
console.log("═══════════════════════════════════════════════════════════\n");

// Start server
console.log("🚀 Starting Backend Server...");
const serverProcess = spawn(isWindows ? "npm.cmd" : "npm", ["run", "dev"], {
  cwd: serverDir,
  stdio: "inherit",
  shell: true,
});

serverProcess.on("error", (error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

// Wait a moment before starting client to let server initialize
setTimeout(() => {
   console.log("\n🎨 Starting Frontend Client...");
   const clientProcess = spawn(isWindows ? "npm.cmd" : "npm", ["run", "dev"], {
     cwd: clientDir,
     stdio: "inherit",
     shell: true,
   });

   clientProcess.on("error", (error) => {
     console.error(`Failed to start client: ${error.message}`);
     process.exit(1);
   });

   // Handle exit
   process.on("SIGINT", () => {
     console.log("\n\n🛑 Shutting down...");
     serverProcess.kill();
     clientProcess.kill();
     process.exit(0);
   });
}, 5000);

console.log("\n📝 Logs from both processes will appear below:");
console.log("═══════════════════════════════════════════════════════════\n");
