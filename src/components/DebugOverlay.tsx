import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DebugLog {
  timestamp: string;
  message: string;
  data?: any;
}

interface DebugOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

// Global debug logger
let debugLogs: DebugLog[] = [];
let logListeners: ((logs: DebugLog[]) => void)[] = [];

export const addDebugLog = (message: string, data?: any) => {
  const log: DebugLog = {
    timestamp: new Date().toLocaleTimeString('th-TH'),
    message,
    data,
  };

  debugLogs = [log, ...debugLogs].slice(0, 20); // Keep last 20 logs
  logListeners.forEach(listener => listener(debugLogs));
};

export default function DebugOverlay({ isVisible, onClose }: DebugOverlayProps) {
  const [logs, setLogs] = useState<DebugLog[]>(debugLogs);

  useEffect(() => {
    const listener = (newLogs: DebugLog[]) => setLogs(newLogs);
    logListeners.push(listener);

    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold">🐛 Debug Console</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มี log</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded p-3 bg-gray-50 font-mono text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                  {log.data && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 rounded-b-lg flex gap-2">
          <button
            onClick={() => {
              debugLogs = [];
              setLogs([]);
              addDebugLog('🗑️ Logs cleared');
            }}
            className="btn btn-sm btn-outline"
          >
            ล้าง Logs
          </button>
        </div>
      </div>
    </div>
  );
}
