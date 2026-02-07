import { useState, useEffect } from 'react';
import { SystemConfigService, DEFAULT_CONFIG } from '../services/systemConfigService';

export const useSystemConfig = () => {
    const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = SystemConfigService.subscribeToConfig((newConfig) => {
            setConfig(newConfig);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { config, loading };
};
