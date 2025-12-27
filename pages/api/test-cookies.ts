import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = nookies.get({ req });

  res.status(200).json({
    success: true,
    cookies: cookies,
    cookieKeys: Object.keys(cookies),
    hasToken: !!cookies.token,
    hasUid: !!cookies.uid,
    rawCookieHeader: req.headers.cookie || 'no cookie header',
  });
}
