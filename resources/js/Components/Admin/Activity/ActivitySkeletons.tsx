import React from 'react';

export default function ActivitySkeletons({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex animate-pulse flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5 dark:border-slate-800/60 dark:bg-slate-900"
                >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 sm:h-11 sm:w-11 dark:bg-slate-800" />
                    <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-1/2 rounded-md bg-slate-100 dark:bg-slate-800/60" />
                        <div className="flex gap-2 pt-1">
                            <div className="h-4 w-16 rounded-md bg-slate-100 dark:bg-slate-800/60" />
                            <div className="h-4 w-20 rounded-md bg-slate-100 dark:bg-slate-800/60" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
