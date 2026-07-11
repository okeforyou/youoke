import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;
  const token = process.env.GITHUB_TOKEN;
  
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Missing file parameter' });
  }

  if (!token) {
    console.error("GITHUB_TOKEN is missing for updates API.");
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  try {
    // Fetch latest release info
    const releaseRes = await fetch('https://api.github.com/repos/okeforyou/youoke/releases/latest', {
      headers: { 
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!releaseRes.ok) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const releaseData = await releaseRes.json();
    
    // Find the requested file in the release assets (latest.yml, latest-mac.yml, or the actual .exe/.dmg)
    const asset = releaseData.assets?.find((a: any) => a.name === file);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Get the temporary S3 download URL from GitHub API
    const assetRes = await fetch(asset.url, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/octet-stream'
      },
      redirect: 'manual'
    });

    if (assetRes.status === 302 || assetRes.status === 301) {
      const downloadUrl = assetRes.headers.get('location');
      if (downloadUrl) {
        return res.redirect(302, downloadUrl);
      }
    }
    
    return res.status(500).json({ error: 'Failed to get redirect URL' });
  } catch (error) {
    console.error("Error in updates API:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
