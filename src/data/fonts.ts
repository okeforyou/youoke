export interface GoogleFont {
    label: string;
    family: string; // CSS family name
    url: string; // Google Fonts URL
}

export const THAI_FONTS: GoogleFont[] = [
    {
        label: 'IBM Plex Sans Thai Looped (Default)',
        family: '"IBM Plex Sans Thai Looped", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'IBM Plex Sans Thai (Modern)',
        family: '"IBM Plex Sans Thai", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Kanit (Geometric)',
        family: '"Kanit", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Kanit:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Prompt (Loopless)',
        family: '"Prompt", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Prompt:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Sarabun (Corporate)',
        family: '"Sarabun", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Noto Sans Thai (Standard)',
        family: '"Noto Sans Thai", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100;200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Chakra Petch (Sci-Fi)',
        family: '"Chakra Petch", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap'
    },
    {
        label: 'Mali (Handwritten)',
        family: '"Mali", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Mali:wght@200;300;400;500;600;700&display=swap'
    },
    {
        label: 'Bai Jamjuree (Modern)',
        family: '"Bai Jamjuree", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap'
    }
];

export const FONT_SIZES = {
    base: { min: 12, max: 20, default: 16 },
    sidebar: { min: 12, max: 20, default: 14 } // Default sidebar usually slightly smaller or same
};
