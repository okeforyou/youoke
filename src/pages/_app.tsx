import '../styles/global.css'
import type { AppProps } from 'next/app'

import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Analytics } from '@vercel/analytics/react'

import GoogleAnalytics from '../components/GoogleAnalytics'
import { AdsProvider } from '@/context/AdsContext'
import { AuthContextProvider } from '@/context/AuthContext' 
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { CastProvider } from '../plugins/cast/context/CastContext'
import { FirebaseCastProvider } from '@/context/FirebaseCastContext'
import { YouTubeCastProvider } from '@/context/YouTubeCastContext'
import { ToastProvider } from '@/context/ToastContext'
import { MidiEngineProvider } from '@/context/MidiEngineContext'
import { FontLoader } from '../components/FontLoader';
import GlobalErrorBoundary from '../components/GlobalErrorBoundary';
import { GlobalConfirmModal } from '../components/common/GlobalConfirmModal';

import { useSystemThemeSync } from '../hooks/useSystemThemeSync';
import { SystemProvider } from '../core/container/SystemContext';
import { useFcmToken } from '../hooks/useFcmToken';

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

  // Initialize FCM Token
  useFcmToken();

  const isChromecastReceiver = router.pathname === '/chromecast';
  const isReceiverPath = ['/monitor', '/receiver', '/tv'].includes(router.pathname);
  const isLoginPage = router.pathname === '/login';
  const isAdminPage = router.pathname.startsWith('/admin');

  const shouldLoadCast = !isChromecastReceiver && !isReceiverPath && !isLoginPage && !isAdminPage;

  // Initializing Auth Store
  const { initialize: initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsub = initializeAuth();
    
    // v4.9.75: Initial Dark Mode Sync
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    return () => unsub();
  }, [initializeAuth]);

  return (
    <ToastProvider>
      <AuthContextProvider>
        <GlobalErrorBoundary>
          <FontLoader />
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
              content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง "
            />
            <meta property="og:image" content="/assets/og-image.png" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content="https://play.okeforyou.com/" />
            <meta
              property="twitter:title"
              content="YouOke - คาราโอเกะออนไลน์บน YouTube"
            />
            <meta
              property="twitter:description"
              content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง "
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
            <GoogleAnalytics
              ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || ""}
            />
          )}
          <QueryClientProvider client={queryClient}>
            <SystemProvider>
              {shouldLoadCast ? (
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
              ) : (isChromecastReceiver || isReceiverPath) ? (
                <MidiEngineProvider>
                  <AdsProvider>
                    <CastProvider>
                      <Component {...pageProps} />
                    </CastProvider>
                  </AdsProvider>
                </MidiEngineProvider>
              ) : (
                <AdsProvider>
                  <Component {...pageProps} />
                </AdsProvider>
              )}
            </SystemProvider>
          </QueryClientProvider>
          <Analytics />
          <GlobalConfirmModal />
        </GlobalErrorBoundary>
      </AuthContextProvider >
    </ToastProvider >
  );
}

export default App;
