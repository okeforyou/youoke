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
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`
        : null;

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Changed from space-between to center to group things closer
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box',
        color: 'white',
        // Updated font stack to prioritize Thai fonts as "System Font" usually implies
        fontFamily: '"Prompt", "Kanit", "Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        position: 'relative'
    };

    // Absolute position for Badge to keep it independent of center stack
    const badgeContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10
    };

    const badgeStyle: React.CSSProperties = {
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    };

    const centerContentStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px', // Reduced gap
        marginBottom: '10px' // Space before button
    };

    const iconWrapperStyle: React.CSSProperties = {
        position: 'relative',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '4px'
    };

    const textMainStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        margin: 0,
        whiteSpace: 'nowrap'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        backdropFilter: 'blur(4px)',
        fontWeight: 500,
        marginTop: '0px' // Removed extra margin
    };

    return (
        <div style={containerStyle}>
            {/* Top Right Badge (Absolute) */}
            <div style={badgeContainerStyle}>
                <div style={badgeStyle}>
                    โหมด DJ
                </div>
            </div>

            {/* Center Group */}
            <div style={centerContentStyle}>
                {/* Icon */}
                <div style={iconWrapperStyle}>
                    <div className="pulse-ring"></div>
                    <img
                        src="/computer.png"
                        alt="Monitor"
                        style={{
                            width: '32px',
                            height: '32px',
                            filter: 'invert(1)',
                            opacity: 0.9,
                            position: 'relative',
                            zIndex: 2
                        }}
                    />
                </div>

                {/* Text: Single Line */}
                <h3 style={textMainStyle}>
                    กำลังเชื่อมหน้าจอที่ 2 (ห้อง {roomCode})
                </h3>
            </div>

            {/* Button directly below text */}
            <button style={buttonStyle} onClick={onDisconnect}>
                ยกเลิกการเชื่อมต่อ
            </button>

            <style jsx>{`
                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    animation: pulse 2s infinite ease-out;
                }
                @keyframes pulse {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
