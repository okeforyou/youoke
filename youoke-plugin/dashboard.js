const API_BASE = "http://127.0.0.1:5050";
let activeTab = "jobs"; // "jobs" or "cache"
let serverOnline = false;
let updateInterval = null;

// DOM Elements
const connectionStatus = document.getElementById("connection-status");
const statusText = document.getElementById("status-text");
const tabJobs = document.getElementById("tab-jobs");
const tabCache = document.getElementById("tab-cache");
const contentJobs = document.getElementById("content-jobs");
const contentCache = document.getElementById("content-cache");
const jobsList = document.getElementById("jobs-list");
const jobsEmpty = document.getElementById("jobs-empty");
const cacheList = document.getElementById("cache-list");
const cacheEmpty = document.getElementById("cache-empty");
const jobsCount = document.getElementById("jobs-count");
const cacheCount = document.getElementById("cache-count");
const totalCacheSize = document.getElementById("total-cache-size");
const clearAllCacheBtn = document.getElementById("clear-all-cache-btn");

// Init listeners
tabJobs.addEventListener("click", () => switchTab("jobs"));
tabCache.addEventListener("click", () => switchTab("cache"));
clearAllCacheBtn.addEventListener("click", clearAllCache);

function switchTab(tab) {
    activeTab = tab;
    if (tab === "jobs") {
        tabJobs.classList.add("active");
        tabCache.classList.remove("active");
        contentJobs.classList.add("active");
        contentCache.classList.remove("active");
    } else {
        tabCache.classList.add("active");
        tabJobs.classList.remove("active");
        contentCache.classList.add("active");
        contentJobs.classList.remove("active");
        fetchCache();
    }
}

// Check if Python Server is alive
async function checkServerStatus() {
    try {
        const res = await fetch(`${API_BASE}/`);
        if (res.ok || res.status === 404) { // Fastapi root might return 404 but it's alive
            setServerOnline(true);
            return true;
        }
    } catch (e) {
        setServerOnline(false);
    }
    return false;
}

function setServerOnline(online) {
    serverOnline = online;
    if (online) {
        connectionStatus.className = "status-badge online";
        statusText.innerText = "ONLINE";
    } else {
        connectionStatus.className = "status-badge";
        statusText.innerText = "OFFLINE";
    }
}

// Fetch active jobs from Server
async function fetchJobs() {
    if (!serverOnline && !(await checkServerStatus())) return;

    try {
        const res = await fetch(`${API_BASE}/jobs`);
        if (!res.ok) throw new Error("Failed to load jobs");
        const jobs = await res.json();
        
        // Filter jobs that are currently active or queued/paused/error
        const activeJobs = jobs.filter(j => ['queued', 'starting', 'downloading', 'converting', 'separating', 'compressing', 'paused', 'error'].includes(j.status));
        jobsCount.innerText = activeJobs.length;
        
        renderJobs(activeJobs);
    } catch (e) {
        console.error(e);
    }
}

// Render active jobs list
function renderJobs(jobs) {
    if (jobs.length === 0) {
        jobsList.style.display = "none";
        jobsEmpty.style.display = "flex";
        return;
    }

    jobsList.style.display = "flex";
    jobsEmpty.style.display = "none";

    jobsList.innerHTML = jobs.map(job => {
        const percent = job.percent || 0;
        const isPaused = job.status === 'paused';
        const isQueued = job.status === 'queued';
        const isError = job.status === 'error';
        
        return `
            <div class="job-card" data-id="${job.video_id}" style="${isError ? 'border-color: rgba(239, 68, 68, 0.4); background-color: rgba(239, 68, 68, 0.03);' : ''}">
                <div class="card-header">
                    <div style="flex: 1; min-width: 0;">
                        <div class="card-title" title="${job.title || job.video_id}">${job.title || job.video_id}</div>
                        <div class="card-subtitle">
                            <span class="badge ${job.mode === 'pro' ? 'badge-pro' : 'badge-basic'}">${job.mode === 'pro' ? '4CH' : '2CH'}</span>
                            | ID: ${job.video_id}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        ${isError 
                            ? `<button class="btn btn-secondary" style="background-color: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);" onclick="resumeJob('${job.video_id}')">ลองใหม่</button>`
                            : (isPaused 
                                ? `<button class="btn btn-secondary" style="background-color: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);" onclick="resumeJob('${job.video_id}')">ทํางานต่อ</button>`
                                : `<button class="btn btn-secondary" style="background-color: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);" onclick="pauseJob('${job.video_id}')">หยุดพัก</button>`)
                        }
                        <button class="btn btn-danger" onclick="cancelJob('${job.video_id}', ${isError})">${isError ? 'ลบออก' : 'ยกเลิก'}</button>
                    </div>
                </div>
                ${isError 
                    ? `
                        <div style="font-size: 11px; color: #ef4444; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                            <span>⚠️ ${job.message || 'ดาวน์โหลดล้มเหลว'}</span>
                        </div>
                      `
                    : `
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${isQueued ? 5 : percent}%"></div>
                        </div>
                        <div class="job-status-row">
                            <span>สถานะ: ${getStatusText(job.status)}</span>
                            <span>${isQueued ? 'ต่อคิว' : percent + '%'}</span>
                        </div>
                        <div style="font-size: 11px; color: #a5a6a7; margin-top: -2px;">
                            ${job.message || ''}
                        </div>
                      `
                }
            </div>
        `;
    }).join("");
}

