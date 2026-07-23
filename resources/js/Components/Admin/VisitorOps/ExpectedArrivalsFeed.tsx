import React from 'react';
import { CalendarClock, CheckCircle, Clock, User } from 'lucide-react';

export type ExpectedVisitor = {
    id: number;
    code: string;
    visitor_name: string;
    visitor_phone: string;
    purpose: string;
    type: string | null;
    host_name: string;
    host_unit: string;
    expected_time: string;
    expires_at?: string | null;
};

type Props = {
    arrivals: ExpectedVisitor[];
    onQuickCheckIn?: (visitor: ExpectedVisitor) => void;
};

export default function ExpectedArrivalsFeed({ arrivals, onQuickCheckIn }: Props) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Today's Expected Arrivals
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {arrivals.length} Scheduled
                    </span>
                </div>
            </div>

            {arrivals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                    <CalendarClock className="h-7 w-7 text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">No upcoming arrivals for today</p>
                    <p className="text-[11px] text-slate-400">Scheduled visitor passes will appear here.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                    {arrivals.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 transition"
                        >
                            <div className="flex items-start gap-3">
                                {/* Time Badge */}
                                <div className="flex h-10 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50/80 font-bold text-blue-700">
                                    <span className="text-xs">{item.expected_time}</span>
                                </div>

                                {/* Visitor Details */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-900">{item.visitor_name}</h4>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                                            {item.purpose}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                        Visiting <strong className="text-slate-700">{item.host_name}</strong> ({item.host_unit}) • Code: <span className="font-mono font-bold text-slate-800">#{item.code}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Quick Action */}
                            {onQuickCheckIn && (
                                <button
                                    onClick={() => onQuickCheckIn(item)}
                                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shrink-0 self-start sm:self-center"
                                >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>Verify & Check In</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
