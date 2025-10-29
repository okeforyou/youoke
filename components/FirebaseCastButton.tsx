import { useState } from 'react';
import { TvIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFirebaseCast } from '../context/FirebaseCastContext';

export default function FirebaseCastButton() {
  const { isConnected, roomCode, isHost, createRoom, joinRoom, leaveRoom } = useFirebaseCast();
  const [showModal, setShowModal] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError('');

    try {
      const code = await createRoom();
      if (code) {
        setShowModal(false);
        setInputRoomCode('');
      } else {
        setError('ไม่สามารถสร้างห้องได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }

    setIsCreating(false);
  };

  const handleJoinRoom = async () => {
    console.log('🔍 handleJoinRoom called, roomCode:', inputRoomCode);

    if (!inputRoomCode || inputRoomCode.length !== 6) {
      console.log('❌ Invalid room code length');
      setError('กรุณากรอกเลขห้อง 6 หลัก');
      return;
    }

    setIsJoining(true);
    setError('');
    console.log('🚀 Attempting to join room:', inputRoomCode.toUpperCase());

    try {
      const success = await joinRoom(inputRoomCode.toUpperCase());
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
    // Show connected state
    return (
      <button
        className="btn btn-success btn-xs gap-1 flex flex-row 2xl:btn-sm"
        onClick={handleDisconnect}
        title={`Connected to room ${roomCode}`}
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

            <h3 className="font-bold text-lg mb-4">Cast to TV</h3>

            {/* Create Room */}
            <div className="card bg-base-200 p-4 mb-4">
              <h4 className="font-semibold mb-2">📱 สร้างห้องใหม่</h4>
              <p className="text-sm text-gray-600 mb-3">
                สร้างห้องเพื่อแสดงเพลงบนทีวี
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreateRoom}
                disabled={isCreating}
              >
                {isCreating ? 'กำลังสร้าง...' : 'สร้างห้อง'}
              </button>
            </div>

            {/* Join Room */}
            <div className="card bg-base-200 p-4">
              <h4 className="font-semibold mb-2">📺 เข้าร่วมห้อง</h4>
              <p className="text-sm text-gray-600 mb-3">
                กรอกเลขห้องจากทีวี (6 หลัก)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleJoinRoom}
                  disabled={isJoining || inputRoomCode.length !== 6}
                >
                  {isJoining ? 'กำลังเข้าร่วม...' : 'เข้าร่วม'}
                </button>
              </div>
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
