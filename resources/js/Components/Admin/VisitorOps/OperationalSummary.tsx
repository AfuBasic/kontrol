import React from 'react';
import { AlertOctagon, CheckCircle2, Clock, LogIn, Users } from 'lucide-react';

type Props = {
    currentlyInside: number;
    expectedToday: number;
    pendingCheckout: number;
    visitorsToday: number;
};

export default function OperationalSummary({
    currentlyInside,
    expectedToday,
    pendingCheckout,
    visitorsToday,
}: Props) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Inside Now */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition shadow-2xs">
                <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Inside Now</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 sm:text-3xl">{currentlyInside}</span>
                    <span className="text-xs font-bold text-slate-500">visitors</span>
                </div>
            </div>

            {/* Expected Today */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition shadow-2xs">
                <div className="flex items-center justify-between text-blue-700">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Expected Next</span>
                    <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 sm:text-3xl">{expectedToday}</span>
                    <span className="text-xs font-bold text-slate-500">scheduled</span>
                </div>
            </div>

            {/* Overstay Alerts */}
            <div
                className={`relative overflow-hidden rounded-2xl border p-4 transition shadow-2xs ${
                    pendingCheckout > 0
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-slate-100 bg-white'
                }`}
            >
                <div className="flex items-center justify-between text-rose-700">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Overstay Alerts</span>
                    <AlertOctagon className={`h-4 w-4 ${pendingCheckout > 0 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-black sm:text-3xl ${pendingCheckout > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {pendingCheckout}
                    </span>
                    <span className="text-xs font-bold text-slate-500">action required</span>
                </div>
            </div>

            {/* Verified Today */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Verified Today</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 sm:text-3xl">{visitorsToday}</span>
                    <span className="text-xs font-bold text-slate-500">processed</span>
                </div>
            </div>
        </div>
    );
}
