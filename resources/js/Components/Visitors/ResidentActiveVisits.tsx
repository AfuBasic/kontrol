import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck, Users } from 'lucide-react';
import { formatStayDuration } from '@/Components/Admin/Visitors/types';

export type ActiveVisitItem = {
    id: number;
    access_log_id: number;
    code: string | null;
    pass_uuid: string | null;
    visitor: {
        name: string;
        phone: string | null;
        type: string | null;
    };
    host: {
        id?: number | null;
        name: string;
        unit?: string | null;
        address?: string | null;
    };
    purpose: string | null;
    verified_at: string | null;
    verified_at_iso: string | null;
    verified_at_time: string | null;
    verified_at_human: string | null;
    verifier_name: string;
    entry_point: string;
    duration_minutes: number;
    is_overstayed: boolean;
    code_expires_at: string | null;
    code_type: string | null;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
};

type Props = {
    activeVisits: ActiveVisitItem[];
    onSelectVisit?: (visit: ActiveVisitItem) => void;
};

export default function ResidentActiveVisits({ activeVisits, onSelectVisit }: Props) {
    if (activeVisits.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No active visitors</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    None of your visitors are currently checked into the estate.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeVisits.length} {activeVisits.length === 1 ? 'Visitor Inside' : 'Visitors Inside'}
                </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
                {activeVisits.map((visit) => {
                    const elapsed = formatStayDuration(visit.duration_minutes, visit);

                    return (
                        <div
                            key={visit.id}
                            onClick={() => onSelectVisit?.(visit)}
                            className={`flex cursor-pointer items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                visit.is_overstayed ? 'border-l-3 border-l-amber-500 bg-amber-50/25 dark:bg-amber-950/15' : ''
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {visit.visitor.name}
                                    </h4>
                                    {visit.code && (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            #{visit.code}
                                        </span>
                                    )}
                                    {visit.is_overstayed && (
                                        <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
                                            Pass Expired
                                        </span>
                                    )}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    <span>Entered {visit.verified_at_time || visit.verified_at}</span>
                                    <span>·</span>
                                    <span>{visit.entry_point}</span>
                                    {visit.purpose && (
                                        <>
                                            <span>·</span>
                                            <span className="capitalize">{visit.purpose}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <Clock className="h-3 w-3" />
                                    <span>{elapsed}</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
