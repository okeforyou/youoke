// Polyfill window and document for libraries that assume browser env
self.window = self;
self.document = {
    addEventListener: (type, listener) => { },
    removeEventListener: (type, listener) => { },
    createElement: (tagName) => ({ style: {}, setAttribute: () => { } }),
    body: { style: {} },
    documentElement: { style: {} },
    head: { appendChild: () => { } },
    currentScript: null // Critical for Emscripten glue code
};

console.log("👷 Worker Script: Listening for initialization...");

let WorkerSynthesizerCore;
let synthCore;
let messageQueue = [];
let isInitializing = false;

// Dynamic import to ensure polyfill applies first
import('./index.js').then(module => {
    WorkerSynthesizerCore = module.WorkerSynthesizerCore;
    console.log("👷 Worker Script: Module loaded.");

    // Check if we have queued messages to process now that module is loaded
    // (If handshake arrived while importing)
    // Note: The main loop handles "if (!WorkerSynthesizerCore)" check, so subsequent messages will trigger that check.
    // The handshake logic relies on messageQueue logic.
    if (messageQueue.length > 0) {
        // Trigger processing by "fake" event or just let the next onmessage trigger it?
        // Actually, onmessage pushes to queue if !WorkerSynthesizerCore.
        // So we need to process the queue now.
        processQueue();
    }
}).catch(err => {
    console.error("👷 Worker Script: Import failed", err);
});

function processQueue() {
    if (!messageQueue.length) return;

    // We only process if we have the Class loaded
    if (!WorkerSynthesizerCore) return;

    // Use a while loop to process available messages
    // We must be careful not to infinite loop if synthCore init takes time (async).

    // If synthCore is not ready, we can ONLY process the handshake.
    if (!synthCore) {
        const handshakeCandidates = [...messageQueue]; // Copy
        // We iterate and find the first handshake.
        // Actually, the main onmessage logic handles "initialize or queue".
        // So we should feed these back into the main logic?

        // But main logic is an event handler.
        // Let's iterate and call the handler logic manually.

        // Strategy: Pull from queue, call handleEvent logic.
        // If handleEvent logic says "re-queue", we stop?
        // Or we just re-run the queue logic.

        while (messageQueue.length > 0) {
            const e = messageQueue[0]; // Peek

            if (!synthCore && !isInitializing) {
                // Try to initialize
                const config = e.data;
                const workletPort = e.ports && e.ports[0];

                if (config && workletPort) {
                    messageQueue.shift(); // Consume handshake
                    handleHandshake(e);
                } else {
                    // Not handshake, and no core. Keep queued?
                    // If we can't init, we can't process others.
                    // Wait for handshake.
                    break;
                }
            } else if (isInitializing) {
                // Still initing, stop processing/keep queued.
                break;
            } else if (synthCore) {
                // Ready! Consume and handle.
                const e = messageQueue.shift();
                synthCore.handleMessage(e.data);
            }
        }
    } else {
        while (messageQueue.length > 0) {
            const e = messageQueue.shift();
            synthCore.handleMessage(e.data);
        }
    }
}

async function handleHandshake(e) {
    if (isInitializing) return;
    isInitializing = true;

    const config = e.data;
    const workletPort = e.ports && e.ports[0];

    console.log("👷 Worker Script: Initializing Core...", config);

    try {
        synthCore = new WorkerSynthesizerCore(
            config,
            workletPort,
            (msg, transfer) => self.postMessage(msg, transfer)
        );

        console.log("👷 Worker Script: Core Ready!");
        isInitializing = false;

        // Core is ready, process remaining queue
        processQueue();

    } catch (err) {
        console.error("👷 Worker Script: Core Crash", err);
        isInitializing = false;
    }
}

self.onmessage = async (e) => {
    // If module not loaded, strict queue
    if (!WorkerSynthesizerCore) {
        console.log("👷 Worker Script: Module not loaded yet, queueing...", e.data);
        messageQueue.push(e);
        return;
    }

    if (!synthCore) {
        // If initializing, queue
        if (isInitializing) {
            console.log("👷 Worker Script: Queueing message during init...", e.data);
            messageQueue.push(e);
            return;
        }

        // Check if handshake
        const config = e.data;
        const workletPort = e.ports && e.ports[0];

        if (config && workletPort) {
            await handleHandshake(e);
        } else {
            // Not handshake, queue
            console.log("👷 Worker Script: Queueing early message...", e.data);
            messageQueue.push(e);
        }
    } else {
        // Ready
        if (synthCore.handleMessage) {
            synthCore.handleMessage(e.data);
        }
    }
};
