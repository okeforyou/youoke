import React, { ReactNode } from 'react';

interface CardDataStatsProps {
    title: string;
    total: string;
    rate?: string;
    levelUp?: boolean;
    levelDown?: boolean;
    children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
    title,
    total,
    rate,
    levelUp,
    levelDown,
    children,
}) => {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md py-6 px-7.5 shadow-xl group hover:bg-white/10 transition-colors duration-300 relative overflow-hidden">
            {/* Glow Effect on Hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>

            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 shadow-lg relative z-10">
                {children}
            </div>

            <div className="mt-4 flex items-end justify-between relative z-10">
                <div>
                    <h4 className="text-xl font-bold text-white drop-shadow-sm">
                        {total}
                    </h4>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</span>
                </div>

                {rate && (
                    <span
                        className={`flex items-center gap-1 text-sm font-bold ${levelUp ? 'text-success drop-shadow-[0_0_5px_rgba(33,150,83,0.5)]' : ''
                            } ${levelDown ? 'text-error drop-shadow-[0_0_5px_rgba(211,64,83,0.5)]' : ''} `}
                    >
                        {rate}

                        {levelUp && (
                            <svg
                                className="fill-success"
                                width="10"
                                height="11"
                                viewBox="0 0 10 11"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.35716 2.47737L0.908974 5.82987L5.0443e-07 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737L5.64284 10.0849L4.35716 10.0849L4.35716 2.47737Z"
                                    fill=""
                                />
                            </svg>
                        )}

                        {levelDown && (
                            <svg
                                className="fill-error"
                                width="10"
                                height="11"
                                viewBox="0 0 10 11"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5.64284 7.69236L9.09102 4.33986L10 5.22361L5 10.0849L-8.98485e-07 5.22361L0.908973 4.33986L4.35716 7.69236L4.35716 0.0848683L5.64284 0.0848683L5.64284 7.69236Z"
                                    fill=""
                                />
                            </svg>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CardDataStats;
