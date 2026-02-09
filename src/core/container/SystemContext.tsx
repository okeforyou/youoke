import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../../modules/auth/useAuthStore';
// Import other core services as they are ready
// import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';

/**
 * The System Container holds references to all Core Services.
 * Plugins and Features should access logic via this Container,
 * NOT by importing directly from 'modules/...'.
 */
interface ISystemContainer {
    auth: typeof useAuthStore;
    // player: typeof usePlayerStore;
}

const SystemContext = createContext<ISystemContainer | null>(null);

export const SystemProvider = ({ children }: { children: ReactNode }) => {
    // 💉 INJECTION POINT:
    // This is where we wire up the specific implementations.
    // If we switch to Supabase later, we change IT HERE ONLY.
    const system: ISystemContainer = {
        auth: useAuthStore,
        // player: usePlayerStore,
    };

    return (
        <SystemContext.Provider value={system}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (!context) {
        throw new Error("useSystem must be used within a SystemProvider");
    }
    return context;
};
