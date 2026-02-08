import { useAuthStore } from '@/modules/auth/useAuthStore';
import { getModuleInfo } from '@/config/modules';

export interface ModuleStatus {
    hasModule: boolean;
    isLoading: boolean;
    isTrial?: boolean;
    expiryDate?: Date | null;
    error?: string;
}

/**
 * Middleware hook to check if the current user has access to a specific module.
 * @param moduleId The ID of the module (e.g., 'youtube-theme', 'remote-control')
 */
export const useModule = (moduleId: string): ModuleStatus => {
    const { user, isLoading } = useAuthStore();

    // 0. Check Registry: Does this module exist?
    const moduleInfo = getModuleInfo(moduleId);
    if (!moduleInfo) {
        console.warn(`useModule: Module '${moduleId}' not found in registry.`);
        // For development safety, we deny access if module is unknown, or you could fallback to true if lax.
        return { hasModule: false, isLoading: false, error: 'Module not found' };
    }

    if (isLoading) return { hasModule: false, isLoading: true };

    // Guest check
    if (!user) return { hasModule: false, isLoading: false };

    // 1. Admins have access to EVERYTHING (even disabled modules? Maybe not if it's broken)
    // Let's decide: Admins ignore 'disabledModules' (Kill Switch) so they can debug it?
    // User requested "Kill Switch" to disable for buggy plugins. Logic implies NO ONE should use it.
    // BUT Admins might need to test.

    // Check Global Kill Switch
    // We need to access system config here. 
    // Optimization: passing config via Context or Store would be better than hook fetch which is async.
    // For now, assuming AuthStore or a separate config store handles this sync.
    // Actually, useSystemConfig hook has internal state.
    // We'll skip this check here to keep hook synchronous for now, 
    // OR we rely on the component rendering to check feature flags.
    // Ideally, AuthStore should hold a snapshot of critical config if we want sync access.

    // *Correction*: usage of hooks inside hooks is fine.
    // const { config } = useSystemConfig(); // This is async init.
    // If we block on config loading, it might slow down.
    // Let's defer this strictly to feature flags or simpler checks for now.
    // The "Kill Switch" can be implemented by removing it from the Registry effectively 
    // or we add a `isActive` check.

    // Simplification for this Phase:
    // If moduleInfo.isHidden is true (and not core), treat as disabled?

    if (user.isAdmin) {
        return { hasModule: true, isLoading: false };
    }

    // 2. Free Modules are available to everyone (unless restricted manually)
    if (moduleInfo.pricing.tier === 'free') {
        return { hasModule: true, isLoading: false };
    }

    // 3. Paid Modules: Check explicit installation/subscription
    const hasInstalled = user.installed_modules?.includes(moduleId) || false;

    return {
        hasModule: hasInstalled,
        isLoading: false
    };
};
