import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVoiceSearchProps {
    onResult: (text: string) => void;
    onError?: (error: string) => void;
    language?: string;
}

export const useVoiceSearch = ({ onResult, onError, language = 'th-TH' }: UseVoiceSearchProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Store callbacks in refs to avoid re-creating the recognition instance
    // when the parent component re-renders with new inline functions
    const onResultRef = useRef(onResult);
    const onErrorRef = useRef(onError);

    // Keep refs up-to-date without triggering effects
    useEffect(() => { onResultRef.current = onResult; }, [onResult]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    // Initialize SpeechRecognition ONCE on mount (not on every render)
    useEffect(() => {
        const SpeechRecognition = typeof window !== 'undefined'
            ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
            : null;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        const instance = new SpeechRecognition();
        instance.continuous = false;
        instance.interimResults = true;
        instance.lang = language;

        instance.onstart = () => {
            setIsListening(true);
        };

        instance.onend = () => {
            setIsListening(false);
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        };

        instance.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (onErrorRef.current) onErrorRef.current(event.error);
            setIsListening(false);
        };

        instance.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');

            if (event.results[0].isFinal) {
                onResultRef.current(transcript);
                instance.stop();
                return;
            }

            // Reset silence timer on every interim result
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                try { instance.stop(); } catch (e) { /* ignore */ }
            }, 2000); // 2 seconds of silence → stop
        };

        recognitionRef.current = instance;

        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            try { instance.stop(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        };
    }, [language]); // Only re-create if language changes, NOT on callback changes

    const toggleListening = useCallback(() => {
        const rec = recognitionRef.current;
        if (!rec) {
            if (onErrorRef.current) onErrorRef.current('Speech recognition not supported');
            return;
        }

        if (isListening) {
            rec.stop();
        } else {
            try {
                rec.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }, [isListening]);

    return {
        isListening,
        toggleListening,
        isSupported
    };
};
