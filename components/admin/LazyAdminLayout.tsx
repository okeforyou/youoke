import dynamic from 'next/dynamic';

/**
 * Lazy-loaded AdminLayout wrapper
 *
 * This reduces initial bundle size by only loading admin components
 * when users actually visit admin pages.
 *
 * Benefits:
 * - Smaller initial bundle for non-admin users
 * - Faster page load for public pages
 * - Admin components only loaded on-demand
 */

const AdminLayout = dynamic(() => import('./AdminLayout'), {
  loading: () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  ),
  ssr: false, // Admin pages don't need SSR for the layout
});

export default AdminLayout;
