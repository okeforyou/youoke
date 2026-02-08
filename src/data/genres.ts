export interface GenreItem {
    query: string; // Keep for legacy/fallback search
    playlistId?: string; // New Spotify ID
    title: string;
    description?: string;
    thumbnail: string;
    color: string;
}

// Dynamic Search Queries (Always Fresh)
export const YOUTUBE_GENRES: GenreItem[] = [
    {
        query: "GMM Grammy Hits",
        title: "GMM Grammy ✨",
        description: "เพลงฮิตแกรมมี่ อัปเดตล่าสุด",
        thumbnail: "",
        color: "from-red-600"
    },
    {
        query: "Thailand Top 50",
        title: "Thailand Top 100 ✨",
        description: "เพลงไทยชาร์ตท็อป ยอดวิวสูง",
        thumbnail: "",
        color: "from-blue-600"
    },
    {
        query: "ลูกทุ่ง 100 ล้านวิว",
        title: "ลูกทุ่ง 100 ล้านวิว ✨",
        description: "รวมฮิตลูกทุ่ง ยอดวิวถล่มทลาย",
        thumbnail: "",
        color: "from-green-600"
    },
    {
        query: "เพลงแดนซ์",
        title: "สายปาร์ตี้ ✨",
        description: "แดนซ์มันส์ๆ เพลงผับ",
        thumbnail: "",
        color: "from-purple-600"
    },
    {
        query: "เพลงร้านกาแฟ",
        title: "Indie & Cafe ✨",
        description: "เพลงฟังสบายๆ ชิลล์ๆ",
        thumbnail: "",
        color: "from-teal-500"
    },
    {
        query: "เพลงเศร้า",
        title: "เพลงเศร้า ✨",
        description: "เอาใจคนอกหัก",
        thumbnail: "",
        color: "from-gray-500"
    },
    {
        query: "เพลงยุค 90",
        title: "90's Hits ✨",
        description: "เพลงฮิตยุค 90-2000",
        thumbnail: "",
        color: "from-yellow-500"
    },
    {
        query: "เพื่อชีวิต",
        title: "เพื่อชีวิต ✨",
        description: "ตำนานเพลงเพื่อชีวิต",
        thumbnail: "",
        color: "from-orange-700"
    }
];
