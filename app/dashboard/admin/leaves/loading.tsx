export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl bg-white border border-[var(--surm-green-soft)]/20 p-8 mb-8 shadow-sm min-h-[500px]">
           <div className="flex justify-between items-center mb-8">
               <div className="h-8 w-48 bg-gray-100 rounded"></div>
               <div className="h-10 w-32 bg-gray-100 rounded"></div>
           </div>
           
           {/* Stats Row Skeleton */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="h-28 bg-gray-50 rounded-xl border border-gray-100"></div>
                <div className="h-28 bg-gray-50 rounded-xl border border-gray-100"></div>
                <div className="h-28 bg-gray-50 rounded-xl border border-gray-100"></div>
           </div>

           {/* List Skeleton */}
           <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 w-full bg-gray-50 rounded-xl border border-gray-100"></div>
                ))}
            </div>
        </div>
    </div>
  );
}
