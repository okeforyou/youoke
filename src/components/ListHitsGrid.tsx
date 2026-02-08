import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlayIcon } from "@heroicons/react/24/solid";
import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { getHitSingles, getSearchResult } from "../utils/api";
import { Single } from "../types";

export default function ListHitsGrid() {
    const [hits, setHits] = useState<Single[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchHits = async () => {
            try {
                const data = await getHitSingles();
                if (data.singles) {
                    setHits(data.singles);
                }
            } catch (error) {
                console.error("Failed to fetch hits:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHits();
    }, []);

    const handleClick = (hit: Single) => {
        // Switch to Search Mode via URL so history is preserved
        const query = `${hit.title} ${hit.artist_name}`;
        router.push({
            pathname: router.pathname,
            query: { ...router.query, search: query }
        }, undefined, { shallow: true });
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="pt-2 px-4 pb-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                เพลงฮิตติดกระแส (Thailand Top 50)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hits.map((hit, index) => (
                    <div
                        key={`${hit.title}-${index}`}
                        onClick={() => handleClick(hit)}
                        className="group relative cursor-pointer bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        {/* Cover Image Container */}
                        <div className="relative aspect-square overflow-hidden">
                            <img
                                src={hit.coverImageURL}
                                alt={hit.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Gradient Overlay (Always visible but stronger on hover) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                            {/* Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="absolute bottom-0 inset-x-0 p-4 text-left">
                            <h3 className="text-white font-bold text-sm line-clamp-1 leading-tight mb-1 group-hover:text-primary transition-colors">
                                {hit.title}
                            </h3>
                            <p className="text-gray-300 text-xs line-clamp-1 font-medium">
                                {hit.artist_name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
