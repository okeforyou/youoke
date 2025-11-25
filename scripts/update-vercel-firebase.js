#!/usr/bin/env node

/**
 * Update Vercel Environment Variables to use Firebase Dev
 * Uses Vercel CLI commands to update all Firebase-related variables
 */

const { execSync } = require('child_process');

// Firebase Dev Configuration
const env_vars = {
  'NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY': 'AIzaSyBBIhI9VCi3OEgP5mxWotuAJYqJ46MG2gw',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'playokeforyou-dev.firebaseapp.com',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'playokeforyou-dev',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'playokeforyou-dev.firebasestorage.app',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL': 'https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const environments = ['production', 'preview', 'development'];

console.log('🔥 Updating Vercel Environment Variables to Firebase Dev...\n');

// Update each variable for all environments
for (const [name, value] of Object.entries(env_vars)) {
  console.log(`📝 Updating ${name}...`);

  for (const env of environments) {
    try {
      // Try to remove old value first (ignore errors if doesn't exist)
      try {
        execSync(`vercel env rm ${name} ${env} -y`, { stdio: 'pipe' });
      } catch (e) {
        // Variable might not exist, that's okay
      }

      // Add new value
      execSync(`echo "${value}" | vercel env add ${name} ${env}`, {
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: '/bin/bash'
      });

      console.log(`   ✅ ${env}`);
    } catch (error) {
      console.error(`   ❌ ${env}: ${error.message}`);
    }
  }

  console.log('');
}

console.log('🎉 Done! All environment variables updated.\n');
console.log('📌 Next step: Redeploy your app');
console.log('   Run: git push origin main\n');
