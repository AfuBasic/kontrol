import React from 'react';
import { Megaphone, Shield } from 'lucide-react';
import type { IncidentComment } from '@/types/incidents';

interface Props {
    updates: IncidentComment[];
    onAddUpdate?: () => void;
    canAddUpdate?: boolean;
    variant?: 'default' | 'security';
    className?: string;
}

export default function OfficialUpdates({ updates, onAddUpdate, canAddUpdate = true, variant = 'default', className = '' }: Props) {
    const isSecurity = variant === 'security';
    const dark = (classes: string): string => (isSecurity ? '' : classes);

    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);

            if (isSecurity) {
                const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                return `${date} · ${time}`;
            }

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

    const updateCount = updates?.length ?? 0;

    return (
        <section
            className={
                isSecurity
                    ? className
                    : `rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-4 shadow-xs sm:p-5 ${dark('dark:border-indigo-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40')} ${className}`
            }
        >
            <div className={`flex flex-col gap-3 ${isSecurity ? 'mb-3' : 'mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3.5'}`}>
                <div className="flex min-w-0 items-start gap-3">
                    {!isSecurity && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                            <Megaphone className="h-4.5 w-4.5 shrink-0" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3
                                className={
                                    isSecurity
                                        ? 'text-xs font-bold text-slate-900'
                                        : `text-sm font-black tracking-tight text-slate-900 ${dark('dark:text-slate-100')}`
                                }
                            >
                                Official Updates & Dispatches
                            </h3>
                            {updateCount > 0 && (
                                <span
                                    className={
                                        isSecurity
                                            ? 'shrink-0 text-[11px] font-semibold text-slate-500'
                                            : `inline-flex shrink-0 items-center rounded-full border border-indigo-300 bg-indigo-600/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 ${dark('dark:border-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-300')}`
                                    }
                                >
                                    {isSecurity
                                        ? `${updateCount} ${updateCount === 1 ? 'update' : 'updates'}`
                                        : `${updateCount} ${updateCount === 1 ? 'advisory' : 'advisories'}`}
                                </span>
                            )}
                        </div>
                        <p className={`mt-0.5 text-xs leading-normal font-medium text-slate-500 ${dark('dark:text-slate-400')}`}>
                            Direct notices from estate administration and security response teams.
                        </p>
                    </div>
                </div>

                {canAddUpdate && onAddUpdate && (
                    <button
                        type="button"
                        onClick={onAddUpdate}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 sm:w-auto sm:py-2"
                    >
                        <Megaphone className="h-3.5 w-3.5 shrink-0" />
                        <span>Post Update</span>
                    </button>
                )}
            </div>

            {updateCount === 0 ? (
                isSecurity ? (
                    <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">No official updates have been posted yet.</p>
                ) : (
                    <div
                        className={`rounded-xl border border-indigo-100 bg-white/70 p-4 text-center ${dark('dark:border-indigo-950/60 dark:bg-slate-900/50')}`}
                    >
                        <p className={`text-xs font-medium text-slate-500 ${dark('dark:text-slate-400')}`}>No official updates posted yet.</p>
                    </div>
                )
            ) : (
                <div className={isSecurity ? 'divide-y divide-slate-100 border-t border-slate-100' : 'space-y-3.5'}>
                    {updates.map((update, idx) =>
                        isSecurity ? (
                            <article key={update.id} className="py-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                        <Shield className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-baseline min-[380px]:justify-between min-[380px]:gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                                    Official Dispatch #{idx + 1}
                                                </p>
                                                <p className="truncate text-xs font-bold text-slate-900">
                                                    {update.author?.name || 'Estate Authority'}
                                                </p>
                                            </div>
                                            <time className="shrink-0 text-[11px] font-medium text-slate-500" dateTime={update.created_at}>
                                                {formatDate(update.created_at)}
                                            </time>
                                        </div>
                                        <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line text-slate-700 sm:text-sm">{update.body}</p>
                                    </div>
                                </div>
                            </article>
                        ) : (
                            <div
                                key={update.id}
                                className={`relative rounded-xl border border-indigo-100 bg-white/95 p-3.5 shadow-xs backdrop-blur-xs transition-all sm:p-4 ${dark('dark:border-indigo-950/80 dark:bg-slate-800/90')}`}
                            >
                                <div
                                    className={`mb-2.5 flex flex-col justify-between gap-1.5 border-b border-indigo-50 pb-2 sm:flex-row sm:items-center sm:gap-3 ${dark('dark:border-indigo-950/50')}`}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-indigo-800 sm:text-[11px] ${dark('dark:bg-indigo-950 dark:text-indigo-300')}`}
                                        >
                                            <Shield className="h-3 w-3 shrink-0" />
                                            <span>Official Dispatch #{idx + 1}</span>
                                        </span>
                                        <span className={`truncate text-xs font-bold text-slate-900 ${dark('dark:text-slate-100')}`}>
                                            {update.author?.name || 'Estate Authority'}
                                        </span>
                                    </div>
                                    <span
                                        className={`shrink-0 text-[10px] font-semibold text-slate-400 sm:text-[11px] ${dark('dark:text-slate-500')}`}
                                    >
                                        {formatDate(update.created_at)}
                                    </span>
                                </div>

                                <div
                                    className={`border-l-2 border-indigo-500 pl-2.5 text-xs leading-relaxed font-medium whitespace-pre-line text-slate-700 sm:text-sm ${dark('dark:border-indigo-400 dark:text-slate-200')}`}
                                >
                                    {update.body}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </section>
    );
}
