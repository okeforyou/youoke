import React from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal'; // Assuming we still have this, though user said "simple" button. I'll stick to simple onClick for now as requested "button only".

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif', // System font
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: thumbnailUrl ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden'
    };

    const badgeStyle: React.CSSProperties = {
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: '#dc2626', // Red
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        zIndex: 10
    };

    const iconContainerStyle: React.CSSProperties = {
        marginBottom: '10px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '14px',
        marginBottom: '4px',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        fontWeight: 'bold'
    };

    const subTextStyle: React.CSSProperties = {
        fontSize: '12px',
        marginBottom: '15px',
        textAlign: 'center',
        opacity: 0.9,
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '11px',
        backdropFilter: 'blur(4px)'
    };

    return (
        <div style={containerStyle}>
            {/* DJ Mode Badge */}
            <div style={badgeStyle}>
                โหมด DJ
            </div>

            {/* Center Icon with Animation */}
            <div style={iconContainerStyle}>
                <div className="pulse-ripple"></div>
                <img
                    src="/computer.png"
                    alt="Monitor"
                    style={{
                        width: '40px',
                        height: '40px',
                        filter: 'invert(1)',
                        opacity: 0.9,
                        position: 'relative',
                        zIndex: 2
                    }}
                />
            </div>

            {/* Main Text */}
            <div style={textStyle}>
                เชื่อมต่อระบบ 2 หน้าจอ
            </div>

            {/* Room Code Subtext (optional but helpful for "Room XXXX") */}
            <div style={subTextStyle}>
                (ห้อง {roomCode})
            </div>

            {/* Disconnect Button */}
            <button style={buttonStyle} onClick={onDisconnect}>
                ยกเลิกการเชื่อมต่อ
            </button>

            {/* Styles for animation */}
            <style jsx>{`
                .pulse-ripple {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    animation: ripple 1.5s infinite linear;
                    z-index: 1;
                }
                @keyframes ripple {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};
