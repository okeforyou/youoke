import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE = "http://127.0.0.1:5050";

export default function PluginDashboard() {
    const [activeTab, setActiveTab] = useState("jobs");
    const [serverOnline, setServerOnline] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [cache, setCache] = useState([]);

    const checkServerStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/`);
            if (res.ok || res.status === 404) {
                setServerOnline(true);
                return true;
            }
        } catch (e) {
            setServerOnline(false);
        }
        return false;
    };

    const fetchJobs = async () => {
        if (!serverOnline && !(await checkServerStatus())) return;
        try {
            const res = await fetch(`${API_BASE}/jobs`);
            if (!res.ok) throw new Error("Failed to load jobs");
            const data = await res.json();
            const activeJobs = data.filter((j: any) => 
                ['queued', 'starting', 'downloading', 'converting', 'separating', 'compressing', 'paused', 'error'].includes(j.status)
            );
            setJobs(activeJobs);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCache = async () => {
        if (!serverOnline && !(await checkServerStatus())) return;
        try {
            const res = await fetch(`${API_BASE}/cache/list`);
            if (!res.ok) throw new Error("Failed to load cache");
            const data = await res.json();
            if (data.status === "success") {
                setCache(data.results || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const init = async () => {
            await checkServerStatus();
            fetchJobs();
            if (activeTab === "cache") fetchCache();
        };
        init();

        const interval = setInterval(() => {
            if (activeTab === "jobs") fetchJobs();
            else fetchCache();
        }, 2000);

        return () => clearInterval(interval);
    }, [activeTab, serverOnline]);

    const handlePause = async (videoId: string) => {
        try {
            const res = await fetch(`${API_BASE}/pause/${videoId}`, { method: "POST" });
            const data = await res.json();
            if (data.status === "success") fetchJobs();
        } catch (e) {
            console.error(e);
        }
    };

    const handleResume = async (videoId: string) => {
        try {
            const res = await fetch(`${API_BASE}/resume/${videoId}`, { method: "POST" });
            const data = await res.json();
            if (data.status === "success") fetchJobs();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancel = async (videoId: string, isError: boolean) => {
        const confirmMsg = isError 
            ? "คุณต้องการลบรายการข้อผิดพลาดนี้ใช่หรือไม่?"
            : "คุณต้องการยกเลิกการแยกเสียงเพลงนี้ใช่หรือไม่?";
        if (!window.confirm(confirmMsg)) return;
        
        try {
            const res = await fetch(`${API_BASE}/cancel/${videoId}`, { method: "POST" });
            const data = await res.json();
            if (data.status === "success") {
                fetchJobs();
            } else {
                alert("ยกเลิกงานไม่สำเร็จ: " + data.message);
            }
        } catch (e) {
            alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อยกเลิกได้");
        }
    };

    const handleDeleteCache = async (videoId: string) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแคชของเพลงนี้?")) return;
        try {
            const res = await fetch(`${API_BASE}/cache/${videoId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.status === "success") fetchCache();
            else alert("ลบไฟล์ไม่สำเร็จ: " + data.message);
        } catch (e) {
            alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบได้");
        }
    };

    const handleClearAllCache = async () => {
        if (!window.confirm("🚨 คำเตือน! คุณต้องการลบแคชเพลงที่แยกเสร็จแล้วทั้งหมดใช่หรือไม่? (เพลงจะหายไปจากเครื่อง ต้องกดแยกเสียงใหม่ในการเล่นครั้งถัดไป)")) return;
        try {
            const res = await fetch(`${API_BASE}/cache/list`);
            const data = await res.json();
            if (data.status === "success") {
                const results = data.results || [];
                let successCount = 0;
                for (const item of results) {
                    const delRes = await fetch(`${API_BASE}/cache/${item.video_id}`, { method: "DELETE" });
                    const delData = await delRes.json();
                    if (delData.status === "success") successCount++;
                }
                alert(`ล้างแคชเรียบร้อยแล้ว ลบสำเร็จทั้งหมด ${successCount} เพลง`);
                fetchCache();
            }
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการล้างแคชทั้งหมด");
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "queued": return "รอคิวประมวลผล...";
            case "starting": return "กำลังเตรียมการ...";
            case "downloading": return "กำลังดาวน์โหลด...";
            case "converting": return "กำลังแปลงไฟล์...";
            case "separating": return "กำลังแยกเสียงร้อง/ดนตรี...";
            case "compressing": return "กำลังบีบอัดไฟล์...";
            case "paused": return "หยุดชั่วคราว";
            case "error": return "ล้มเหลว";
            default: return status;
        }
    };

    const totalCacheSize = cache.reduce((sum, item: any) => sum + (item.size_mb || 0), 0).toFixed(2);

    return (
        <>
            <Head>
                <title>YouOke AI Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            <div className="dashboard-root">
                <header>
                    <div className="logo-area">
                        <h1>YouOke AI <span>Dashboard</span></h1>
                    </div>
                    <div className={`status-badge ${serverOnline ? 'online' : ''}`}>
                        <span className="status-dot"></span>
                        <span>{serverOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                </header>

                <nav>
                    <button 
                        className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        กำลังแยกเสียง ({jobs.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'cache' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cache')}
                    >
                        แคชข้อมูล ({cache.length})
                    </button>
                </nav>

                <main>
                    {activeTab === 'jobs' && (
                        <div className="tab-content active">
                            {jobs.length > 0 ? (
                                <div className="list-container">
                                    {jobs.map((job: any) => {
                                        const percent = job.percent || 0;
                                        const isPaused = job.status === 'paused';
                                        const isQueued = job.status === 'queued';
                                        const isError = job.status === 'error';
                                        return (
                                            <div key={job.video_id} className="job-card" style={isError ? { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.03)' } : {}}>
                                                <div className="card-header">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="card-title" title={job.title || job.video_id}>{job.title || job.video_id}</div>
                                                        <div className="card-subtitle">
                                                            <span className={`badge ${job.mode === 'pro' ? 'badge-pro' : 'badge-basic'}`}>
                                                                {job.mode === 'pro' ? '4CH' : '2CH'}
                                                            </span>
                                                            &nbsp;|&nbsp;ID: {job.video_id}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        {isError ? (
                                                            <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => handleResume(job.video_id)}>ลองใหม่</button>
                                                        ) : (
                                                            isPaused ? (
                                                                <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => handleResume(job.video_id)}>ทํางานต่อ</button>
                                                            ) : (
                                                                <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }} onClick={() => handlePause(job.video_id)}>หยุดพัก</button>
                                                            )
                                                        )}
                                                        <button className="btn btn-danger" onClick={() => handleCancel(job.video_id, isError)}>
                                                            {isError ? 'ลบออก' : 'ยกเลิก'}
                                                        </button>
                                                    </div>
                                                </div>
                                                {isError ? (
                                                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span>⚠️ {job.message || 'ดาวน์โหลดล้มเหลว'}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="progress-bar-container">
                                                            <div className="progress-bar" style={{ width: `${isQueued ? 5 : percent}%` }}></div>
                                                        </div>
                                                        <div className="job-status-row">
                                                            <span>สถานะ: {getStatusText(job.status)}</span>
                                                            <span>{isQueued ? 'ต่อคิว' : `${percent}%`}</span>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#a5a6a7', marginTop: '-2px' }}>
                                                            {job.message || ''}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">⏳</div>
                                    <p>ไม่มีเพลงที่กำลังแยกเสียงในขณะนี้</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'cache' && (
                        <div className="tab-content active">
                            {cache.length > 0 ? (
                                <div className="list-container">
                                    {cache.map((item: any) => {
                                        const formattedDate = new Date(item.created_at * 1000).toLocaleDateString("th-TH", {
                                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                        });
                                        return (
                                            <div key={item.video_id} className="cache-card">
                                                <div className="card-header">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="card-title" title={item.title}>{item.title}</div>
                                                        <div className="card-subtitle">
                                                            <span className={`badge ${item.mode === 'pro' ? 'badge-pro' : 'badge-basic'}`}>
                                                                {item.mode === 'pro' ? '4CH' : '2CH'}
                                                            </span>
                                                            &nbsp;|&nbsp;ID: {item.video_id}&nbsp;|&nbsp;{formattedDate}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-white)' }}>{item.size_mb} MB</span>
                                                        <button className="btn btn-danger" onClick={() => handleDeleteCache(item.video_id)}>ลบ</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📁</div>
                                    <p>ไม่มีไฟล์แคชเพลงในเครื่องของคุณ</p>
                                </div>
                            )}
                            <div className="footer-actions">
                                <div className="cache-info">ขนาดแคชทั้งหมด: <span>{totalCacheSize}</span> MB</div>
                                <button className="btn btn-danger" onClick={handleClearAllCache}>ล้างแคชทั้งหมด</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <style jsx>{`
                :root {
                    --bg-color: #09090b;
                    --panel-bg: #18181b;
                    --panel-hover-bg: #27272a;
                    --primary: #ef4444;
                    --primary-hover: #dc2626;
                    --text-color: #a1a1aa;
                    --text-white: #f4f4f5;
                    --text-muted: #71717a;
                    --border-color: #27272a;
                    --danger: #ef4444;
                    --danger-hover: #dc2626;
                    --success: #10b981;
                    --font-family: 'IBM Plex Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                @media (prefers-color-scheme: light) {
                    :root {
                        --bg-color: #f4f4f5;
                        --panel-bg: #ffffff;
                        --panel-hover-bg: #fafafa;
                        --primary: #ef4444;
                        --primary-hover: #dc2626;
                        --text-color: #52525b;
                        --text-white: #09090b;
                        --text-muted: #a1a1aa;
                        --border-color: #e4e4e7;
                    }
                }

                .dashboard-root {
                    background-color: var(--bg-color, #09090b);
                    color: var(--text-color, #a1a1aa);
                    font-family: 'IBM Plex Sans Thai', 'Inter', sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-size: 13px;
                    letter-spacing: -0.01em;
                }

                .dashboard-root :global(*) {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .dashboard-root :global(::-webkit-scrollbar) {
                    width: 5px;
                    height: 5px;
                }
                .dashboard-root :global(::-webkit-scrollbar-track) {
                    background: transparent;
                }
                .dashboard-root :global(::-webkit-scrollbar-thumb) {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 99px;
                }
                .dashboard-root :global(::-webkit-scrollbar-thumb:hover) {
                    background: rgba(255, 255, 255, 0.2);
                }

                header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color, #27272a);
                    background: linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, rgba(9, 9, 11, 0) 100%), var(--bg-color, #09090b);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }

                .logo-area { display: flex; align-items: center; gap: 10px; }
                .logo-area h1 { font-size: 15px; font-weight: 800; color: var(--text-white, #f4f4f5); letter-spacing: -0.02em; text-transform: uppercase; }
                .logo-area span { color: var(--primary, #ef4444); font-weight: 400; text-transform: none; margin-left: 2px; opacity: 0.95; }

                .status-badge {
                    font-size: 10px; padding: 4px 10px; border-radius: 9999px; font-weight: 700;
                    display: flex; align-items: center; gap: 6px;
                    background-color: rgba(82, 82, 91, 0.1); color: #71717a; border: 1px solid rgba(82, 82, 91, 0.15);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 0.05em;
                }
                .status-badge.online { background-color: rgba(16, 185, 129, 0.1); color: var(--success, #10b981); border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; background-color: currentColor; display: inline-block; }
                .status-badge.online .status-dot { animation: pulse-dot 2s infinite; }

                @keyframes pulse-dot {
                    0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                nav { display: flex; border-bottom: 1px solid var(--border-color, #27272a); background-color: var(--bg-color, #09090b); flex-shrink: 0; padding: 0 10px; }
                .tab-btn {
                    flex: 1; padding: 14px 10px; background: none; border: none; color: var(--text-color, #a1a1aa);
                    font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center; font-size: 13px; position: relative; opacity: 0.7; font-family: inherit;
                }
                .tab-btn::after {
                    content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
                    width: 0; height: 2px; background-color: var(--primary, #ef4444); transition: width 0.2s ease;
                }
                .tab-btn:hover, .tab-btn.active { color: var(--text-white, #f4f4f5); opacity: 1; }
                .tab-btn.active::after { width: 40px; }

                main { flex: 1; position: relative; overflow: hidden; }
                .tab-content {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    display: none; flex-direction: column; padding: 16px; overflow-y: auto;
                }
                .tab-content.active { display: flex; }

                .list-container { display: flex; flex-direction: column; gap: 12px; }
                .job-card, .cache-card {
                    background-color: var(--panel-bg, #18181b); border: 1px solid var(--border-color, #27272a);
                    border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .job-card:hover, .cache-card:hover {
                    border-color: rgba(239, 68, 68, 0.25); background-color: var(--panel-hover-bg, #27272a);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
                .card-title {
                    font-weight: 600; color: var(--text-white, #f4f4f5); font-size: 13px; line-height: 1.4;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .card-subtitle { font-size: 11px; color: var(--text-color, #a1a1aa); opacity: 0.65; margin-top: 4px; display: flex; align-items: center; gap: 6px; }

                .btn {
                    background: none; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 4px;
                    border: 1px solid transparent; font-family: inherit; min-width: 68px; justify-content: center;
                }
                .btn-danger { background-color: rgba(239, 68, 68, 0.1); color: var(--danger, #ef4444); border: 1px solid rgba(239, 68, 68, 0.15); }
                .btn-danger:hover { background-color: var(--danger, #ef4444); color: #ffffff; border-color: var(--danger, #ef4444); transform: translateY(-1px); }
                .btn-danger:active { transform: translateY(0); }
                .btn-secondary:hover { transform: translateY(-1px); }

                .progress-bar-container { width: 100%; height: 4px; background-color: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; margin-top: 4px; }
                .progress-bar { height: 100%; background: linear-gradient(90deg, var(--primary, #ef4444) 0%, #f43f5e 100%); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 99px; }

                .job-status-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-color, #a1a1aa); opacity: 0.8; font-weight: 500; }

                .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; color: var(--text-muted, #71717a); text-align: center; padding: 60px 20px; }
                .empty-icon { font-size: 36px; margin-bottom: 2px; opacity: 0.35; animation: float-icon 3s ease-in-out infinite; }
                @keyframes float-icon { 0% { transform: translateY(0); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0); } }

                .footer-actions { margin-top: 15px; padding: 14px 4px 4px 4px; border-top: 1px solid var(--border-color, #27272a); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
                .cache-info { font-size: 11px; color: var(--text-color, #a1a1aa); opacity: 0.7; font-weight: 500; }
                .cache-info span { color: var(--text-white, #f4f4f5); font-weight: 700; }

                .badge { font-size: 9px; padding: 2px 6px; border-radius: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; }
                .badge-pro { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.15); }
                .badge-basic { background-color: rgba(113, 113, 122, 0.1); color: #a1a1aa; border: 1px solid rgba(113, 113, 122, 0.15); }
            `}</style>
        </>
    );
}
