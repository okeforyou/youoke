import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@100;200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preconnect to Google Cast CDN for faster loading */}
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        {/* Note: Google Cast SDK script moved to _app.tsx using next/script */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
