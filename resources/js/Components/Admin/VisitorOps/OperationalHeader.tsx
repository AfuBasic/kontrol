import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    Download,
    Plus,
    QrCode,
    Shield,
    SlidersHorizontal,
} from 'lucide-react';

type Props = {
    onExportCSV: () => void;
    calendarUrl: string;
    currentlyInsideCount: number;
    expectedTodayCount: number;
};

export default function OperationalHeader({
    onExportCSV,
    calendarUrl,
    currentlyInsideCount,
    expectedTodayCount,
}: Props) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        Visitor Operations Center
                    </h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Ops</span>
                    </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                    Real-time gate control, active visitors, expected arrivals, and security monitoring.
                </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <Link
                    href={calendarUrl}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Visitor Calendar</span>
                </Link>

                <button
                    onClick={onExportCSV}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                    <Download className="h-4 w-4 text-slate-400" />
                    <span>Export Audit (CSV)</span>
                </button>
            </div>
        </div>
    );
}
