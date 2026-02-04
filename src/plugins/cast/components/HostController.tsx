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

    // 1. Container: Pure Grid/Flex structure. No absolute positioning that risks overflow.
    // Background: Safely applied to this container.
    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Space out content: Badge top, Content center, Button bottom
        padding: '12px',
        boxSizing: 'border-box',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', // System font
        overflow: 'hidden'
    };

    // 2. Top Bar: Holds the Badge. Uses Flex to align right.
    const topBarStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        height: '24px' // Fixed height to prevent shifting
    };

    // 3. Badge: Simple styled div
    const badgeStyle: React.CSSProperties = {
        backgroundColor: '#dc2626', // Red
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
    };

    // 4. Center Content: Icon + Text
    const centerContentStyle: React.CSSProperties = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    // Pulse Animation Ring (Inline-ish)
    // Using a simpler approach: just a static border that fades in/out via simple CSS if possible, 
    // or just a static ring if animation is risky. User requested animation, so we'll try a safe one.

    const iconWrapperStyle: React.CSSProperties = {
        position: 'relative',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '4px'
    };

    const pulseRingStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        boxSizing: 'border-box',
        // Simple animation using standard CSS syntax in styled-jsx below to avoid runtime object issues
    };

    const textMainStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        margin: 0
    };

    const textSubStyle: React.CSSProperties = {
        fontSize: '11px',
        opacity: 0.8,
        textAlign: 'center',
        margin: 0
    };

    // 5. Bottom: Disconnect Button
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
        padding: '6px 14px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '11px',
        backdropFilter: 'blur(4px)'
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
                            width: '28px',
                            height: '28px',
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
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
