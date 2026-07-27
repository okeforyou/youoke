import { useEffect } from 'react';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';

const fetchWithFallback = async (endpoint: string, options?: RequestInit) => {
    let res5050;
    try {
        res5050 = await fetch(`http://127.0.0.1:5050${endpoint}`, options);
        if (res5050.ok) return res5050;
    } catch (e) {}

    let res8055;
    try {
        res8055 = await fetch(`http://127.0.0.1:8055${endpoint}`, options);
        if (res8055.ok) return res8055;
    } catch (e) {}

    if (res5050) return res5050;
    if (res8055) return res8055;
    throw new Error("AI Server is unreachable.");
};
export function useAiProcessor() {
  const queue = usePlayerStore((state) => state.queue);
  const updateQueueItem = usePlayerStore((state) => state.updateQueueItem);

  useEffect(() => {
    // Find the first pending AI extraction in the queue
    const pendingItem = queue.find(
      (item) => item.sourceType === 'youoke_ai' && item.aiStatus === 'pending'
    );

    if (pendingItem) {
      // Mark as processing
      updateQueueItem(pendingItem.uuid, { aiStatus: 'processing' });

      // Start processing
      fetchWithFallback('/separate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: pendingItem.videoId }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('AI processing failed');
          }
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success' || data.status === 'cached') {
            updateQueueItem(pendingItem.uuid, { aiStatus: 'ready' });
          } else {
            updateQueueItem(pendingItem.uuid, { aiStatus: 'error' });
          }
        })
        .catch((error) => {
          console.error('AI Processing Error:', error);
          updateQueueItem(pendingItem.uuid, { aiStatus: 'error' });
        });
    }
  }, [queue, updateQueueItem]);
}
