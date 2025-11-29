import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { validateShareToken, ShareToken } from '../../services/shareService';

const SharedRoom = () => {
  const router = useRouter();
  const { token: tokenParam } = router.query;

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenParam || typeof tokenParam !== 'string') return;

    const validate = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const token = await validateShareToken(tokenParam);

        if (!token) {
          setValidationError('This share link is invalid or has been revoked.');
          setIsValidating(false);
          return;
        }

        console.log('✅ Valid share token:', token);

        // Store share token info in sessionStorage
        sessionStorage.setItem('shareToken', JSON.stringify(token));

        // Redirect to home page with room code
        router.push(`/?room=${token.roomId}&shared=true`);
      } catch (error) {
        console.error('❌ Token validation error:', error);
        setValidationError('Failed to validate share link.');
        setIsValidating(false);
      }
    };

    validate();
  }, [tokenParam, router]);

  // Render loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Validating share link...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">{validationError}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SharedRoom;
