import { useEffect } from 'react';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { THAI_FONTS } from '../data/fonts';

export const FontLoader = () => {
    const { config } = useSystemConfig();

    useEffect(() => {
        if (!config?.ui?.font) return;

        const { family, googleFontsUrl, baseFontSize, sidebarFontSize, variableName = '--font-primary' } = config.ui.font;

        // 1. Update Font Family Variable
        document.documentElement.style.setProperty(variableName, family);

        // 2. Update Font Size Variables
        if (baseFontSize) {
            document.documentElement.style.setProperty('--base-font-size', `${baseFontSize}px`);
        }
        if (sidebarFontSize) {
            document.documentElement.style.setProperty('--sidebar-font-size', `${sidebarFontSize}px`);
        }

        // 3. Inject Google Fonts Link
        // Check if it matches a preset to get the URL automatically if missing
        let url = googleFontsUrl;
        if (!url) {
            const preset = THAI_FONTS.find(f => f.family === family);
            if (preset) url = preset.url;
        }

        if (url) {
            const linkId = 'dynamic-font-loader';
            let link = document.getElementById(linkId) as HTMLLinkElement;

            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }

            if (link.href !== url) {
                link.href = url;
            }
        }

    }, [config?.ui?.font]);

    return null;
};
