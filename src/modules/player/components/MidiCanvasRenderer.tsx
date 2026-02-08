import React, { useEffect, useRef } from 'react';
import { useMidiEngine } from '../../../context/MidiEngineContext';

// Simple visualizer for now, will enhance later
export const MidiCanvasRenderer = () => {
    const { isPlaying, error } = useMidiEngine();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            // Draw dummy visualization
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (isPlaying) {
                ctx.fillStyle = '#0f0';
                const height = Math.random() * canvas.height;
                ctx.fillRect(50, canvas.height - height, 50, height);
            }

            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText("MIDI Visualizer Placeholder", 20, 30);

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [isPlaying]);

    if (error) {
        return <div className="text-red-500">MIDI Error: {error}</div>;
    }

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full bg-black/80"
            width={800}
            height={600}
        />
    );
};
