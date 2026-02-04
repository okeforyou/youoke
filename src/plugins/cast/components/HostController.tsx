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
        boxSizing: 'border-box'
    };

    const textStyle: React.CSSProperties = {
        fontSize: '16px',
        marginBottom: '20px',
        textAlign: 'center'
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: '#dc2626', // Red color
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
