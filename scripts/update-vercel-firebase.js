#!/usr/bin/env node

/**
 * Update Vercel Environment Variables to use Firebase PRODUCTION
 * Uses Vercel CLI commands to update all Firebase-related variables
 *
 * IMPORTANT: This uses PRODUCTION Firebase project, not DEV!
 */

const { execSync } = require('child_process');

// Firebase PRODUCTION Configuration (from .env.production)
const env_vars = {
  'NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY': 'AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'playokeforyou.firebaseapp.com',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'playokeforyou',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'playokeforyou.firebasestorage.app',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL': 'https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const environments = ['production', 'preview', 'development'];

console.log('🔥 Updating Vercel Environment Variables to Firebase PRODUCTION...\n');

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
