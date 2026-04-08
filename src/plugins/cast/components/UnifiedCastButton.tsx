import React from 'react';
import clsx from 'clsx';
import { Cast } from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCast } from '@/plugins/cast/context/CastContext';
import { useSystem } from '@/core/container/SystemContext';
import { useToast } from '@/context/ToastContext';

interface UnifiedCastButtonProps {
    className?: string;
    isCircle?: boolean;
}

export const UnifiedCastButton: React.FC<UnifiedCastButtonProps> = ({
    className = "",
    isCircle = true,
}) => {
    const { setCastModalOpen, castMode } = useUIStore();
    const { isConnected, connectionQuality } = useCast();
    const { user } = useSystem().auth();
    const { addToast } = useToast() || { addToast: () => {} };
    const isGuest = !user || user.displayName === 'Guest';

    const isAnyCastActive = isConnected || (castMode !== 'none' && castMode !== undefined);

    const handleCastClick = () => {
        if (isGuest) {
            addToast("กรุณาสมัครสมาชิกเพื่อใช้ฟีเจอร์การ Cast (ฟรี 1 วัน!)", "warning");
            return;
        }
        setCastModalOpen(true);
    };

    return (
        <button
            onClick={handleCastClick}
            className={`btn btn-ghost ${isCircle ? 'btn-circle' : ''} ${isAnyCastActive ? 'text-primary' : 'text-gray-500'} hover:text-primary hover:bg-gray-100 tooltip tooltip-left ${className}`}
            data-tip={isAnyCastActive ? `Casting: ${connectionQuality}` : "Connect to Screen"}
            aria-label="Cast Menu"
        >
            <div className="indicator flex items-center justify-center w-full h-full">
                <Cast className="w-5 h-5" />
                {isAnyCastActive && (
                    <span className={clsx(
                        "indicator-item badge badge-xs animate-pulse",
                        connectionQuality === 'good' && "badge-success",
                        connectionQuality === 'weak' && "badge-warning",
                        connectionQuality === 'lost' && "badge-error"
                    )}></span>
                )}
            </div>
        </button>
    );
};
