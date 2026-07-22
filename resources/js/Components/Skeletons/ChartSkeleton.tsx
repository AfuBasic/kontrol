import { Skeleton } from '@/Components/UI/Skeleton';

const BAR_HEIGHTS = ['h-16', 'h-28', 'h-20', 'h-36', 'h-24', 'h-32', 'h-20', 'h-40', 'h-24', 'h-36', 'h-20', 'h-40'];

export default function ChartSkeleton() {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-white/10">
            <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex h-48 items-end gap-2 px-1">
                {BAR_HEIGHTS.map((heightClass, i) => (
                    <Skeleton key={i} className={`w-full flex-1 rounded-t-md ${heightClass}`} />
                ))}
            </div>
        </div>
    );
}
