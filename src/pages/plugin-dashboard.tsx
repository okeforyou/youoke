import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE = "http://127.0.0.1:5050";

export default function PluginDashboard() {
    const [activeTab, setActiveTab] = useState("jobs");
    const [serverOnline, setServerOnline] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [cache, setCache] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredJobs = jobs.filter((job: any) => {
        const title = (job.title || "").toLowerCase();
        const id = (job.video_id || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query) || id.includes(query);
    });

    const filteredCache = cache.filter((item: any) => {
        const title = (item.title || "").toLowerCase();
        const id = (item.video_id || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query) || id.includes(query);
    });

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
                {/* Left Sidebar */}
                <aside className="sidebar">
                    {/* Sidebar Header */}
                    <div className="logo-area">
                        <div className="logo-icon-wrapper">
                            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                        </div>
                        <div className="logo-text">
                            <h1>YouOke <span className="badge-ai">AI</span></h1>
                            <span className="subtitle">Vocal Studio</span>
                        </div>
                    </div>
                    
                    {/* Navigation Menu */}
                    <nav className="nav-menu">
                        <div className="nav-section-label">คิวงาน</div>
                        <button 
                            className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('jobs')}
                        >
                            <span className="nav-item-left">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                                <span>กำลังแยกเสียง</span>
                            </span>
                            <span className={`count-badge ${jobs.length > 0 ? 'count-badge-active' : 'count-badge-muted'}`}>
                                {jobs.length}
                            </span>
                        </button>
                        
                        <div className="nav-divider" />
                        <div className="nav-section-label">คลังเพลง</div>
                        <button 
                            className={`nav-item ${activeTab === 'cache' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cache')}
                        >
                            <span className="nav-item-left">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>แยกเสียงแล้ว</span>
                            </span>
                            <span className="count-badge count-badge-library">
                                {cache.length}
                            </span>
                        </button>
                    </nav>

                    {/* Sidebar Footer: shadcn Card Style */}
                    <div className="sidebar-footer">
                        <div className="stats-card">
                            <div className="stats-card-header">
                                <span className="stat-label">สถานะระบบ</span>
                                <div className={`status-badge ${serverOnline ? 'online' : 'offline'}`}>
                                    <span className="status-dot"></span>
                                    <span>{serverOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                </div>
                            </div>
                            <div className="stats-divider"></div>
                            <div className="stats-card-body">
                                <div className="stat-icon-group">
                                    <svg className="storage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                                    </svg>
                                    <span className="stat-body-label">คลังแคชในเครื่อง</span>
                                </div>
                                <span className="stat-val-highlight">{totalCacheSize} <small>MB</small></span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Content Area */}
                <main className="main-content">
                    <header className="content-header">
                        <h2>{activeTab === 'jobs' ? 'คิวการประมวลผลเสียงร้อง AI' : 'คลังไฟล์เพลงสำรองในเครื่อง'}</h2>
                        
                        <div className="header-actions">
                            <div className="search-box">
                                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อเพลง..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="clear-search" onClick={() => setSearchQuery("")}>&times;</button>
                                )}
                            </div>
                            
                            {activeTab === 'cache' && cache.length > 0 && (
                                <button className="btn btn-danger-outline" onClick={handleClearAllCache}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    ล้างแคชทั้งหมด
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="scroll-content">
                        {activeTab === 'jobs' && (
                            filteredJobs.length > 0 ? (
                                <div className="table-list">
                                    {filteredJobs.map((job: any) => {
                                        const percent = job.percent || 0;
                                        const isPaused = job.status === 'paused';
                                        const isQueued = job.status === 'queued';
                                        const isError = job.status === 'error';
                                        return (
                                            <div key={job.video_id} className={`table-row ${isError ? 'row-error' : ''}`}>
                                                <div className="row-music-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9 18V5l12-2v13"></path>
                                                        <circle cx="6" cy="18" r="3"></circle>
                                                        <circle cx="18" cy="16" r="3"></circle>
                                                    </svg>
                                                </div>
                                                <div className="col-info">
                                                    <div className="song-title" title={job.title || job.video_id}>{job.title || job.video_id}</div>
                                                    <div className="song-meta">
                                                        <span className={`badge ${job.mode === 'pro' ? 'badge-pro' : 'badge-basic'}`}>
                                                            {job.mode === 'pro' ? '4CH' : '2CH'}
                                                        </span>
                                                        <span className="meta-separator">•</span>
                                                        <span className="video-id">ID: {job.video_id}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-progress">
                                                    {isError ? (
                                                        <span className="error-message">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', display: 'inline-block', marginRight: '4px', verticalAlign: '-2px' }}>
                                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                            </svg>
                                                            {job.message || 'ดาวน์โหลดล้มเหลว'}
                                                        </span>
                                                    ) : (
                                                        <div className="progress-wrapper">
                                                            <div className="progress-text-row">
                                                                <span className="status-label">{getStatusText(job.status)}</span>
                                                                <span className="percent-label">{isQueued ? 'รอคิว' : `${percent}%`}</span>
                                                            </div>
                                                            <div className="mini-progress-bar">
                                                                <div className="fill" style={{ width: `${isQueued ? 5 : percent}%` }}></div>
                                                            </div>
                                                            {job.message && <div className="progress-subtext">{job.message}</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-actions">
                                                    {isError ? (
                                                        <button className="btn btn-action btn-success-light" title="ลองใหม่" onClick={() => handleResume(job.video_id)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        isPaused ? (
                                                            <button className="btn btn-action btn-success-light" title="ทำงานต่อ" onClick={() => handleResume(job.video_id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <button className="btn btn-action btn-warning-light" title="หยุดชั่วคราว" onClick={() => handlePause(job.video_id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                                                                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                                                                </svg>
                                                            </button>
                                                        )
                                                    )}
                                                    <button className="btn btn-action btn-danger-light" title={isError ? "ลบรายการ" : "ยกเลิกการทำงาน"} onClick={() => handleCancel(job.video_id, isError)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <p>{searchQuery ? 'ไม่พบเพลงที่ค้นหาในคิวนี้' : 'ไม่มีเพลงที่กำลังแยกเสียงในขณะนี้'}</p>
                                </div>
                            )
                        )}

                        {activeTab === 'cache' && (
                            filteredCache.length > 0 ? (
                                <div className="table-list">
                                    {filteredCache.map((item: any) => {
                                        const formattedDate = new Date(item.created_at * 1000).toLocaleDateString("th-TH", {
                                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                        });
                                        return (
                                            <div key={item.video_id} className="table-row">
                                                <div className="row-thumbnail">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`}
                                                        alt={item.title}
                                                        className="thumbnail-img"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('thumbnail-fallback-hidden');
                                                        }}
                                                    />
                                                    <div className="thumbnail-fallback thumbnail-fallback-hidden">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 18V5l12-2v13"></path>
                                                            <circle cx="6" cy="18" r="3"></circle>
                                                            <circle cx="18" cy="16" r="3"></circle>
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="col-info">
                                                    <div className="song-title" title={item.title}>{item.title}</div>
                                                    <div className="song-meta">
                                                        <span className={`badge ${item.mode === 'pro' ? 'badge-pro' : 'badge-basic'}`}>
                                                            {item.mode === 'pro' ? '4CH' : '2CH'}
                                                        </span>
                                                        <span className="meta-separator">•</span>
                                                        <span className="video-id">ID: {item.video_id}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-size">
                                                    <span className="size-text">{item.size_mb} MB</span>
                                                    <span className="date-text">{formattedDate}</span>
                                                </div>

                                                <div className="col-actions">
                                                    <button className="btn btn-action btn-danger-light" title="ลบไฟล์เพลงจากเครื่อง" onClick={() => handleDeleteCache(item.video_id)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                            <line x1="12" y1="11" x2="12" y2="17"></line>
                                            <line x1="9" y1="14" x2="15" y2="14"></line>
                                        </svg>
                                    </div>
                                    <p>{searchQuery ? 'ไม่พบเพลงที่ตรงกับคำค้นหาในคลัง' : 'ไม่มีไฟล์แคชเพลงในเครื่องของคุณ'}</p>
                                </div>
                            )
                        )}
                    </div>
                </main>
            </div>
            <style jsx>{`
                :root {
                    --bg-color: #ffffff;
                    --sidebar-bg: #f8fafc;
                    --border-color: #e2e8f0;
                    --primary: #f43f5e;
                    --primary-hover: #e11d48;
                    --primary-light: #fff1f2;
                    --text-primary: #0f172a;
                    --text-secondary: #475569;
                    --text-muted: #94a3b8;
                    --success: #10b981;
                    --success-light: #ecfdf5;
                    --warning: #f59e0b;
                    --warning-light: #fef3c7;
                    --danger: #ef4444;
                    --danger-hover: #dc2626;
                    --danger-light: #fff5f5;
                    --font-family: 'IBM Plex Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .dashboard-root {
                    background-color: var(--bg-color);
                    color: var(--text-primary);
                    font-family: var(--font-family);
                    height: 100vh;
                    min-width: 820px;
                    display: flex;
                    flex-direction: row;
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
                    background: rgba(0, 0, 0, 0.08);
                    border-radius: 99px;
                }
                .dashboard-root :global(::-webkit-scrollbar-thumb:hover) {
                    background: rgba(0, 0, 0, 0.16);
                }

                .sidebar {
                    width: 250px;
                    background-color: var(--sidebar-bg);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    padding: 16px 12px 14px 12px;
                    flex-shrink: 0;
                    user-select: none;
                }

                .logo-area {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 4px 6px 16px 6px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 14px;
                }

                .logo-icon-wrapper {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    background: #ffe4e6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 1px 2px rgba(225, 29, 72, 0.1);
                }

                .logo-icon {
                    width: 18px;
                    height: 18px;
                    color: var(--primary);
                }

                .logo-text h1 {
                    font-size: 15px;
                    font-weight: 800;
                    color: var(--text-primary);
                    letter-spacing: -0.02em;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    line-height: 1.2;
                }

                .badge-ai {
                    background: linear-gradient(135deg, #f43f5e, #e11d48);
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 1px 5px;
                    border-radius: 5px;
                    letter-spacing: 0.04em;
                }

                .logo-text .subtitle {
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--text-muted);
                    letter-spacing: 0.01em;
                }

                .nav-menu {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    flex: 1;
                }

                .nav-section-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    padding: 10px 8px 4px;
                }

                .nav-divider {
                    height: 1px;
                    background-color: var(--border-color);
                    margin: 8px 4px;
                    opacity: 0.6;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    font-size: 13px;
                    font-family: inherit;
                    width: 100%;
                }

                .nav-item-left {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                }

                .nav-icon {
                    width: 16px;
                    height: 16px;
                    opacity: 0.65;
                    transition: all 0.15s ease;
                }

                .nav-item:hover {
                    background-color: #f1f5f9;
                    color: var(--text-primary);
                }

                .nav-item:hover .nav-icon {
                    opacity: 0.9;
                }

                .nav-item.active {
                    background-color: #ffffff;
                    color: var(--text-primary);
                    font-weight: 600;
                    border-color: #e2e8f0;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
                }

                .nav-item.active .nav-icon {
                    color: var(--primary);
                    opacity: 1;
                }

                .count-badge {
                    font-size: 11px;
                    font-weight: 700;
                    padding: 1px 8px;
                    border-radius: 99px;
                    min-width: 22px;
                    text-align: center;
                    line-height: 1.4;
                    transition: all 0.2s ease;
                }

                .count-badge-active {
                    background-color: var(--primary);
                    color: #ffffff;
                    box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
                    animation: badge-pulse 2s infinite ease-in-out;
                }

                .count-badge-muted {
                    background-color: #e2e8f0;
                    color: #64748b;
                }

                .count-badge-library {
                    background-color: #e2e8f0;
                    color: #0f172a;
                    border: 1px solid rgba(0, 0, 0, 0.04);
                }

                .nav-item.active .count-badge-library {
                    background-color: #0f172a;
                    color: #ffffff;
                }

                @keyframes badge-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.06); }
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 12px;
                }

                .stats-card {
                    background-color: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
                }

                .stats-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .stat-label {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-muted);
                }

                .status-badge {
                    font-size: 9px;
                    padding: 2px 7px;
                    border-radius: 99px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    letter-spacing: 0.06em;
                    line-height: 1.3;
                }

                .status-badge.online {
                    background-color: var(--success-light);
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }

                .status-badge.offline {
                    background-color: var(--danger-light);
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: currentColor;
                }

                .status-badge.online .status-dot {
                    animation: pulse-dot 2s infinite;
                }

                .stats-divider {
                    height: 1px;
                    background-color: #f1f5f9;
                    margin: 0;
                }

                .stats-card-body {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .stat-icon-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .storage-icon {
                    width: 14px;
                    height: 14px;
                    color: var(--text-muted);
                }

                .stat-body-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .stat-val-highlight {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-val-highlight small {
                    font-size: 10px;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-left: 2px;
                }

                @keyframes pulse-dot {
                    0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    background-color: var(--bg-color);
                }

                .content-header {
                    height: 56px;
                    border-bottom: 1px solid var(--border-color);
                    background-color: #ffffff;
                    padding: 0 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .content-header h2 {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .search-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-icon {
                    position: absolute;
                    left: 10px;
                    width: 14px;
                    height: 14px;
                    color: var(--text-muted);
                    pointer-events: none;
                }

                .search-box input {
                    width: 200px;
                    padding: 6px 30px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 12px;
                    background-color: #f8fafc;
                    color: var(--text-primary);
                    font-family: inherit;
                    transition: all 0.15s ease;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: var(--primary);
                    background-color: #ffffff;
                    box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.1);
                }

                .clear-search {
                    position: absolute;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 14px;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .clear-search:hover {
                    color: var(--text-primary);
                }

                .scroll-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                .table-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .table-row {
                    background-color: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.15s ease;
                }

                .table-row:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .row-error {
                    border-color: #fca5a5;
                    background-color: #fffafb;
                }

                .row-error:hover {
                    border-color: #ef4444;
                }

                .row-music-icon {
                    width: 44px;
                    height: 44px;
                    background-color: #f1f5f9;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    flex-shrink: 0;
                }

                .row-music-icon svg {
                    width: 16px;
                    height: 16px;
                }

                .row-music-icon.icon-cached {
                    background-color: var(--primary-light);
                    color: var(--primary);
                }

                .row-thumbnail {
                    width: 58px;
                    height: 44px;
                    border-radius: 6px;
                    overflow: hidden;
                    flex-shrink: 0;
                    background-color: #f1f5f9;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .thumbnail-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .thumbnail-fallback {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--primary-light);
                    color: var(--primary);
                }

                .thumbnail-fallback svg {
                    width: 18px;
                    height: 18px;
                }

                .thumbnail-fallback-hidden {
                    display: none;
                }

                .col-info {
                    flex: 1;
                    min-width: 0;
                }

                .song-title {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 13px;
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .song-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 2px;
                }

                .meta-separator {
                    color: var(--text-muted);
                    font-size: 10px;
                }

                .video-id {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .col-size {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    justify-content: center;
                    width: 140px;
                    flex-shrink: 0;
                }

                .size-text {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-secondary);
                }

                .date-text {
                    font-size: 10px;
                    color: var(--text-muted);
                    margin-top: 1px;
                }

                .col-progress {
                    width: 180px;
                    flex-shrink: 0;
                    margin-right: 8px;
                }

                .progress-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .progress-text-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .percent-label {
                    font-weight: 700;
                    color: var(--primary);
                }

                .mini-progress-bar {
                    width: 100%;
                    height: 4px;
                    background-color: #f1f5f9;
                    border-radius: 99px;
                    overflow: hidden;
                }

                .mini-progress-bar .fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary) 0%, #fb7185 100%);
                    border-radius: 99px;
                    transition: width 0.3s ease;
                }

                .progress-subtext {
                    font-size: 10px;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .error-message {
                    font-size: 11px;
                    color: var(--danger);
                    font-weight: 600;
                }

                .col-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .btn {
                    background: none;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-family: inherit;
                }

                .btn-danger-outline {
                    border: 1px solid var(--border-color);
                    color: var(--danger);
                    background-color: #ffffff;
                    padding: 6px 12px;
                    font-size: 12px;
                }

                .btn-danger-outline:hover {
                    background-color: var(--danger-light);
                    border-color: #fca5a5;
                }

                .btn-action {
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    justify-content: center;
                    border-radius: 6px;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                    background-color: #ffffff;
                }

                .btn-action svg {
                    width: 14px;
                    height: 14px;
                }

                .btn-action:hover {
                    color: var(--text-primary);
                    background-color: #f1f5f9;
                }

                .btn-success-light {
                    color: var(--success);
                }
                .btn-success-light:hover {
                    background-color: var(--success-light);
                    border-color: #a7f3d0;
                    color: var(--success);
                }

                .btn-warning-light {
                    color: var(--warning);
                }
                .btn-warning-light:hover {
                    background-color: var(--warning-light);
                    border-color: #fde68a;
                    color: var(--warning);
                }

                .btn-danger-light {
                    color: var(--danger);
                }
                .btn-danger-light:hover {
                    background-color: var(--danger-light);
                    border-color: #fca5a5;
                    color: var(--danger);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 80px 20px;
                    color: var(--text-muted);
                    text-align: center;
                }

                .empty-icon {
                    width: 48px;
                    height: 48px;
                    color: var(--text-muted);
                    opacity: 0.5;
                    animation: float-icon 3s ease-in-out infinite;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }

                @keyframes float-icon {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                    100% { transform: translateY(0); }
                }

                .badge {
                    font-size: 9px;
                    padding: 1px 5px;
                    border-radius: 4px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    display: inline-flex;
                    align-items: center;
                }

                .badge-pro {
                    background-color: #ffedd5;
                    color: #ea580c;
                    border: 1px solid #fed7aa;
                }

                .badge-basic {
                    background-color: #e0f2fe;
                    color: #0369a1;
                    border: 1px solid #bae6fd;
                }
            `}</style>
        </>
    );
}
