import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamically import Cast providers (code splitting)
const CastProvider = dynamic(
  () => import('../context/CastContext').then((mod) => mod.CastProvider),
  { ssr: false }
);

const FirebaseCastProvider = dynamic(
  () => import('../context/FirebaseCastContext').then((mod) => mod.FirebaseCastProvider),
  { ssr: false }
);

const YouTubeCastProvider = dynamic(
  () => import('../context/YouTubeCastContext').then((mod) => mod.YouTubeCastProvider),
  { ssr: false }
);

interface ConditionalCastProvidersProps {
  children: ReactNode;
}

/**
 * Conditionally loads Cast providers only for pages that need them
 * This reduces bundle size for pages that don't use Cast functionality
 */
export default function ConditionalCastProviders({ children }: ConditionalCastProvidersProps) {
  const router = useRouter();

  // Pages that need Cast providers (Homepage, Dual monitor)
  const needsCastProviders = ['/', '/dual'].includes(router.pathname);

  if (!needsCastProviders) {
    // No Cast providers for other pages (lighter bundle)
    return <>{children}</>;
  }

  // Homepage & Dual: Full Cast stack (dynamically loaded)
  return (
    <CastProvider>
      <FirebaseCastProvider>
        <YouTubeCastProvider>
          {children}
        </YouTubeCastProvider>
      </FirebaseCastProvider>
    </CastProvider>
  );
}
