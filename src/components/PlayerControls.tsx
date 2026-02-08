/**
 * Player Controls Component
 *
 * Reusable player control buttons for:
 * - Local playback
 * - Firebase Cast Remote
 * - Google Cast Remote
 */

import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/20/solid';

export interface PlayerControlsProps {
  // State
  isPlaying: boolean;

  // Callbacks
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onReplay?: () => void;

  // Optional customization
  showReplay?: boolean;
  className?: string;
}

export default function PlayerControls({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onReplay,
  showReplay = true,
  className = '',
}: PlayerControlsProps) {

  const buttons = [
    // Play/Pause Button
    isPlaying
      ? {
          icon: PauseIcon,
          label: 'หยุด',
          onClick: onPause,
        }
      : {
          icon: PlayIcon,
          label: 'เล่น',
          onClick: onPlay,
        },

    // Next Button
    {
      icon: ForwardIcon,
      label: 'เพลงถัดไป',
      onClick: onNext,
    },

    // Replay Button (optional)
    ...(showReplay && onReplay ? [{
      icon: ArrowUturnLeftIcon,
      label: 'ร้องซ้ำ',
      onClick: onReplay,
    }] : []),
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {buttons.map((btn, index) => (
        <button
          key={index}
          className="btn btn-ghost font-normal text-primary flex h-auto flex-col flex-1 overflow-hidden text-[10px] 2xl:text-xs p-1 gap-0.5 hover:bg-base-200"
          onClick={btn.onClick}
        >
          <btn.icon className="w-5 h-5 2xl:w-6 2xl:h-6" />
          {btn.label}
        </button>
      ))}
    </div>
  );
}
