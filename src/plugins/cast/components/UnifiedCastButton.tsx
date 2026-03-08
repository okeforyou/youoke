import React from 'react';
import { Cast } from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCast } from '@/plugins/cast/context/CastContext';
import { usePlayerStore } from '@/modules/player/stores/usePlayerStore';

interface UnifiedCastButtonProps {
    className?: string;
    isCircle?: boolean;
}

export const UnifiedCastButton: React.FC<UnifiedCastButtonProps> = ({
    className = "",
    isCircle = true,
}) => {
    const { setCastModalOpen, castMode } = useUIStore();
    const { isConnected } = useCast();

    const isAnyCastActive = isConnected || (castMode !== 'none' && castMode !== undefined);

    return (
        <button
            onClick={() => setCastModalOpen(true)}
            className={`btn btn-ghost ${isCircle ? 'btn-circle' : ''} ${isAnyCastActive ? 'text-primary' : 'text-gray-500'} hover:text-primary hover:bg-gray-100 tooltip tooltip-left ${className}`}
            data-tip={isAnyCastActive ? "Casting Active" : "Connect to Screen"}
            aria-label="Cast Menu"
        >
            <div className="indicator flex items-center justify-center w-full h-full">
                <Cast className="w-5 h-5" />
                {isAnyCastActive && (
                    <span className="indicator-item badge badge-xs badge-success animate-pulse"></span>
                )}
            </div>
        </button>
    );
};
