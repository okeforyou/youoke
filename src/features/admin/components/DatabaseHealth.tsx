import React, { useState, useEffect } from 'react';
import {
    TrashIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useAuth } from '../../../context/AuthContext';

interface HealthStats {
    totalUsers: number;
    anonymousUsers: number;
    cleanable7Days: number;
    cleanable3Days: number;
}

export const DatabaseHealth: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<HealthStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [cleanupResult, setCleanupResult] = useState<{ count: number, days: number } | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/admin/system-health', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch system health:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const handleCleanup = async (days: number) => {
        if (!confirm(`ยืนยันการลบข้อมูล Anonymous ที่ไม่ได้ใช้งานเกิน ${days} วัน?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        setCleaning(true);
        setCleanupResult(null);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/admin/system-health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ days })
            });

            if (res.ok) {
                const data = await res.json();
                setCleanupResult({ count: data.deletedCount, days: data.thresholdDays });
                fetchStats(); // Refresh stats
            } else {
                alert("Cleanup failed. Check console.");
            }
        } catch (err) {
            console.error("Cleanup error:", err);
            alert("Error executing cleanup");
        } finally {
            setCleaning(false);
        }
    };

    if (!stats && loading) return <div className="p-4 rounded-lg border border-gray-100 bg-white animate-pulse h-48"></div>;

    // Determine Health Status
    const anonymousRatio = stats ? (stats.anonymousUsers / stats.totalUsers) : 0;
    const healthStatus = anonymousRatio > 0.5 ? 'warning' : 'healthy';

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                        Database Health
                    </h3>
                    <p className="text-xs text-gray-500">จัดการข้อมูลขยะและประสิทธิภาพ</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading || cleaning}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {cleanupResult && (
                <div
                    className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 animate-pulse"
                >
                    <CheckCircleIcon className="w-6 h-6 shrink-0" />
                    <div>
                        <div className="font-bold">Cleanup Successful!</div>
                        <div className="text-sm">ลบผู้ใช้ไป {cleanupResult.count.toLocaleString()} คน (เกณฑ์ {cleanupResult.days} วัน)</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Status Card */}
                <div className={`p-4 rounded-xl border ${healthStatus === 'healthy' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {healthStatus === 'healthy' ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />}
                        <span className={`font-bold ${healthStatus === 'healthy' ? 'text-green-700' : 'text-orange-700'}`}>
                            {healthStatus === 'healthy' ? 'Good Condition' : 'Needs Attention'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {stats?.anonymousUsers.toLocaleString()} <span className="text-sm font-normal text-gray-500">Anonymous</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        จากทั้งหมด {stats?.totalUsers.toLocaleString()} Users ({Math.round(anonymousRatio * 100)}%)
                    </div>
                </div>

                {/* Action: 7 Days */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Old Junk (&gt; 7 Days)</div>
                        <div className="text-2xl font-bold text-gray-900">{stats?.cleanable7Days.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => handleCleanup(7)}
                        disabled={cleaning || (stats?.cleanable7Days || 0) === 0}
                        className="mt-3 w-full py-2 px-3 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Cleanup (7d)
                    </button>
                </div>

                {/* Action: 3 Days */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Recent Junk (&gt; 3 Days)</div>
                        <div className="text-2xl font-bold text-gray-900">{stats?.cleanable3Days.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => handleCleanup(3)}
                        disabled={cleaning || (stats?.cleanable3Days || 0) === 0}
                        className="mt-3 w-full py-2 px-3 bg-white border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Cleanup (3d)
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <div className="absolute bottom-3 right-4 text-[10px] text-gray-400">
                    Updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};
