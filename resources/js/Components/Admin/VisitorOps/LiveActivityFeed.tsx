import React from 'react';
import { Activity, CheckCircle2, LogIn, LogOut, XCircle } from 'lucide-react';

export type FeedItem = {
    id: number;
    type: 'entry' | 'exit' | string;
    message: string;
    time: string;
};

type Props = {
    items: FeedItem[];
};

export default function LiveActivityFeed({ items }: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Gate Stream</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                    Live
                </span>
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-xs font-semibold text-slate-400 italic">
                    No movements recorded today.
                </p>
            ) : (
                <div className="space-y-3.5">
                    {items.map((item) => (
                        <div key={item.id} className="relative flex gap-3 text-xs">
                            <div
                                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                                    item.type === 'exit'
                                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {item.type === 'exit' ? (
                                    <LogOut className="h-3.5 w-3.5" />
                                ) : (
                                    <LogIn className="h-3.5 w-3.5" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="leading-snug font-semibold text-slate-800">{item.message}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-slate-400">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
