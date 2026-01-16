export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header/Hero Skeleton */}
      <div className="h-24 w-full max-w-md rounded-xl bg-[var(--surm-text-dark)]/5 mb-8"></div>

      {/* Stats Grid Skeleton - Common pattern in dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-[var(--surm-text-dark)]/5"></div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl bg-[var(--surm-text-dark)]/5 p-8 h-[500px]">
        <div className="h-8 w-48 bg-[var(--surm-text-dark)]/10 rounded mb-6"></div>
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-[var(--surm-text-dark)]/10 rounded-xl"></div>
            ))}
        </div>
      </div>
    </div>
  );
}
