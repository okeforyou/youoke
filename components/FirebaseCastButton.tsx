import { useState } from 'react';
import { TvIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFirebaseCast } from '../context/FirebaseCastContext';

export default function FirebaseCastButton() {
  const { isConnected, roomCode, isHost, joinRoom, leaveRoom } = useFirebaseCast();
  const [showModal, setShowModal] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async () => {
    console.log('🔍 handleJoinRoom called, roomCode:', inputRoomCode);

    if (!inputRoomCode || inputRoomCode.length !== 4) {
      console.log('❌ Invalid room code length');
      setError('กรุณากรอกเลขห้อง 4 หลัก');
      return;
    }

    setIsJoining(true);
    setError('');
    console.log('🚀 Attempting to join room:', inputRoomCode);

    try {
      const success = await joinRoom(inputRoomCode);
      console.log('✅ joinRoom result:', success);

      if (success) {
        console.log('✅ Successfully joined room');
        setShowModal(false);
        setInputRoomCode('');
      } else {
        console.log('❌ Room not found');
        setError('ไม่พบห้อง กรุณาตรวจสอบเลขห้องอีกครั้ง');
      }
    } catch (err) {
      console.error('❌ Error joining room:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }

    setIsJoining(false);
  };

  const handleDisconnect = () => {
    if (confirm(`ต้องการหยุด Cast หรือไม่?`)) {
      leaveRoom();
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setError('');
    setInputRoomCode('');
  };

  if (isConnected) {
    // Show connected state - Mute control via YouTube player on Monitor
    return (
      <button
        className="btn btn-success btn-xs gap-1 flex flex-row 2xl:btn-sm"
        onClick={handleDisconnect}
        title={`Connected to room ${roomCode}. ควบคุมเสียงที่หน้าจอทีวี`}
      >
        <TvIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isHost ? '📡' : '👁️'} {roomCode}
        </span>
        <span className="sm:hidden">{roomCode}</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="btn btn-primary btn-xs gap-1 flex flex-row 2xl:btn-sm"
        onClick={handleOpenModal}
      >
        <TvIcon className="w-4 h-4" />
        Cast to TV
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => setShowModal(false)}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-4">📺 Cast to TV</h3>

            {/* Instructions */}
            <div className="alert alert-info mb-4">
              <div className="text-sm">
                <p className="font-semibold mb-1">วิธีใช้งาน:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>เปิด youoke.vercel.app/tv บนทีวี</li>
                  <li>ดูเลขห้อง 4 หลักที่แสดงบนทีวี</li>
                  <li>กรอกเลขห้องด้านล่าง แล้วกดเข้าร่วม</li>
                </ol>
              </div>
            </div>

            {/* Join Room */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">กรอกเลขห้องจากทีวี</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input input-bordered flex-1 text-center text-3xl tracking-widest"
                  placeholder="0000"
                  maxLength={4}
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary mt-3 w-full"
                onClick={handleJoinRoom}
                disabled={isJoining || inputRoomCode.length !== 4}
              >
                {isJoining ? '⏳ กำลังเข้าร่วม...' : '🚀 เข้าร่วมห้อง'}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mt-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-sm" onClick={() => setShowModal(false)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
