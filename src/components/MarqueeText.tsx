import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
    text: string;
    className?: string;
    speed?: number; // seconds for one cycle
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
    text,
    className = "",
    speed = 20
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const textWidth = textRef.current.offsetWidth;
                setIsOverflowing(textWidth > containerWidth);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    if (!isOverflowing) {
        return (
            <div ref={containerRef} className={`truncate ${className} relative overflow-hidden`}>
                <span ref={textRef}>{text}</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className} group`}>
            {/* Wrapper for the moving part */}
            <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused] w-max">
                <span ref={textRef} className="mr-8">{text}</span>
                <span className="mr-8">{text}</span>
                <span className="mr-8">{text}</span> {/* Extra copy for safety on wide screens */}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); } /* Move 1/3 since we have 3 copies */
                }
                .animate-marquee {
                    animation: marquee ${speed}s linear infinite;
                }
            `}</style>
        </div>
    );
};
