import { TvIcon } from '@heroicons/react/24/outline';
import { useCast } from '../context/CastContext';

export default function CastButton() {
  const { isAvailable, isConnected, receiverName, connect, disconnect } = useCast();

  // Don't show button if Cast API is not available
  if (!isAvailable) {
    return null;
  }

  const handleClick = () => {
    if (isConnected) {
      // Show disconnect confirmation
      const confirmed = confirm(`ต้องการหยุด Cast ไปยัง ${receiverName}?`);
      if (confirmed) {
        disconnect();
      }
    } else {
      connect();
    }
  };

  return (
    <button
      className={`btn btn-xs gap-1 flex flex-row 2xl:btn-sm ${
        isConnected ? 'btn-success' : 'btn-primary'
      }`}
      onClick={handleClick}
      title={isConnected ? `Connected to ${receiverName}` : 'Cast to TV'}
    >
      <TvIcon className="w-4 h-4" />
      {isConnected ? (
        <>
          <span className="hidden sm:inline">Cast: {receiverName}</span>
          <span className="sm:hidden">Cast</span>
        </>
      ) : (
        'Cast to TV'
      )}
    </button>
  );
}
