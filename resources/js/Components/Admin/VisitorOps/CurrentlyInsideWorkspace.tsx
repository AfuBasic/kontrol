import React from 'react';
import { Clock, LogOut, ShieldCheck, UserCheck, Car, Building2 } from 'lucide-react';

export type ActiveVisitor = {
    id: number;
    code: string;
    visitor: {
        name: string;
        phone: string;
        type: string | null;
    };
    host: {
        id?: number;
        name: string;
        unit: string | null;
        address?: string | null;
    };
    purpose: string;
    verified_at: string;
    verified_at_human: string;
    duration_minutes: number;
    is_overstayed: boolean;
    gate: string;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
};

type Props = {
    visitors: ActiveVisitor[];
    onCheckOut?: (visitor: ActiveVisitor) => void;
};

export default function CurrentlyInsideWorkspace({ visitors, onCheckOut }: Props) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Currently Inside Estate
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {visitors.length} Active
                    </span>
                </div>
            </div>

            {visitors.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                    <UserCheck className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">No visitors inside the estate</p>
                    <p className="text-[11px] font-medium text-slate-400">All checked-in visitors have checked out.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visitors.map((v) => (
                        <div
                            key={v.id}
                            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-md ${
                                v.is_overstayed
                                    ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div>
                                {/* Status Header & Code */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                    <span className="font-mono text-[10px] font-black text-slate-400 tracking-wider">
                                        #{v.code}
                                    </span>
                                    {v.is_overstayed ? (
                                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-700">
                                            Overstayed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Inside
                                        </span>
                                    )}
                                </div>

                                {/* Visitor & Host Details */}
                                <div className="mt-3 space-y-1.5">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition">
                                            {v.visitor.name}
                                        </h3>
                                        <p className="text-[11px] font-semibold text-slate-400">{v.visitor.phone}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pt-1">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">
                                            Host: <strong className="text-slate-900">{v.host.name}</strong> ({v.host.unit ?? 'Main'})
                                        </span>
                                    </div>

                                    {v.vehicle && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                            <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span>
                                                {v.vehicle.make} {v.vehicle.model} ({v.vehicle.plate})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer & Check-out Quick Action */}
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{v.duration_minutes}m stay</span>
                                </div>

                                {onCheckOut && (
                                    <button
                                        onClick={() => onCheckOut(v)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>Check Out</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
