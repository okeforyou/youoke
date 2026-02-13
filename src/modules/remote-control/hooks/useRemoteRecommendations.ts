
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { searchPlaylists } from '../../../utils/api';

const DEFAULT_TOPICS = ["Thailand Top 50", "เพลงฮิต TikTok", "ลูกทุ่งมาแรง", "90s Thai Pop"];

/**
 * Lightweight hook for Remote Search Recommendations
 */
export function useRemoteRecommendations() {
    const { config } = useSystemConfig();
    const [currentTopic, setCurrentTopic] = useState("");

    const topics = config?.recommendations?.topics?.length > 0
        ? config.recommendations.topics
        : DEFAULT_TOPICS;

    const shuffle = useCallback(() => {
        const otherTopics = topics.filter(t => t !== currentTopic);
        const newTopic = otherTopics[Math.floor(Math.random() * otherTopics.length)];
        setCurrentTopic(newTopic || topics[0]);
    }, [topics, currentTopic]);

    // Initial Pick
    useEffect(() => {
        if (topics.length > 0 && !currentTopic) {
            setCurrentTopic(topics[Math.floor(Math.random() * topics.length)]);
        }
    }, [topics]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["remoteRecs", currentTopic],
        queryFn: () => searchPlaylists(currentTopic),
        enabled: !!currentTopic,
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });

    return {
        topics,
        currentTopic,
        playlists: data?.artistCategories || [],
        isLoading: isLoading || isFetching,
        shuffle,
        setCurrentTopic
    };
}
