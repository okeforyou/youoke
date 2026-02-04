import React from 'react';
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
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`
        : null;

    // Use specific styles that mirror the working MVP, but add the image
    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '20px',
        boxSizing: 'border-box',
        // Add background image directly here - Safest method
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '16px',
        marginBottom: '20px',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)', // Add shadow for readability
        fontWeight: 'bold'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '10px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        backdropFilter: 'blur(4px)'
    };

    return (
        <div style={containerStyle}>
            <div style={textStyle}>
                โหมด DJ ทำงานอยู่ (ห้อง {roomCode})
            </div>
            <button style={buttonStyle} onClick={onDisconnect}>
                ยกเลิกการเชื่อมต่อ
            </button>
        </div>
    );
};
