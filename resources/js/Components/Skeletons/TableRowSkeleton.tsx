import { Skeleton } from '@/Components/UI/Skeleton';

interface Props {
    rows?: number;
    columns?: number;
}

export default function TableRowSkeleton({ rows = 5, columns = 4 }: Props) {
    return (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-white/10">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-3 flex-1" />
                    ))}
                </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-white/5">
                {Array.from({ length: rows }).map((_, row) => (
                    <div key={row} className="flex items-center gap-4 px-4 py-3.5">
                        {Array.from({ length: columns }).map((_, col) => (
                            <Skeleton key={col} className={`h-3 flex-1 ${col === 0 ? 'max-w-[30%]' : ''}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
