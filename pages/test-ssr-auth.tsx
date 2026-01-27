import { GetServerSideProps } from 'next';
import nookies from 'nookies';
import Link from 'next/link';

interface Props {
  cookies: Record<string, string>;
  hasToken: boolean;
  hasUid: boolean;
  rawCookie: string;
}

export default function TestSSRAuth({ cookies, hasToken, hasUid, rawCookie }: Props) {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>SSR Authentication Test</h1>

      <h2>Cookies from nookies.get()</h2>
      <pre>{JSON.stringify(cookies, null, 2)}</pre>

      <h2>Status</h2>
      <p>Has token: {hasToken ? '✅ YES' : '❌ NO'}</p>
      <p>Has uid: {hasUid ? '✅ YES' : '❌ NO'}</p>

      <h2>Raw Cookie Header</h2>
      <pre>{rawCookie || 'No cookie header'}</pre>

      <hr />
      <p>
        <Link href="/account/" className="text-blue-500 underline">
          Go to Account Page (SSR Protected)
        </Link>
      </p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🔍 [TEST SSR] Starting...');

  // Test: Get cookies using { req }
  const cookies = nookies.get({ req: context.req });
  const hasToken = !!cookies.token;
  const hasUid = !!cookies.uid;
  const rawCookie = context.req.headers.cookie || '';

  console.log('🔍 [TEST SSR] Cookies:', Object.keys(cookies));
  console.log('🔍 [TEST SSR] Has token:', hasToken);
  console.log('🔍 [TEST SSR] Has uid:', hasUid);

  return {
    props: {
      cookies,
      hasToken,
      hasUid,
      rawCookie,
    },
  };
};
