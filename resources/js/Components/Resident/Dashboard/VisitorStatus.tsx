import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, ChevronRight } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

interface Props {
    activeCodes: AccessCode[];
}

export default function VisitorStatus({ activeCodes }: Props) {
    const inside = activeCodes.filter((c) => c.status === 'used');
    const upcoming = activeCodes.filter((c) => c.status === 'active');

    if (activeCodes.length === 0) {
        return (
            <div className="group relative overflow-hidden rounded-[38px] border border-slate-100 bg-white px-6 py-12 text-center shadow-sm transition-all hover:shadow-md">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}
                />

                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-slate-300 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <User className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">You're all clear today</h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-slate-400">
                    No visitors are currently scheduled or inside the community. Everything is quiet at the gate.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Active Visitors */}
            {inside.length > 0 && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900">Inside Community</h3>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{inside.length} Active</span>
                    </div>
                    <div className="grid gap-4">
                        {inside.map((code) => (
                            <VisitorCard key={code.id} code={code} status="Inside" />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Visitors */}
            {upcoming.length > 0 && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900">Upcoming Visitors</h3>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{upcoming.length} Pending</span>
                    </div>
                    <div className="grid gap-4">
                        {upcoming.map((code) => (
                            <VisitorCard key={code.id} code={code} status="At gate" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function VisitorCard({ code, status }: { code: AccessCode; status: string }) {
    return (
        <motion.div whileTap={{ scale: 0.98 }}>
            <Link
                href={`/resident/visitors/${code.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
            >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <User className="h-7 w-7" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className="truncate text-base font-bold text-slate-900">{code.visitor_name || 'Guest'}</h4>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {status}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {code.time_remaining}
                        </span>
                    </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                </div>
            </Link>
        </motion.div>
    );
}
