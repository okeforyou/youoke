import { useEffect, useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function DebugFirebase() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>({});
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = () => {
    setStatus({
      realtimeDbExists: !!realtimeDb,
      userLoggedIn: !!user?.uid,
      userId: user?.uid || 'Not logged in',
      displayName: user?.displayName || 'N/A',
      env: {
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'NOT SET',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      },
    });
  };

  const testWrite = async () => {
    if (!realtimeDb) {
      setTestResult('❌ Firebase Realtime Database not initialized');
      return;
    }

    if (!user?.uid) {
      setTestResult('❌ User not logged in');
      return;
    }

    try {
      const testRef = ref(realtimeDb, `test/${Date.now()}`);
      await set(testRef, {
        message: 'Test write',
        timestamp: Date.now(),
        userId: user.uid,
      });
      setTestResult('✅ Write successful!');
    } catch (error: any) {
      setTestResult(`❌ Write failed: ${error.message}`);
    }
  };

  const testRead = async () => {
    if (!realtimeDb) {
      setTestResult('❌ Firebase Realtime Database not initialized');
      return;
    }

    try {
      const testRef = ref(realtimeDb, 'test');
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setTestResult(`✅ Read successful: ${JSON.stringify(snapshot.val())}`);
      } else {
        setTestResult('✅ Read successful but no data');
      }
    } catch (error: any) {
      setTestResult(`❌ Read failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Firebase Debug Page</h1>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Firebase Operations</h2>
          <div className="flex gap-4 mb-4">
            <button
              className="btn btn-primary"
              onClick={testWrite}
              disabled={!realtimeDb || !user?.uid}
            >
              Test Write
            </button>
            <button
              className="btn btn-secondary"
              onClick={testRead}
              disabled={!realtimeDb}
            >
              Test Read
            </button>
            <button className="btn btn-ghost" onClick={checkFirebaseStatus}>
              Refresh Status
            </button>
          </div>
          {testResult && (
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-mono">{testResult}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">📝 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Check if "realtimeDbExists" is true</li>
            <li>Check if "userLoggedIn" is true (login if not)</li>
            <li>Check if "databaseURL" is set correctly</li>
            <li>Click "Test Write" to test Firebase connection</li>
            <li>If errors appear, check Firebase Console Rules</li>
          </ol>
        </div>

        {/* Quick Fixes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">🔧 Common Issues:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>realtimeDbExists: false</strong> → Check if
              NEXT_PUBLIC_FIREBASE_DATABASE_URL is set in Vercel
            </li>
            <li>
              <strong>userLoggedIn: false</strong> → Login first at{' '}
              <a href="/login" className="text-blue-600 underline">
                /login
              </a>
            </li>
            <li>
              <strong>Write failed: Permission denied</strong> → Check Firebase
              Realtime Database Rules
            </li>
            <li>
              <strong>FIREBASE_FATAL_ERROR</strong> → Restart browser and try again
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
