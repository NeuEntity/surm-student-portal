export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl bg-[var(--surm-beige)] p-8 mb-8 min-h-[500px]">
           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
               <div>
                   <div className="h-8 w-64 bg-[var(--surm-text-dark)]/10 rounded mb-2"></div>
                   <div className="h-4 w-96 bg-[var(--surm-text-dark)]/5 rounded"></div>
               </div>
               <div className="flex gap-2">
                   <div className="h-10 w-24 bg-[var(--surm-text-dark)]/10 rounded"></div>
                   <div className="h-10 w-24 bg-[var(--surm-text-dark)]/10 rounded"></div>
               </div>
           </div>
           
           {/* Tabs/Filter Skeleton */}
           <div className="h-12 w-full max-w-md bg-[var(--surm-text-dark)]/5 rounded-full mb-6"></div>

           {/* Cards/Table Skeleton */}
           <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 w-full bg-white/60 rounded-xl border border-[var(--surm-text-dark)]/5"></div>
                ))}
            </div>
        </div>
    </div>
  );
}
