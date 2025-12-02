/**
 * Spotify OAuth Helper Script
 *
 * This script helps you get a Spotify refresh token for server-side API access
 *
 * Steps:
 * 1. Set your Client ID and Client Secret below
 * 2. Run: node scripts/get-spotify-token.js
 * 3. Open the URL in your browser and authorize
 * 4. Copy the code from the redirect URL
 * 5. Paste it when prompted
 * 6. Save the refresh token to your .env file
 */

const readline = require('readline');
const https = require('https');
const querystring = require('querystring');

// ============================================
// Spotify Credentials (from Dashboard)
// ============================================
const CLIENT_ID = 'be495e578f89486e9d3c8ca7be1b1e27';
const CLIENT_SECRET = 'c880a42058e2464bbd6f38674cfc59cd';
const REDIRECT_URI = 'https://youoke.vercel.app/api/spotify/callback';

// Required scopes for reading playlists
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n🎵 Spotify OAuth Helper\n');

  // Validate credentials
  if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
    console.error('❌ Error: Please set your CLIENT_ID and CLIENT_SECRET in this script first!');
    console.log('\n📝 Get them from: https://developer.spotify.com/dashboard\n');
    process.exit(1);
  }

  // Step 1: Generate authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  })}`;

  console.log('Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');

  // Step 2: Get authorization code
  const code = await question('Step 2: After authorizing, paste the "code" parameter from the redirect URL: ');

  if (!code || code.trim() === '') {
    console.error('❌ Error: No code provided');
    process.exit(1);
  }

  console.log('\n🔄 Exchanging code for tokens...\n');

  // Step 3: Exchange code for tokens
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const postData = querystring.stringify({
    grant_type: 'authorization_code',
    code: code.trim(),
    redirect_uri: REDIRECT_URI,
  });

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authHeader}`,
      'Content-Length': postData.length,
    },
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);

        if (result.error) {
          console.error('❌ Error:', result.error);
          console.error('Description:', result.error_description);
          process.exit(1);
        }

        console.log('✅ Success! Here are your tokens:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Add these to your .env file:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`SPOTIFY_CLIENT_ID=${CLIENT_ID}`);
        console.log(`SPOTIFY_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`SPOTIFY_REFRESH_TOKEN=${result.refresh_token}`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('💡 For Vercel deployment:');
        console.log('   Go to Project Settings → Environment Variables');
        console.log('   Add each variable above\n');

        rl.close();
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.error('Response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
