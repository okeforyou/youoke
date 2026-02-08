import { ApexOptions } from 'apexcharts';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartTwoProps {
    series: {
        name: string;
        data: number[];
    }[];
    categories: string[];
    title: string;
    subtitle?: string;
}

const ChartTwo: React.FC<ChartTwoProps> = ({ series, categories, title, subtitle }) => {
    const options: ApexOptions = useMemo(() => ({
        colors: ['#3C50E0', '#80CAEE'],
        chart: {
            fontFamily: 'Satoshi, sans-serif',
            type: 'bar',
            height: 335,
            stacked: true,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        responsive: [
            {
                breakpoint: 1536,
                options: {
                    plotOptions: {
                        bar: {
                            borderRadius: 0,
                            columnWidth: '25%',
                        },
                    },
                },
            },
        ],
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 0,
                columnWidth: '25%',
                borderRadiusApplication: 'end',
                borderRadiusWhenStacked: 'last',
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: categories,
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontFamily: 'Satoshi',
            fontWeight: 500,
            fontSize: '14px',
            markers: {
                shape: 'circle',
            },
        },
        fill: {
            opacity: 1,
        },
        tooltip: {
            theme: 'dark'
        }
    }), [categories]);

    return (
        <div className="col-span-12 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 pt-7.5 pb-5 shadow-xl sm:px-7.5 xl:col-span-4 relative overflow-hidden group">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="mb-4 justify-between gap-4 sm:flex relative z-10">
                <div>
                    <h4 className="text-xl font-semibold text-white drop-shadow-sm">{title}</h4>
                    {subtitle && <p className="text-sm font-medium text-gray-400">{subtitle}</p>}
                </div>
            </div>

            <div className="relative z-10">
                <div id="chartTwo" className="-ml-5 -mb-9">
                    {typeof window !== 'undefined' && (
                        <ReactApexChart
                            options={options}
                            series={series}
                            type="bar"
                            height={350}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartTwo;
