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

    // REVERTING TO THE SAFE SINGLE-CONTAINER METHOD
    // NO Absolute background layers.
    // Applied styling directly to this container.

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        // Use simpler background strategy that worked
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px',
        boxSizing: 'border-box',
        color: 'white',
        // System font as requested
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: 'hidden'
    };

    const topBarStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        height: '24px'
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
        fontFamily: 'inherit'
    };

    const centerContentStyle: React.CSSProperties = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
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

    // Updated Font Sizes as requested
    const textMainStyle: React.CSSProperties = {
        fontSize: '16px', // Bigger
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        margin: 0,
        fontFamily: 'inherit'
    };

    const textSubStyle: React.CSSProperties = {
        fontSize: '13px', // Bigger
        opacity: 0.9,
        textAlign: 'center',
        margin: 0,
        fontFamily: 'inherit'
    };

    const buttonContainerStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '8px'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '8px 18px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        backdropFilter: 'blur(4px)',
        fontWeight: 500,
        fontFamily: 'inherit'
    };

    return (
        <div style={containerStyle}>
            {/* Top: Badge */}
            <div style={topBarStyle}>
                <div style={badgeStyle}>
                    โหมด DJ
                </div>
            </div>

            {/* Center: Icon + Text */}
            <div style={centerContentStyle}>
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
                <div>
                    <h3 style={textMainStyle}>เชื่อมต่อระบบ 2 หน้าจอ</h3>
                    <p style={textSubStyle}>(ห้อง {roomCode})</p>
                </div>
            </div>

            {/* Bottom: Button */}
            <div style={buttonContainerStyle}>
                <button style={buttonStyle} onClick={onDisconnect}>
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>

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
