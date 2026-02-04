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

    // Try maxresdefault first for better quality/aspect ratio
    const videoId = currentVideo?.videoId;
    const thumbnailUrl = videoId
        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        : null;

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#111', // Very dark gray instead of pure black to see boundaries
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
        isolation: 'isolate'
    };

    const backgroundStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-10%', // Offset to ensure coverage
        left: '-10%',
        width: '120%', // Oversize to guarantee fill
        height: '120%',
        zIndex: -1,
        backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        // filter: 'blur(20px) brightness(0.5)', // Removed for debugging
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
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        marginTop: '12px',
        backdropFilter: 'blur(4px)'
    };

    return (
        <div style={containerStyle}>
            {/* Background Layer */}
            {thumbnailUrl && <div style={backgroundStyle} />}

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
                >
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>
        </div>
    );
};
