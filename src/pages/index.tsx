import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "../layouts/MainLayout";

import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { useUIStore } from "../stores/useUIStore";
import { HeroSection } from "../components/HeroSection";
import { useSystemConfig } from "../hooks/useSystemConfig";
import { HomePageContent } from "../components/home/HomePageContent";

export default function HomePage() {
  const { config } = useSystemConfig();
  const { isProfileOpen } = useUIStore();
  const {
    activeIndex,
    setActiveIndex,
    searchTerm,
  } = usePlayerStore();

  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Deep Link / Router Sync for Tabs
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;

    // Map query param to index
    const tabMap: Record<string, number> = {
      'home': 1,
      'trending': 2,
      'station': 3,
      'playlists': 4,
      'library': 4,
      'aivocal': 5
    };

    const tab = router.query.tab as string;
    if (tab && tabMap[tab]) {
      setActiveIndex(tabMap[tab]);
    } else if (!tab && !router.query.view && !searchTerm) {
      // If no tab, no view (modal), no search -> Default to Home
      // But be careful not to override if user just clicked a search result
      if (activeIndex !== 1) setActiveIndex(1);
    }
  }, [router.query.tab, router.isReady]);

  // Sync Search with URL
  useEffect(() => {
    if (!router.isReady) return;

    const querySearch = router.query.search as string;

    // If URL has search, sync to store
    if (querySearch && querySearch !== searchTerm) {
      usePlayerStore.setState({ searchTerm: querySearch });
    }
    // If URL has NO search, but store HAS search (and we are not just starting typing in the box)
    // Detailed check: If we just hit BACK from a search view, we want to clear the store.
    else if (!querySearch && searchTerm && activeIndex === 0) {
      // Only clear if we are in "Search Results" mode (activeIndex 0). 
      // If user is typing in a non-active search box, don't clear? 
      // Actually, activeIndex 0 IS the search result view.
      usePlayerStore.setState({ searchTerm: '' });

      // Restore tab if needed (though the tab effect above should handle it if tab param exists)
      const tab = router.query.tab as string;
      const tabMap: Record<string, number> = { 'home': 1, 'trending': 2, 'station': 3, 'playlists': 4, 'library': 4, 'aivocal': 5 };
      if (tab && tabMap[tab]) {
        setActiveIndex(tabMap[tab]);
      } else {
        setActiveIndex(1);
      }
    }
  }, [router.query.search, router.isReady, router.query.tab]);

  // Reset to search results if typing, or back home if cleared
  useEffect(() => {
    if (searchTerm) {
      if (activeIndex !== 0 && activeIndex !== 3) setActiveIndex(0);
    } else if (activeIndex === 0) {
      // If search cleared and we're looking at search results, go back to Home
      setActiveIndex(1);
    }
  }, [searchTerm, activeIndex, setActiveIndex]);

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen">
        {/* Content Grid */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
          {mounted ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <HomePageContent />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-video bg-gray-50 rounded-2xl animate-pulse border border-gray-100"></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout >
  );
}
