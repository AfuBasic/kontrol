import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert } from 'lucide-react';

export type AttentionItem = {
    id: string;
    type: 'overstay' | 'security' | 'validation';
    severity: 'high' | 'medium';
    title: string;
    description: string;
    action_label: string;
    log_id?: number;
};

type Props = {
    items: AttentionItem[];
    onAction?: (item: AttentionItem) => void;
};

export default function AttentionPanel({ items, onAction }: Props) {
    if (!items || items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
                <AlertOctagon className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Attention Required ({items.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 bg-white shadow-2xs transition ${
                            item.severity === 'high' ? 'border-rose-200' : 'border-amber-200'
                        }`}
                    >
                        <div className="flex gap-2.5">
                            <div
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                    item.severity === 'high'
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.description}</p>
                            </div>
                        </div>

                        {onAction && (
                            <button
                                onClick={() => onAction(item)}
                                className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                    item.severity === 'high'
                                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                            >
                                {item.action_label}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
