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
    // This is the EXACT code that worked previously (MVP)
    // No z-index complexities, no absolute positioning layers yet.

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#222', // Modified to Dark Gray to distinguish from parent black
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '20px',
        boxSizing: 'border-box'
    };

    const textStyle: React.CSSProperties = {
        fontSize: '16px',
        marginBottom: '20px',
        textAlign: 'center'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px'
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
