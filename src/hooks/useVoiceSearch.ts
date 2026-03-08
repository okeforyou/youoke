// Backup V2: Syncing with stable core
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVoiceSearchProps {
    onResult: (text: string) => void;
    onError?: (error: string) => void;
    language?: string;
}

export const useVoiceSearch = ({ onResult, onError, language = 'th-TH' }: UseVoiceSearchProps) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = language;

            recognitionInstance.onstart = () => {
                setIsListening(true);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (onError) onError(event.error);
                setIsListening(false);
            };

            recognitionInstance.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');

                if (event.results[0].isFinal) {
                    onResult(transcript);
                    recognitionInstance.stop();
                }

                // Reset silence timer on every result
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    if (isListening) {
                        recognitionInstance.stop();
                    }
                }, 2000); // 2 seconds of silence to stop
            };

            setRecognition(recognitionInstance);
        }

        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [language, onResult, onError]);

    const toggleListening = useCallback(() => {
        if (!recognition) {
            if (onError) onError('Speech recognition not supported');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }, [recognition, isListening, onError]);

    return {
        isListening,
        toggleListening,
        isSupported: typeof window !== 'undefined' && (!!recognition || !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
    };
};
