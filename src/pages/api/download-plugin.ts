import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const os = req.query.os === 'win' ? 'win' : 'mac';
  const token = process.env.GITHUB_TOKEN;
  
  const fallbackUrl = 'https://github.com/okeforyou/youoke/releases/latest';

  if (!token) {
    console.error("GITHUB_TOKEN is missing in environment variables.");
    // Fallback to releases page if token is missing
    return res.redirect(302, fallbackUrl);
  }

  try {
    // 1. Fetch latest release info
    const releaseRes = await fetch('https://api.github.com/repos/okeforyou/youoke/releases/latest', {
      headers: { 
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!releaseRes.ok) {
      console.error("Failed to fetch GitHub releases", await releaseRes.text());
      return res.redirect(302, fallbackUrl);
    }

    const releaseData = await releaseRes.json();
    
    // 2. Find the correct asset (.exe for Windows, .pkg for Mac)
    const ext = os === 'win' ? '.exe' : '.pkg';
    const asset = releaseData.assets?.find((a: any) => a.name.endsWith(ext));
    
    if (!asset) {
      console.error("Asset not found for OS:", os);
      return res.redirect(302, fallbackUrl);
    }

    // 3. Get the temporary S3 download URL from GitHub API
    // When requesting the asset URL with Accept: application/octet-stream, GitHub responds with a 302 redirect.
    const assetRes = await fetch(asset.url, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/octet-stream'
      },
      redirect: 'manual' // Prevents Node fetch from following the redirect so we can extract the URL
    });

    if (assetRes.status === 302 || assetRes.status === 301) {
      const downloadUrl = assetRes.headers.get('location');
      if (downloadUrl) {
        // Redirect the user directly to the S3 bucket URL (Publicly accessible)
        return res.redirect(302, downloadUrl);
      }
    }
    
    // Fallback if something went wrong with the redirect extraction
    return res.redirect(302, fallbackUrl);
  } catch (error) {
    console.error("Error in download-plugin API:", error);
    return res.redirect(302, fallbackUrl);
  }
}
