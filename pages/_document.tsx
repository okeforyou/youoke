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
        {/* Google Cast SDK - Load synchronously to ensure it loads before React hydration */}
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
