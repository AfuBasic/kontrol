import React from 'react';
import {
    Megaphone,
    Shield,
} from 'lucide-react';
import type { IncidentComment } from '@/types/incidents';

interface Props {
    updates: IncidentComment[];
    onAddUpdate?: () => void;
    canAddUpdate?: boolean;
    className?: string;
}

export default function OfficialUpdates({
    updates,
    onAddUpdate,
    canAddUpdate = true,
    className = '',
}: Props) {
    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <section className={`rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-4 sm:p-5 shadow-xs dark:border-indigo-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                        <Megaphone className="w-4.5 h-4.5 shrink-0" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                                Official Updates & Dispatches
                            </h3>
                            {updates && updates.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 border border-indigo-300 dark:border-indigo-800 shrink-0">
                                    {updates.length} {updates.length === 1 ? 'advisory' : 'advisories'}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
                            Direct notices from estate administration and security response teams
                        </p>
                    </div>
                </div>

                {canAddUpdate && onAddUpdate && (
                    <button
                        type="button"
                        onClick={onAddUpdate}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 sm:py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all shrink-0 whitespace-nowrap"
                    >
                        <Megaphone className="w-3.5 h-3.5 shrink-0" />
                        <span>Post Update</span>
                    </button>
                )}
            </div>

            {(!updates || updates.length === 0) ? (
                <div className="rounded-xl border border-indigo-100 bg-white/70 p-4 text-center dark:border-indigo-950/60 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        No official updates posted yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {updates.map((update, idx) => (
                        <div
                            key={update.id}
                            className="relative rounded-xl border border-indigo-100 bg-white/95 p-3.5 sm:p-4 shadow-xs backdrop-blur-xs transition-all dark:border-indigo-950/80 dark:bg-slate-800/90"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 mb-2.5 pb-2 border-b border-indigo-50 dark:border-indigo-950/50">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 shrink-0 whitespace-nowrap">
                                        <Shield className="w-3 h-3 shrink-0" />
                                        <span>Official Dispatch #{idx + 1}</span>
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {update.author?.name || 'Estate Authority'}
                                    </span>
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                                    {formatDate(update.created_at)}
                                </span>
                            </div>

                            <div className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed dark:text-slate-200 whitespace-pre-line pl-2.5 border-l-2 border-indigo-500 dark:border-indigo-400">
                                {update.body}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
