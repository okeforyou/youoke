import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    roomCode,
    onDisconnect,
    currentVideoTitle
}) => {
    const { state } = useFirebaseCast();
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const currentVideo = state.currentVideo;
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`
        : null;

    const songTitle = currentVideoTitle || currentVideo?.title || '';

    return (
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

            {/* Background blur */}
            {thumbnailUrl && (
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={thumbnailUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', transform: 'scale(1.1)' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                </div>
            )}

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '12px', gap: '6px' }}>

                {/* Icon */}
                <img src="/computer.png" alt="" style={{ width: '24px', height: '24px', filter: 'invert(1)', opacity: 0.8 }} />

                {/* Title */}
                <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', margin: 0 }}>โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing */}
                {currentVideo && (
                    <div style={{ width: '100%', maxWidth: '180px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '8px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                            {songTitle}
                        </p>
                        {/* Tiny badge */}
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            marginTop: '3px',
                            padding: '1px 4px',
                            backgroundColor: 'rgba(220,38,38,0.3)',
                            border: '1px solid rgba(220,38,38,0.5)',
                            borderRadius: '3px',
                            fontSize: '6px',
                            color: '#fca5a5',
                            fontWeight: 500
                        }}>
                            <span style={{ width: '3px', height: '3px', backgroundColor: '#f87171', borderRadius: '50%' }}></span>
                            กำลังเล่น
                        </span>
                    </div>
                )}

                {/* Disconnect */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    style={{
                        padding: '3px 10px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 500,
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                    }}
                >
                    ยกเลิกการเชื่อมต่อ
                </button>

            </div>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
