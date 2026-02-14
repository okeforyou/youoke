import '../styles/global.css'
import type { AppProps } from 'next/app'

import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import DefaultSeo from 'next-seo';
// import { SEO } from '../config/seo';

import { Analytics } from '@vercel/analytics/react'

import GoogleAnalytics from '../components/GoogleAnalytics'
import { AdsProvider } from '@/context/AdsContext'
import { AuthContextProvider } from '@/context/AuthContext' // Re-enabled
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { CastProvider } from '../plugins/cast/context/CastContext'
import { FirebaseCastProvider } from '@/context/FirebaseCastContext'
import { YouTubeCastProvider } from '@/context/YouTubeCastContext'
import { ToastProvider } from '@/context/ToastContext'
import { MidiEngineProvider } from '@/context/MidiEngineContext'
import { FontLoader } from '../components/FontLoader';
// import { ErrorBoundary } from '../components/ErrorBoundary';

import { useSystemThemeSync } from '../hooks/useSystemThemeSync';
import { SystemProvider } from '../core/container/SystemContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Sync System Theme (Music Provider)
  useSystemThemeSync();

  // Optimize: Only load heavy Cast/Player text on pages that need it
  // Exclude: Login, Admin, Monitor (Receiver)
  const isMonitorPage = router.pathname === '/monitor';
  const isLoginPage = router.pathname === '/login';
  const isAdminPage = router.pathname.startsWith('/admin');

  const shouldLoadCast = !isMonitorPage && !isLoginPage && !isAdminPage;

  // Debug (Client-side only)
  if (typeof window !== 'undefined') {
    console.log(`[App] Current Path: ${router.pathname} | LoadCast: ${shouldLoadCast}`);
  }

  // Initialize Auth Store (Optimistic)
  const initializeAuth = useAuthStore((state) => state.initialize);
  useEffect(() => {
    const unsub = initializeAuth();
    return () => unsub();
  }, [initializeAuth]);

  useEffect(() => {
    // Unregister Service Workers to fix IndexedDB errors
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister();
          console.log('🧹 Service Worker Unregistered');
        }
      });
    }
  }, []);

  return (
    <ToastProvider>
      <AuthContextProvider>
        <FontLoader />
        {/* DefaultSeo removed due to import issues */}
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover"
          />
          <title>YouOke - คาราโอเกะออนไลน์บน YouTube</title>
          <meta name="title" content="YouOke - คาราโอเกะออนไลน์บน YouTube" />
          <meta
            name="description"
            content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง "
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://play.okeforyou.com/" />
          <meta
            property="og:title"
            content="YouOke - คาราโอเกะออนไลน์บน YouTube"
          />
          <meta
            property="og:description"
            content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง 
          "
          />
          <meta property="og:image" content="/assets/og-image.png" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta
            property="twitter:url"
            content="https://play.okeforyou.com/"
          />
          <meta
            property="twitter:title"
            content="YouOke - คาราโอเกะออนไลน์บน YouTube"
          />
          <meta
            property="twitter:description"
            content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง 
          "
          />
          <meta property="twitter:image" content="/assets/og-image.png" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ef4444" />
        </Head>
        {process.env.NODE_ENV !== "production" ? null : (
          <>
            <GoogleAnalytics
              ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || ""}
            />
          </>
        )}
        <QueryClientProvider client={queryClient}>
          <SystemProvider>
            {shouldLoadCast ? (
              // Full Player Stack (Home, Rooms) - Includes Cast SENDER
              <MidiEngineProvider>
                <CastProvider>
                  <Script
                    src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
                    strategy="afterInteractive"
                  />
                  <FirebaseCastProvider>
                    <YouTubeCastProvider>
                      <AdsProvider>
                        <Component {...pageProps} />
                      </AdsProvider>
                    </YouTubeCastProvider>
                  </FirebaseCastProvider>
                </CastProvider>
              </MidiEngineProvider>
            ) : isMonitorPage ? (
              // Monitor Stack (Receiver) - Needs MIDI but NO Cast Sender
              <MidiEngineProvider>
                <AdsProvider>
                  <Component {...pageProps} />
                </AdsProvider>
              </MidiEngineProvider>
            ) : (
              // Lightweight Stack (Login, Admin)
              // Admin/Login don't really need AdsProvider but keeping it for consistency/safety if they define slots
              <AdsProvider>
                <Component {...pageProps} />
              </AdsProvider>
            )}
          </SystemProvider>
        </QueryClientProvider>
        <Analytics />
      </AuthContextProvider >
    </ToastProvider >
  );
}

export default App;
