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

    // Basic inline styles to guarantee rendering without Tailwind conflicts
    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
    };

    const backgroundContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
    };

    const bgImageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(20px)',
        transform: 'scale(1.1)' // Scale up to hide blur edges
    };

    const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for text readability
        zIndex: 1
    };

    const contentStyle: React.CSSProperties = {
        position: 'relative',
        zIndex: 10, // Ensure content is above background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    };

    const textStyle: React.CSSProperties = {
        fontSize: '16px',
        marginBottom: '20px',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        backdropFilter: 'blur(5px)'
    };

    return (
        <div style={containerStyle}>
            {/* Background Blur */}
            {thumbnailUrl && (
                <div style={backgroundContainerStyle}>
                    <img src={thumbnailUrl} alt="" style={bgImageStyle} />
                    <div style={overlayStyle} />
                </div>
            )}

            {/* Content */}
            <div style={contentStyle}>
                <div style={textStyle}>
                    โหมด DJ ทำงานอยู่ (ห้อง {roomCode})
                </div>
                <button style={buttonStyle} onClick={onDisconnect}>
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>
        </div>
    );
};
