import { Skeleton } from '@/Components/UI/Skeleton';

export default function StatCardSkeleton() {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-white/10">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-2.5 w-24" />
        </div>
    );
}
