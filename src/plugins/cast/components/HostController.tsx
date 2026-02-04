import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    roomCode,
    onDisconnect
}) => {
    const { state } = useFirebaseCast();
    const currentVideo = state.currentVideo;
    const [imgError, setImgError] = useState(false);

    // Use a high-quality thumbnail if available, otherwise standard
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`
        : null;

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a', // Fallback color
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate' // Create new stacking context
    };

    const backgroundContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Behind content
    };

    const bgImageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(15px) brightness(0.4)', // Blur and darken in one go
        transform: 'scale(1.2)', // Scale up to hide blur edges
    };

    const contentStyle: React.CSSProperties = {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'transparent',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        marginTop: '15px',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={containerStyle}>
            {/* Background Layer */}
            {thumbnailUrl && !imgError && (
                <div style={backgroundContainerStyle}>
                    <img
                        src={thumbnailUrl}
                        alt=""
                        style={bgImageStyle}
                        onError={() => setImgError(true)}
                    />
                </div>
            )}

            {/* Content Layer */}
            <div style={contentStyle}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                    โหมด DJ ทำงานอยู่
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    ห้อง {roomCode}
                </div>

                <button
                    style={buttonStyle}
                    onClick={onDisconnect}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>
        </div>
    );
};
