export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export class ServiceError extends Error {
    code: string;
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
    }
}

export function success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
}

export function failure<T>(message: string, code: string): ServiceResult<T> {
    return { success: false, error: { code, message } };
}

export async function retryWithResult<T>(
    fn: () => Promise<T>,
    operationName: string,
    retries: number,
    delay: number
): Promise<ServiceResult<T>> {
    try {
        const data = await fn();
        return success(data);
    } catch (error: any) {
        return failure(error.message, "RETRY_FAILED");
    }
}

export async function withRealtimeDBWrapper<T>(
    fn: () => Promise<ServiceResult<T>>,
    errorCode: string
): Promise<ServiceResult<T>> {
    try {
        return await fn();
    } catch (error: any) {
        console.error(errorCode, error);
        return failure(error.message, errorCode);
    }
}

export function logServiceOperation(operation: string, details: any) {
    console.log(`[Service] ${operation}:`, details);
}

export class SimpleCache<T> {
    private cache = new Map<string, { data: T; expiry: number }>();
    private ttl: number;

    constructor(ttl: number) {
        this.ttl = ttl;
    }

    set(key: string, data: T) {
        this.cache.set(key, { data, expiry: Date.now() + this.ttl });
    }

    get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return undefined;
        }
        return item.data;
    }

    delete(key: string) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}
