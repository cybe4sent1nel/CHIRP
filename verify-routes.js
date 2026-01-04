#!/usr/bin/env node

/**
 * Route Verification Script
 * Checks if all required routes and components are properly set up
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContains(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(pattern)) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`❌ ${description} - Pattern not found`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} - Error reading file: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n🔍 Route Verification Script\n', 'cyan');
  
  const projectRoot = __dirname;
  const clientPath = path.join(projectRoot, 'client');
  const srcPath = path.join(clientPath, 'src');
  const pagesPath = path.join(srcPath, 'pages');

  let allGood = true;

  log('📁 Checking Files...\n', 'blue');

  // Check component files
  allGood &= checkFile(
    path.join(pagesPath, 'AIStudio.jsx'),
    'AIStudio component exists'
  );

  allGood &= checkFile(
    path.join(pagesPath, 'ProfileQR.jsx'),
    'ProfileQR component exists'
  );

  allGood &= checkFile(
    path.join(pagesPath, 'Profile.jsx'),
    'Profile component exists'
  );

  allGood &= checkFile(
    path.join(srcPath, 'App.jsx'),
    'App.jsx exists'
  );

  allGood &= checkFile(
    path.join(srcPath, 'assets', 'assets.js'),
    'assets.js exists'
  );

  log('\n📍 Checking Routes...\n', 'blue');

  // Check App.jsx for routes
  allGood &= checkFileContains(
    path.join(srcPath, 'App.jsx'),
    'import AIStudio from "./pages/AIStudio"',
    'AIStudio imported in App.jsx'
  );

  allGood &= checkFileContains(
    path.join(srcPath, 'App.jsx'),
    'import ProfileQR from "./pages/ProfileQR"',
    'ProfileQR imported in App.jsx'
  );

  allGood &= checkFileContains(
    path.join(srcPath, 'App.jsx'),
    'path="ai-studio"',
    'AI Studio route defined in App.jsx'
  );

  allGood &= checkFileContains(
    path.join(srcPath, 'App.jsx'),
    'path="profile-qr"',
    'Profile QR route defined in App.jsx'
  );

  log('\n🎯 Checking Sidebar Menu...\n', 'blue');

  // Check assets.js for menu items
  allGood &= checkFileContains(
    path.join(srcPath, 'assets', 'assets.js'),
    "{ to: '/ai-studio', label: 'AI Studio'",
    'AI Studio in menu items'
  );

  allGood &= checkFileContains(
    path.join(srcPath, 'assets', 'assets.js'),
    'Sparkles',
    'Sparkles icon imported'
  );

  log('\n🔗 Checking Navigation...\n', 'blue');

  // Check Profile.jsx for navigation
  allGood &= checkFileContains(
    path.join(pagesPath, 'Profile.jsx'),
    'useNavigate',
    'useNavigate hook imported in Profile.jsx'
  );

  allGood &= checkFileContains(
    path.join(pagesPath, 'Profile.jsx'),
    'navigate("/profile-qr")',
    'Profile QR navigation in Profile.jsx'
  );

  allGood &= checkFileContains(
    path.join(pagesPath, 'Profile.jsx'),
    'QrCode',
    'QrCode icon imported in Profile.jsx'
  );

  log('\n📦 Checking Component Exports...\n', 'blue');

  // Check if components export properly
  allGood &= checkFileContains(
    path.join(pagesPath, 'AIStudio.jsx'),
    'export default AIStudio',
    'AIStudio component exports'
  );

  allGood &= checkFileContains(
    path.join(pagesPath, 'ProfileQR.jsx'),
    'export default ProfileQR',
    'ProfileQR component exports'
  );

  log('\n' + '='.repeat(50) + '\n', 'cyan');

  if (allGood) {
    log('✅ All checks passed! Routes should work.', 'green');
    log('\nIf routes still not working:', 'yellow');
    log('1. Hard refresh browser (Ctrl+Shift+R)', 'yellow');
    log('2. Restart dev server (npm start)', 'yellow');
    log('3. Clear Vite cache (rm -rf client/node_modules/.vite)', 'yellow');
  } else {
    log('❌ Some checks failed. See above for details.', 'red');
    log('\nPlease fix the issues and try again.', 'yellow');
  }

  log('\n' + '='.repeat(50) + '\n', 'cyan');
}

// Run verification
main();
