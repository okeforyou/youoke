import React from 'react';
import { Cast } from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCast } from '@/plugins/cast/context/CastContext';

interface UnifiedCastButtonProps {
    className?: string;
    isCircle?: boolean;
}

export const UnifiedCastButton: React.FC<UnifiedCastButtonProps> = ({
    className = "",
    isCircle = true,
}) => {
    const { setCastModalOpen } = useUIStore();
    const { isConnected } = useCast();
    // We can add more indicators here (e.g. if Dual Mode is active)

    return (
        <button
            onClick={() => setCastModalOpen(true)}
            className={`btn btn-ghost ${isCircle ? 'btn-circle' : ''} text-gray-500 hover:text-primary hover:bg-gray-100 tooltip tooltip-left ${className}`}
            data-tip="Connect to Screen"
            aria-label="Cast Menu"
        >
            <div className="indicator flex items-center justify-center w-full h-full">
                <Cast className="w-5 h-5" />
                {isConnected && (
                    <span className="indicator-item badge badge-xs badge-success animate-pulse"></span>
                )}
            </div>
        </button>
    );
};
