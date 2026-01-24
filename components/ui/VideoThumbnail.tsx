import Image from "next/image";
import { useState, useEffect } from "react";

interface VideoThumbnailProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export default function VideoThumbnail({
    src: initialSrc,
    alt,
    className,
    priority = false,
}: VideoThumbnailProps) {
    const [src, setSrc] = useState<string>(initialSrc);
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(initialSrc);
        setError(false);
    }, [initialSrc]);

    // Fallback to a default image (icon-cover.png or similar)
    const fallbackSrc = "/icon-cover.png";

    return (
        <Image
            src={error ? fallbackSrc : src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
            className={`${className} ${error ? "object-contain p-4 bg-base-200" : "object-cover"}`}
            priority={priority}
            onError={() => {
                if (!error) {
                    setError(true);
                    setSrc(fallbackSrc);
                }
            }}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+"
        />
    );
}
