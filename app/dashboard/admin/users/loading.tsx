export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl bg-[var(--surm-beige)] p-8 mb-8">
          {/* Title Skeleton */}
          <div className="h-8 w-48 bg-[var(--surm-text-dark)]/10 rounded mb-4"></div>
          {/* Description Skeleton */}
          <div className="h-4 w-96 bg-[var(--surm-text-dark)]/5 rounded mb-8"></div>
          
          {/* Table Container Skeleton */}
          <div className="bg-white rounded-xl p-6 min-h-[400px]">
            {/* Toolbar Skeleton */}
            <div className="flex justify-between mb-6">
                <div className="h-10 w-32 bg-gray-100 rounded"></div>
                <div className="h-10 w-32 bg-gray-100 rounded"></div>
            </div>
            {/* Table Rows Skeleton */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 w-full bg-gray-50 rounded-lg border border-gray-100"></div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
}
