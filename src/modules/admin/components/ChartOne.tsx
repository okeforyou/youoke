import { ApexOptions } from 'apexcharts';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartOneProps {
    series: {
        name: string;
        data: number[];
    }[];
    categories: string[];
    title: string;
    subtitle?: string;
    primaryColor?: string;
}

const ChartOne: React.FC<ChartOneProps> = ({ series, categories, title, subtitle }) => {
    const options: ApexOptions = useMemo(() => ({
        legend: {
            show: false,
            position: 'top',
            horizontalAlign: 'left',
        },
        colors: ['#3C50E0', '#80CAEE'],
        chart: {
            fontFamily: 'Satoshi, sans-serif',
            height: 335,
            type: 'area',
            dropShadow: {
                enabled: true,
                color: '#623CEA14',
                top: 10,
                blur: 4,
                left: 0,
                opacity: 0.1,
            },
            toolbar: {
                show: false,
            },
        },
        responsive: [
            {
                breakpoint: 1024,
                options: {
                    chart: {
                        height: 300,
                    },
                },
            },
            {
                breakpoint: 1366,
                options: {
                    chart: {
                        height: 350,
                    },
                },
            },
        ],
        stroke: {
            width: [2, 2],
            curve: 'smooth',
        },
        grid: {
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        markers: {
            size: 4,
            colors: '#fff',
            strokeColors: ['#3056D3', '#80CAEE'],
            strokeWidth: 3,
            strokeOpacity: 0.9,
            strokeDashArray: 0,
            fillOpacity: 1,
            discrete: [],
            hover: {
                size: undefined,
                sizeOffset: 5,
            },
        },
        xaxis: {
            type: 'category',
            categories: categories,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            title: {
                style: {
                    fontSize: '0px',
                },
            },
            labels: {
                formatter: (value) => {
                    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
                }
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (val) {
                    return "฿ " + val.toLocaleString();
                }
            }
        }
    }), [categories]);

    // Calculate total for display
    const totalValue = useMemo(() => {
        if (!series || series.length === 0) return 0;
        return series[0].data.reduce((a, b) => a + b, 0);
    }, [series]);

    return (
        <div className="col-span-12 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 pt-7.5 pb-5 shadow-xl sm:px-7.5 xl:col-span-8 relative overflow-hidden group">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap relative z-10 mb-2">
                <div className="flex w-full flex-wrap gap-3 sm:gap-5">
                    <div className="w-full">
                        <p className="font-semibold text-primary drop-shadow-sm text-xl">{title}</p>
                        {subtitle && <p className="text-sm font-medium text-gray-400">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex w-full max-w-45 justify-end">
                    <div className="inline-flex items-center rounded-lg bg-black/20 p-1 border border-white/10">
                        <span className="text-xs font-bold text-white px-3 py-1 bg-white/10 rounded shadow-sm">
                            Total: ฿{totalValue.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <div id="chartOne" className="-ml-5">
                    {typeof window !== 'undefined' && (
                        <ReactApexChart
                            options={options}
                            series={series}
                            type="area"
                            height={350}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartOne;
