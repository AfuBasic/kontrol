import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, RefreshCw, ScanLine, ShieldCheck, Siren, Wifi, WifiOff, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as HistoryController from '@/actions/App/Http/Controllers/Security/HistoryController';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import EmergencyServicesList from '@/Components/EmergencyServicesList';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { useSyncStatus } from '@/Hooks/useSyncStatus';

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

function formatLastSync(iso: string | null): string {
    if (!iso) {
        return 'Never';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '-';
    }
}

export default function SecurityCommandCenter() {
    const props = usePage<PageProps>().props;
    const estateName = props.estateName ?? '';
    const gateName = props.gateName ?? 'Main Entrance';
    const guardName = props.guardName ?? '';
    const stats = props.stats ?? EMPTY_STATS;
    const recentActivity = props.recentActivity ?? [];
    const [clock, setClock] = useState(formatClock());
    const { quality, isOnline } = useNetworkQuality();
    const { pendingCount, lastSyncAt, isSyncing, syncNow } = useSyncStatus();
    const [syncBusy, setSyncBusy] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setClock(formatClock()), 30000);
        return () => clearInterval(t);
    }, []);

    const handleSyncNow = async () => {
        setSyncBusy(true);
        try {
            await syncNow();
        } finally {
            setSyncBusy(false);
        }
    };

    const status = (() => {
        if (!isOnline || quality === 'offline') {
            return {
                label: 'Offline Mode - Scanning from cache',
                detail: pendingCount > 0 ? `${pendingCount} log${pendingCount === 1 ? '' : 's'} pending sync` : 'Manual entry always available',
                tone: 'slate' as const,
                Icon: WifiOff,
                pulse: false,
            };
        }

        if (quality === 'poor') {
            return {
                label: 'Limited Connectivity - Scanning still available',
                detail:
                    pendingCount > 0
                        ? `${pendingCount} pending · last sync ${formatLastSync(lastSyncAt)}`
                        : `Last sync ${formatLastSync(lastSyncAt)}`,
                tone: 'amber' as const,
                Icon: Zap,
                pulse: false,
            };
        }

        if (isSyncing || syncBusy) {
            return {
                label: 'Syncing…',
                detail: pendingCount > 0 ? `Uploading ${pendingCount} offline log${pendingCount === 1 ? '' : 's'}` : 'Refreshing offline cache',
                tone: 'blue' as const,
                Icon: Loader2,
                pulse: true,
            };
        }

        return {
            label: 'System Online',
            detail:
                pendingCount > 0 ? `${pendingCount} pending · last sync ${formatLastSync(lastSyncAt)}` : `Last sync ${formatLastSync(lastSyncAt)}`,
            tone: 'emerald' as const,
            Icon: Wifi,
            pulse: true,
        };
    })();

    const toneClasses = {
        emerald: {
            border: 'border-emerald-200/80',
            label: 'text-emerald-600',
            dot: 'bg-emerald-500',
            ping: 'bg-emerald-400',
        },
        amber: {
            border: 'border-amber-200/80',
            label: 'text-amber-700',
            dot: 'bg-amber-500',
            ping: 'bg-amber-400',
        },
        blue: {
            border: 'border-blue-200/80',
            label: 'text-blue-700',
            dot: 'bg-blue-500',
            ping: 'bg-blue-400',
        },
        slate: {
            border: 'border-slate-200',
            label: 'text-slate-600',
            dot: 'bg-slate-400',
            ping: 'bg-slate-300',
        },
    }[status.tone];

    return (
        <>
            <Head title="Security Command Center" />

            <div className="space-y-5">
                {/* System status strip */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneClasses.border}`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="relative flex h-2 w-2 shrink-0">
                                {status.pulse && (
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${toneClasses.ping}`} />
                                )}
                                <span className={`relative inline-flex h-2 w-2 rounded-full ${toneClasses.dot}`} />
                            </span>
                            <div className="min-w-0">
                                <p className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${toneClasses.label}`}>
                                    <status.Icon className={`h-3 w-3 ${status.Icon === Loader2 ? 'animate-spin' : ''}`} />
                                    <span className="truncate">{status.label}</span>
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {gateName} · {estateName}
                                    {status.detail ? ` · ${status.detail}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {(pendingCount > 0 || !isOnline) && (
                                <button
                                    type="button"
                                    onClick={() => void handleSyncNow()}
                                    disabled={syncBusy || isSyncing || !isOnline}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition active:scale-95 disabled:opacity-40"
                                >
                                    <RefreshCw className={`h-3 w-3 ${syncBusy || isSyncing ? 'animate-spin' : ''}`} />
                                    Sync
                                </button>
                            )}
                            <span className="rounded-full border border-slate-200 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-slate-600">
                                {clock}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Greeting */}
                <div className="px-1">
                    <p className="text-xs font-medium text-slate-500">{greeting()}</p>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900">{guardName}</h1>
                </div>

                {/* Primary action - full-bleed terminal CTA */}
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
                            <p className="mt-0.5 text-xs text-slate-300">
                                {!isOnline ? 'Offline terminal · cache + manual entry' : 'Open terminal · auto-validate on entry'}
                            </p>
                        </div>
                        <ChevronRight
                            className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white"
                            strokeWidth={2.2}
                        />
                    </div>
                </motion.button>

                {/* Live stats - 3-up */}
                <div className="grid grid-cols-3 gap-2.5">
                    <StatCard label="Expected" value={stats.expected_today} hint="today" />
                    <StatCard label="Validated" value={stats.validated_today} hint="today" tone="emerald" />
                    <StatCard label="Active" value={stats.active_codes} hint={stats.active_codes === 1 ? 'code' : 'codes'} />
                </div>

                {/* Recent activity feed */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
                            <p className="text-[11px] text-slate-500">Last validations at this gate</p>
                        </div>
                        <Link href={HistoryController.index.url()} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">
                            View all
                        </Link>
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
                                            {entry.host_name && <span className="font-normal text-slate-500"> · {entry.host_name}</span>}
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

                {/* National Emergency Services */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-red-600 text-white shadow-md">
                            <Siren className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-900">Emergency Services (Nigeria)</h2>
                    </div>
                    <EmergencyServicesList />
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, hint, tone = 'slate' }: { label: string; value: number; hint: string; tone?: 'slate' | 'emerald' }) {
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
