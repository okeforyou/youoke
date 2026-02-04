import React from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
    currentVideoId?: string; // Prop for local fallback
}

export const HostController: React.FC<HostControllerProps> = ({
    roomCode,
    onDisconnect,
    isDualMode,
    currentVideoId
}) => {
    const { state } = useFirebaseCast();
    const currentVideo = state.currentVideo;
    // Fallback to local ID if Firebase state is empty (Dual Mode)
    const targetVideoId = currentVideo?.videoId || currentVideoId;

    const thumbnailUrl = targetVideoId
        ? `https://i.ytimg.com/vi/${targetVideoId}/maxresdefault.jpg`
        : null;

    // STRATEGY: CSS Grid.
    // Row 1: Top Bar (Badge) - Fixed height or auto.
    // Row 2: Content (Icon, Text, Button) - Takes remaining space.
    // This physically prevents overlap.

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',

        display: 'grid',
        gridTemplateRows: 'auto 1fr',

        padding: '12px',
        boxSizing: 'border-box',
        color: 'white',
        // fontFamily removed to inherit app font
        overflow: 'hidden'
    };

    // Row 1: Top Bar
    const topBarStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingBottom: '0px'
    };

    const badgeStyle: React.CSSProperties = {
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '2px 10px',
        borderRadius: '99px', // Fully rounded
        fontSize: '11px',
        fontWeight: 400, // "Not thick"
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap'
    };

    // Row 2: Main Content Area
    const mainContentAreaStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Center vertically in the remaining space
        gap: '6px',              // Reduced gap
        width: '100%'
    };

    // Icon + Text Group
    const infoGroupStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px' // Reduced gap
    };

    const iconWrapperStyle: React.CSSProperties = {
        position: 'relative',
        width: '64px', // Increased size
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const textMainStyle: React.CSSProperties = {
        fontSize: '15px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        margin: 0,
        lineHeight: 1.4
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
        transition: 'background-color 0.2s'
    };

    // Dynamic text based on mode
    const statusText = isDualMode ? 'โหมดจอแยก' : 'กำลังสั่งงานทีวี';

    return (
        <div style={containerStyle}>
            {/* GRID ROW 1: Top Bar with Badge */}
            <div style={topBarStyle}>
                <div style={badgeStyle}>
                    โหมด DJ
                </div>
            </div>

            {/* GRID ROW 2: Main Content */}
            <div style={mainContentAreaStyle}>

                {/* Icon + Text Group */}
                <div style={infoGroupStyle}>
                    <div style={iconWrapperStyle}>
                        <div className="pulse-ring"></div>
                        <img
                            src="/computer.png"
                            alt="Monitor"
                            style={{
                                width: '40px', // Increased size
                                height: '40px',
                                filter: 'invert(1)',
                                opacity: 0.95,
                                position: 'relative',
                                zIndex: 2
                            }}
                        />
                    </div>

                    <h3 style={textMainStyle}>
                        {statusText} {!isDualMode && `(ห้อง ${roomCode})`}
                    </h3>
                </div>

                {/* Disconnect Button */}
                <button
                    style={buttonStyle}
                    onClick={onDisconnect}
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
                    background: rgba(220, 38, 38, 0.5); /* Red pulse */
                    animation: pulse 2s infinite ease-out;
                    box-shadow: 0 0 10px rgba(220, 38, 38, 0.4); /* Glow effect */
                }
                @keyframes pulse {
                    0% { transform: scale(0.6); opacity: 0.8; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