function getStatusText(status) {
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
}

// Pause job
async function pauseJob(videoId) {
    try {
        const res = await fetch(`${API_BASE}/pause/${videoId}`, { method: "POST" });
        const data = await res.json();
        if (data.status === "success") {
            fetchJobs();
        }
    } catch (e) {
        console.error(e);
    }
}

// Resume job
async function resumeJob(videoId) {
    try {
        const res = await fetch(`${API_BASE}/resume/${videoId}`, { method: "POST" });
        const data = await res.json();
        if (data.status === "success") {
            fetchJobs();
        }
    } catch (e) {
        console.error(e);
    }
}

// Cancel job
async function cancelJob(videoId, isError = false) {
    const confirmMsg = isError 
        ? "คุณต้องการลบรายการข้อผิดพลาดนี้ใช่หรือไม่?"
        : "คุณต้องการยกเลิกการแยกเสียงเพลงนี้ใช่หรือไม่?";
    if (!confirm(confirmMsg)) return;
    
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
}

// Fetch cache library list
async function fetchCache() {
    if (!serverOnline && !(await checkServerStatus())) return;

    try {
        const res = await fetch(`${API_BASE}/cache/list`);
        if (!res.ok) throw new Error("Failed to load cache");
        const data = await res.json();
        if (data.status === "success") {
            const results = data.results || [];
            cacheCount.innerText = results.length;
            
            let totalSize = 0;
            results.forEach(item => totalSize += item.size_mb || 0);
            totalCacheSize.innerText = totalSize.toFixed(2);
            
            renderCache(results);
        }
    } catch (e) {
        console.error(e);
    }
}

// Render cache list
function renderCache(items) {
    if (items.length === 0) {
        cacheList.style.display = "none";
        cacheEmpty.style.display = "flex";
        return;
    }

    cacheList.style.display = "flex";
    cacheEmpty.style.display = "none";

    cacheList.innerHTML = items.map(item => {
        const formattedDate = new Date(item.created_at * 1000).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        
        return `
            <div class="cache-card">
                <div class="card-header">
                    <div style="flex: 1; min-width: 0;">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        <div class="card-subtitle">
                            <span class="badge ${item.mode === 'pro' ? 'badge-pro' : 'badge-basic'}">${item.mode === 'pro' ? '4CH' : '2CH'}</span>
                            | ID: ${item.video_id} | ${formattedDate}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <span style="font-size: 12px; font-weight: bold; color: var(--text-white);">${item.size_mb} MB</span>
                        <button class="btn btn-danger" onclick="deleteCache('${item.video_id}')">ลบ</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Delete cache entry
async function deleteCache(videoId) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแคชของเพลงนี้?")) return;

    try {
        const res = await fetch(`${API_BASE}/cache/${videoId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.status === "success") {
            fetchCache();
        } else {
            alert("ลบไฟล์ไม่สำเร็จ: " + data.message);
        }
    } catch (e) {
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบได้");
    }
}

// Clear all cache
async function clearAllCache() {
    if (!confirm("🚨 คำเตือน! คุณต้องการลบแคชเพลงที่แยกเสร็จแล้วทั้งหมดใช่หรือไม่? (เพลงจะหายไปจากเครื่อง ต้องกดแยกเสียงใหม่ในการเล่นครั้งถัดไป)")) return;

    try {
        const res = await fetch(`${API_BASE}/cache/list`);
        const data = await res.json();
        if (data.status === "success") {
            const results = data.results || [];
            let successCount = 0;
            
            for (const item of results) {
                const delRes = await fetch(`${API_BASE}/cache/${item.video_id}`, { method: "DELETE" });
                const delData = await delRes.json();
                if (delData.status === "success") {
                    successCount++;
                }
            }
            
            alert(`ล้างแคชเรียบร้อยแล้ว ลบสำเร็จทั้งหมด ${successCount} เพลง`);
            fetchCache();
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการล้างแคชทั้งหมด");
    }
}

// Start polling
function startPolling() {
    checkServerStatus().then(() => {
        fetchJobs();
        if (activeTab === "cache") {
            fetchCache();
        }
    });

    updateInterval = setInterval(() => {
        if (activeTab === "jobs") {
            fetchJobs();
        } else {
            fetchCache();
        }
    }, 2000);
}

// Global functions for onclick attributes
window.cancelJob = cancelJob;
window.pauseJob = pauseJob;
window.resumeJob = resumeJob;
window.deleteCache = deleteCache;

// Start app
startPolling();
