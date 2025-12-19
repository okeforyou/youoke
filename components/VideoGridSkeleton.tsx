/**
 * VideoGridSkeleton Component
 *
 * Skeleton loading state for video grid
 * Shows placeholder cards while videos are loading
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <VideoGridSkeleton count={6} />
 * ) : (
 *   <VideoGrid videos={videos} />
 * )}
 * ```
 */

export interface VideoGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Grid columns (2 or 3) */
  columns?: 2 | 3;
}

export default function VideoGridSkeleton({
  count = 6,
  columns = 2,
}: VideoGridSkeletonProps) {
  const gridCols = columns === 3 ? 'xl:grid-cols-3' : '';

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="card bg-base-100 shadow-sm animate-pulse"
        >
          {/* Thumbnail skeleton */}
          <figure className="relative w-full aspect-video bg-gray-300 rounded-t-lg" />

          {/* Content skeleton */}
          <div className="card-body p-2 sm:p-3 gap-2">
            {/* Title skeleton - 2 lines */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full" />
              <div className="h-3 bg-gray-300 rounded w-3/4" />
            </div>

            {/* Author skeleton */}
            <div className="h-2 bg-gray-200 rounded w-1/2 mt-1" />

            {/* View count skeleton */}
            <div className="h-2 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * PlaylistCardSkeleton - For playlist items
 */
export function PlaylistCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex gap-2 p-2 rounded-lg animate-pulse"
        >
          {/* Thumbnail */}
          <div className="w-32 h-20 bg-gray-300 rounded flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full" />
            <div className="h-3 bg-gray-300 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}
