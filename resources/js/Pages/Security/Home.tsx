import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, ScanLine, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import SecurityLayout from '@/Layouts/SecurityLayout';

type ActivityItem = {
    id: number;
    visitor_name: string;
    host_name: string | null;
    code: string | null;
    verified_at: string | null;
    verified_at_human: string | null;
    type: string | null;
};

type Stats = {
    expected_today: number;
    validated_today: number;
    active_codes: number;
};

interface PageProps {
    estateName?: string;
    gateName?: string;
    guardName?: string;
    stats?: Stats;
    recentActivity?: ActivityItem[];
    [key: string]: unknown;
}

const EMPTY_STATS: Stats = { expected_today: 0, validated_today: 0, active_codes: 0 };

export default function SecurityCommandCenter() {
    const props = usePage<PageProps>().props;
    const estateName = props.estateName ?? '';
    const gateName = props.gateName ?? 'Main Entrance';
    const guardName = props.guardName ?? '';
    const stats = props.stats ?? EMPTY_STATS;
    const recentActivity = props.recentActivity ?? [];
    const [clock, setClock] = useState(formatClock());

    useEffect(() => {
        const t = setInterval(() => setClock(formatClock()), 30000);
        return () => clearInterval(t);
    }, []);

    return (
        <SecurityLayout>
            <Head title="Security Command Center" />

            <div className="space-y-5">
                {/* System status strip */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase">System online</p>
                            <p className="truncate text-xs text-slate-500">
                                {gateName} · {estateName}
                            </p>
                        </div>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-slate-600">
                        {clock}
                    </span>
                </motion.div>

                {/* Greeting */}
                <div className="px-1">
                    <p className="text-xs font-medium text-slate-500">{greeting()}</p>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900">{guardName}</h1>
                </div>

                {/* Primary action — full-bleed terminal CTA */}
                <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.visit(VerifyController.url())}
                    className="group relative w-full overflow-hidden rounded-3xl bg-slate-950 px-5 py-5 text-left text-white shadow-[0_12px_28px_-12px_rgba(2,6,23,0.5)] transition active:scale-[0.99]"
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-30"
                        style={{
                            background:
                                'radial-gradient(60% 40% at 100% 0%, #34d399 0%, transparent 65%), radial-gradient(40% 50% at 0% 100%, #6366f1 0%, transparent 60%)',
                        }}
                    />
                    <div className="relative flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                            <ScanLine className="h-6 w-6 text-emerald-300" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">Primary action</p>
                            <p className="text-lg font-semibold tracking-tight">Validate access code</p>
                            <p className="mt-0.5 text-xs text-slate-300">Open terminal · auto-validate on entry</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" strokeWidth={2.2} />
                    </div>
                </motion.button>

                {/* Live stats — 3-up */}
                <div className="grid grid-cols-3 gap-2.5">
                    <StatCard label="Expected" value={stats.expected_today} hint="today" />
                    <StatCard label="Validated" value={stats.validated_today} hint="today" tone="emerald" />
                    <StatCard label="Active" value={stats.active_codes} hint="codes" />
                </div>

                {/* Recent activity feed */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
                            <p className="text-[11px] text-slate-500">Last validations at this gate</p>
                        </div>
                        <span className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Live</span>
                    </header>

                    {recentActivity.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-slate-700">No activity yet</p>
                            <p className="mt-1 text-xs text-slate-500">Validations will appear here as visitors arrive.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {recentActivity.map((entry) => (
                                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                        <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {entry.visitor_name}
                                            {entry.host_name && (
                                                <span className="font-normal text-slate-500"> · {entry.host_name}</span>
                                            )}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {entry.code && <span className="font-mono tracking-wider">{entry.code}</span>}
                                            {entry.code && entry.verified_at_human && <span> · </span>}
                                            {entry.verified_at_human}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </SecurityLayout>
    );
}

function StatCard({
    label,
    value,
    hint,
    tone = 'slate',
}: {
    label: string;
    value: number;
    hint: string;
    tone?: 'slate' | 'emerald';
}) {
    const accent = tone === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">{label}</p>
            <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${accent}`}>{value}</p>
            <p className="text-[10px] text-slate-400">{hint}</p>
        </div>
    );
}

function formatClock() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

