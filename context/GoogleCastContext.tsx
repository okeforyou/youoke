import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFirebaseCast } from './FirebaseCastContext';

// Define types for Chrome Cast API
declare global {
    interface Window {
        __onGCastApiAvailable: (available: boolean, reason?: string) => void;
    }
}

interface GoogleCastContextValue {
    isCastAvailable: boolean;
    castSession: any | null;
    requestSession: () => Promise<void>;
    endSession: () => void;
}

const GoogleCastContext = createContext<GoogleCastContextValue | undefined>(undefined);

export const GoogleCastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isCastAvailable, setIsCastAvailable] = useState(false);
    const [castSession, setCastSession] = useState<any | null>(null);

    // existing Firebase context to get room code
    const { roomCode, createRoom, isHost } = useFirebaseCast();

    // Initialize Cast API
    useEffect(() => {
        // Callback when API is loaded
        window['__onGCastApiAvailable'] = (available: boolean, reason?: string) => {
            if (available) {
                initializeCastApi();
            }
        };

        // If API already loaded before component mount
        const chrome = (window as any).chrome;
        if (chrome && chrome.cast && chrome.cast.isAvailable) {
            initializeCastApi();
        }
    }, []);

    const initializeCastApi = () => {
        console.log('📺 Google Cast API Available. Initializing...');

        // Application ID from User Screenshot
        const applicationID = '4FB4C174';

        const chrome = (window as any).chrome;
        if (!chrome?.cast) return;

        const sessionRequest = new chrome.cast.SessionRequest(applicationID);
        const apiConfig = new chrome.cast.ApiConfig(
            sessionRequest,
            sessionListener,
            receiverListener
        );

        chrome.cast.initialize(
            apiConfig,
            () => {
                console.log('✅ Google Cast Initialized');
                setIsCastAvailable(true);
            },
            (error: any) => console.error('❌ Google Cast Init Error:', error)
        );
    };

    const sessionListener = (session: any) => {
        console.log('📺 Session started/resumed:', session.sessionId);
        setCastSession(session);

        if (session.media && session.media[0]) {
            // Session has media
        }

        // Listen for updates
        session.addUpdateListener(sessionUpdateListener);

        // HANDSHAKE: Send Room Code if currently active
        // We defer this slightly to ensure connection is ready
        setTimeout(() => {
            sendHandshake(session);
        }, 1000);
    };

    const sendHandshake = async (session: any) => {
        // Logic handled in useEffect or requestSession
        // This listener is for auto-reconnects
    };

    const sessionUpdateListener = (isAlive: boolean) => {
        if (!isAlive) {
            setCastSession(null);
            console.log('📺 Session ended');
        }
    };

    const receiverListener = (availability: string) => {
        // console.log('📺 Receiver availability:', availability);
    };

    const requestSession = async () => {
        if (!isCastAvailable) {
            console.warn('Cast API not available');
            return;
        }

        try {
            // 1. Create Room first if not exists
            let currentRoomCode = roomCode;
            if (!currentRoomCode) {
                console.log('Creating room before casting...');
                currentRoomCode = await createRoom();
            }

            console.log('Requesting Cast Session for room:', currentRoomCode);

            // 2. Request Session
            await new Promise((resolve, reject) => {
                const chrome = (window as any).chrome;
                if (!chrome?.cast) return reject('No cast api');

                chrome.cast.requestSession(
                    (session: any) => {
                        sessionListener(session); // Usually called automatically, but good to be sure

                        // 3. Send Room Code
                        sendMessageToReceiver(session, currentRoomCode);
                        resolve(session);
                    },
                    (error: any) => reject(error)
                );
            });

        } catch (e) {
            console.error('Cast Request Failed:', e);
        }
    };

    const sendMessageToReceiver = (session: any, code: string) => {
        const namespace = 'urn:x-cast:com.okeforyou.cast';
        const message = JSON.stringify({
            type: 'JOIN_ROOM',
            payload: { roomCode: code }
        });

        session.sendMessage(
            namespace,
            message,
            () => console.log('✅ Room Code sent to TV:', code),
            (e: any) => console.error('❌ Failed to send Room Code:', e)
        );
    };

    const endSession = () => {
        if (castSession) {
            const chrome = (window as any).chrome;
            chrome.cast.requestSession(
                () => { },
                () => { }
            ); // This just opens dialog usually?
            // Use polling or stop()
            castSession.stop(
                () => setCastSession(null),
                (e: any) => console.error(e)
            );
        }
    };

    // Effect: If roomCode changes (e.g. just created) and we have an active session, send it!
    useEffect(() => {
        if (roomCode && castSession) {
            sendMessageToReceiver(castSession, roomCode);
        }
    }, [roomCode, castSession]);

    return (
        <GoogleCastContext.Provider value={{ isCastAvailable, castSession, requestSession, endSession }}>
            {children}
        </GoogleCastContext.Provider>
    );
};

export const useGoogleCast = () => {
    const context = useContext(GoogleCastContext);
    if (!context) throw new Error('useGoogleCast must be used within GoogleCastProvider');
    return context;
};
