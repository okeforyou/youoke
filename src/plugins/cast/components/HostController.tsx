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
        // Increased blur to 10px and darkened overlay to 0.8 for better text contrast
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px',
        boxSizing: 'border-box',
        color: 'white',
        // System font stack as requested
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: 'hidden'
    };

    // Note: We can't apply CSS filter blur to the background-image directly on the container comfortably 
    // without affecting content or using pseudo-elements which react inline styles struggle with.
    // However, the user asked to make it *more blurry*. 
    // Since we are using the single-container "safe" method, we can simulate blur by making the overlay darker (done above 0.8)
    // OR we revert to the div overlay method BUT keep it positioned relative/absolute safely.
    // Let's stick to the container method for stability, but we'll try `backdrop-filter` on the content? No, that blurs the content background.
    // Actually, to blur the background image *only* with this safe layout, we effectively need a separate div layer again.
    // BUT since the user said "It works now", I should be very careful not to break layout again.
    // I will use a separate absolute div for the background *inside* the relative flex container, but keep text in relative z-index 2.
    // This is the hybrid safe approach.

    return (
        <div style={{ ...containerStyle, position: 'relative', isolation: 'isolate', backgroundImage: 'none' }}>
            {/* Safe Background Layer */}
            {thumbnailUrl && (
                <div style={{
                    position: 'absolute',
                    top: '-10%', left: '-10%', right: '-10%', bottom: '-10%', // Oversize to hide blur edges
                    zIndex: -1,
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(8px) brightness(0.4)', // Increased blur as requested
                }} />
            )}

            {/* Top: Badge */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', height: '24px', zIndex: 2 }}>
                <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px', // Slightly larger
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    fontFamily: 'inherit'
                }}>
                    โหมด DJ
                </div>
            </div>

            {/* Center: Icon + Text */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 2 }}>
                <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <div className="pulse-ring"></div>
                    <img
                        src="/computer.png"
                        alt="Monitor"
                        style={{ width: '32px', height: '32px', filter: 'invert(1)', opacity: 0.95, position: 'relative', zIndex: 2 }}
                    />
                </div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,1)', margin: 0, fontFamily: 'inherit' }}>
                        เชื่อมต่อระบบ 2 หน้าจอ
                    </h3>
                    <p style={{ fontSize: '13px', opacity: 0.9, textAlign: 'center', margin: '4px 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.8)', fontFamily: 'inherit' }}>
                        (ห้อง {roomCode})
                    </p>
                </div>
            </div>

            {/* Bottom: Button */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '8px', zIndex: 2 }}>
                <button
                    onClick={onDisconnect}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        backdropFilter: 'blur(4px)',
                        fontFamily: 'inherit',
                        fontWeight: 500
                    }}
                >
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>

            <style jsx>{`
                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    animation: pulse 2.5s infinite ease-out;
                }
                @keyframes pulse {
                    0% { transform: scale(0.8); opacity: 0.6; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
