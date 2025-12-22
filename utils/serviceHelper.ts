/**
 * Service Helper Utilities
 *
 * Common utilities for service layer to standardize error handling,
 * Firebase checks, and response patterns.
 */

import { Database } from 'firebase/database';
import { Firestore } from 'firebase/firestore';
import { database as db, realtimeDb } from '../firebase';

/**
 * Standard service response type
 *
 * Use this for services that need to return both data and error information
 * without throwing exceptions.
 */
export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

/**
 * Service error with additional context
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Common error codes
 */
export const ServiceErrorCode = {
  FIREBASE_NOT_INITIALIZED: 'FIREBASE_NOT_INITIALIZED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Check if Firebase Firestore is initialized
 *
 * @example
 * if (!checkFirestoreInitialized(db)) {
 *   throw new ServiceError('Firebase not initialized', ServiceErrorCode.FIREBASE_NOT_INITIALIZED);
 * }
 */
export function checkFirestoreInitialized(
  db: Firestore | null | undefined
): db is Firestore {
  return db !== null && db !== undefined;
}

/**
 * Check if Firebase Realtime Database is initialized
 *
 * @example
 * if (!checkRealtimeDBInitialized(realtimeDb)) {
 *   throw new ServiceError('Firebase not initialized', ServiceErrorCode.FIREBASE_NOT_INITIALIZED);
 * }
 */
export function checkRealtimeDBInitialized(
  db: Database | null | undefined
): db is Database {
  return db !== null && db !== undefined;
}

/**
 * Wrapper for Firestore operations with automatic error handling
 *
 * @example
 * const result = await withFirestore(db, async () => {
 *   const doc = await getDoc(docRef);
 *   return doc.data();
 * });
 *
 * if (!result.success) {
 *   console.error(result.error);
 * }
 */
export async function withFirestore<T>(
  db: Firestore | null | undefined,
  operation: (db: Firestore) => Promise<T>,
  operationName = 'Firestore operation'
): Promise<ServiceResult<T>> {
  // Check if Firebase is initialized
  if (!checkFirestoreInitialized(db)) {
    const error = new ServiceError(
      'Firebase Firestore not initialized',
      ServiceErrorCode.FIREBASE_NOT_INITIALIZED
    );
    console.error(`[${operationName}] Firebase not initialized`);
    return {
      data: null,
      error,
      success: false,
    };
  }

  // Execute operation with error handling
  try {
    const data = await operation(db);
    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    const serviceError = new ServiceError(
      `Failed to execute ${operationName}`,
      ServiceErrorCode.UNKNOWN_ERROR,
      error
    );
    console.error(`[${operationName}] Error:`, error);
    return {
      data: null,
      error: serviceError,
      success: false,
    };
  }
}

/**
 * Simplified withFirestore - auto-injects db parameter
 * This is used by service layer that returns ServiceResult
 *
 * @example
 * export async function createPayment(data): Promise<ServiceResult<Payment>> {
 *   return withFirestoreWrapper(async () => {
 *     const paymentRef = doc(db!, PAYMENTS_COLLECTION, paymentId);
 *     await setDoc(paymentRef, payment);
 *     return success(payment);
 *   }, "PAYMENT_CREATE_FAILED");
 * }
 */
export async function withFirestoreWrapper<T>(
  operation: () => Promise<ServiceResult<T>>,
  _errorCode?: string,
  _fallback?: T
): Promise<ServiceResult<T>> {
  // Check if Firebase is initialized
  if (!checkFirestoreInitialized(db)) {
    const error = new ServiceError(
      'Firebase Firestore not initialized',
      ServiceErrorCode.FIREBASE_NOT_INITIALIZED
    );
    console.error('[withFirestoreWrapper] Firebase not initialized');
    return {
      data: _fallback || null,
      error,
      success: false,
    };
  }

  // Execute operation (it already handles ServiceResult pattern)
  try {
    return await operation();
  } catch (error) {
    const serviceError = new ServiceError(
      'Failed to execute operation',
      _errorCode || ServiceErrorCode.UNKNOWN_ERROR,
      error
    );
    console.error('[withFirestoreWrapper] Error:', error);
    return {
      data: _fallback || null,
      error: serviceError,
      success: false,
    };
  }
}

/**
 * Wrapper for Realtime Database operations with automatic error handling
 *
 * @example
 * const result = await withRealtimeDB(realtimeDb, async (db) => {
 *   const snapshot = await get(ref(db, 'users/123'));
 *   return snapshot.val();
 * });
 *
 * if (!result.success) {
 *   console.error(result.error);
 * }
 */
export async function withRealtimeDB<T>(
  db: Database | null | undefined,
  operation: (db: Database) => Promise<T>,
  operationName = 'Realtime DB operation'
): Promise<ServiceResult<T>> {
  // Check if Firebase is initialized
  if (!checkRealtimeDBInitialized(db)) {
    const error = new ServiceError(
      'Firebase Realtime Database not initialized',
      ServiceErrorCode.FIREBASE_NOT_INITIALIZED
    );
    console.error(`[${operationName}] Firebase not initialized`);
    return {
      data: null,
      error,
      success: false,
    };
  }

  // Execute operation with error handling
  try {
    const data = await operation(db);
    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    const serviceError = new ServiceError(
      `Failed to execute ${operationName}`,
      ServiceErrorCode.UNKNOWN_ERROR,
      error
    );
    console.error(`[${operationName}] Error:`, error);
    return {
      data: null,
      error: serviceError,
      success: false,
    };
  }
}

/**
 * Simplified withRealtimeDB - auto-injects db parameter
 * This is used by service layer that returns ServiceResult
 *
 * @example
 * export async function createUserProfile(data): Promise<ServiceResult<UserProfile>> {
 *   return withRealtimeDBWrapper(async () => {
 *     const userRef = ref(realtimeDb!, `users/${uid}`);
 *     await set(userRef, profile);
 *     return success(profile);
 *   }, "USER_CREATE_FAILED");
 * }
 */
export async function withRealtimeDBWrapper<T>(
  operation: () => Promise<ServiceResult<T>>,
  _errorCode?: string,
  _fallback?: T
): Promise<ServiceResult<T>> {
  // Check if Firebase is initialized
  if (!checkRealtimeDBInitialized(realtimeDb)) {
    const error = new ServiceError(
      'Firebase Realtime Database not initialized',
      ServiceErrorCode.FIREBASE_NOT_INITIALIZED
    );
    console.error('[withRealtimeDBWrapper] Firebase not initialized');
    return {
      data: _fallback || null,
      error,
      success: false,
    };
  }

  // Execute operation (it already handles ServiceResult pattern)
  try {
    return await operation();
  } catch (error) {
    const serviceError = new ServiceError(
      'Failed to execute operation',
      _errorCode || ServiceErrorCode.UNKNOWN_ERROR,
      error
    );
    console.error('[withRealtimeDBWrapper] Error:', error);
    return {
      data: _fallback || null,
      error: serviceError,
      success: false,
    };
  }
}

/**
 * Retry a function with exponential backoff
 *
 * Useful for handling transient network errors
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms (default: 1000)
 *
 * @example
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   3,
 *   1000
 * );
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
        error
      );

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
    }
  }

  throw lastError!;
}

/**
 * Retry with ServiceResult return type
 *
 * @example
 * const result = await retryWithResult(
 *   () => fetch('/api/data').then(r => r.json()),
 *   'Fetch data'
 * );
 *
 * if (!result.success) {
 *   console.error('Failed after retries:', result.error);
 * }
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  operationName = 'Operation',
  maxRetries = 3,
  initialDelay = 1000
): Promise<ServiceResult<T>> {
  try {
    const data = await retry(fn, maxRetries, initialDelay);
    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    const serviceError = new ServiceError(
      `Failed to execute ${operationName} after ${maxRetries} retries`,
      ServiceErrorCode.NETWORK_ERROR,
      error
    );
    console.error(`[${operationName}] Failed after retries:`, error);
    return {
      data: null,
      error: serviceError,
      success: false,
    };
  }
}

/**
 * Simple in-memory cache with TTL
 *
 * @example
 * const cache = new SimpleCache<UserProfile>(5 * 60 * 1000); // 5 minutes TTL
 * cache.set('user-123', userProfile);
 * const cached = cache.get('user-123'); // Returns null if expired
 */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();

  constructor(private ttl: number = 5 * 60 * 1000) {} // Default 5 minutes

  /**
   * Get cached value (returns null if expired or not found)
   */
  get(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached value
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Log service operation for debugging
 *
 * @example
 * logServiceOperation('getUserProfile', { uid: '123' });
 * logServiceOperation('getUserProfile', { uid: '123' }, 'Started');
 * logServiceOperation('getUserProfile', { uid: '123' }, 'Failed', error);
 */
export function logServiceOperation(
  operation: string,
  params: Record<string, unknown>,
  status: 'Started' | 'Success' | 'Failed' = 'Success',
  error?: Error
): void {
  const timestamp = new Date().toISOString();
  const prefix = status === 'Failed' ? '❌' : status === 'Success' ? '✅' : '🔄';

  console.log(`${prefix} [${timestamp}] ${operation}`, params);

  if (error) {
    console.error('Error details:', error);
  }
}

/**
 * Create a success result
 */
export function success<T>(data: T): ServiceResult<T> {
  return {
    data,
    error: null,
    success: true,
  };
}

/**
 * Create a failure result
 */
export function failure<T>(error: Error | string, code?: string): ServiceResult<T> {
  const err =
    error instanceof Error
      ? error
      : new ServiceError(error, code || ServiceErrorCode.UNKNOWN_ERROR);

  return {
    data: null,
    error: err,
    success: false,
  };
}
