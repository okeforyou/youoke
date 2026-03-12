import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlayIcon } from "@heroicons/react/24/solid";
import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { getHitSingles, getSearchResult } from "../utils/api";
import { Single } from "../types";
import { useQuery } from "@tanstack/react-query";

export default function ListHitsGrid() {
    const router = useRouter();
    const { data: hitsData, isLoading } = useQuery({
        queryKey: ["hitSingles"],
        queryFn: getHitSingles,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const hits = hitsData?.singles || [];

    const handleClick = (hit: Single) => {
        const artist = (hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "";
        const query = `${hit.title} ${artist}`.trim();
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
            <h2 className="text-[17px] font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
                เพลงฮิตติดกระแส (Thailand Top 50)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hits.map((hit, index) => (
                    <div
                        key={`${hit.title}-${index}`}
                        onClick={() => handleClick(hit)}
                        className="group relative cursor-pointer bg-white rounded-2xl p-2.5 border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        {/* Cover Image Container */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                                src={hit.coverImageURL}
                                alt={hit.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="mt-3 px-1">
                            <h3 className="text-black dark:text-white font-bold text-[12px] line-clamp-2 leading-snug text-left group-hover:text-primary transition-colors">
                                {hit.title}
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 text-left">
                                {(hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "ศิลปิน"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
