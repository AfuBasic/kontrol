import { Deferred, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Users,
    Shield,
    Megaphone,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Activity,
    Settings,
    UserPlus,
    PlusCircle,
    Landmark,
    ShieldCheck,
    Clock,
} from 'lucide-react';

import CollectionController from '@/actions/App/Http/Controllers/Admin/CollectionController';
import { create as createPost } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SectionErrorBoundary from '@/Components/SectionErrorBoundary';
import { CardSkeleton, FeedItemSkeleton, StatCardSkeleton } from '@/Components/Skeletons';
import { ErrorState, OfflineState } from '@/Components/States';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';

import ActionCenter, { AttentionItem } from '@/Components/Admin/Dashboard/ActionCenter';

type EstateHealth = {
    name: string;
    address: string | null;
    status: 'normal' | 'attention' | 'critical';
    statusLabel: string;
    summary: string[];
};

type OperationalSnapshot = {
    residentsTotal: number;
    residentsActive: number;
    propertiesTotal: number;
    visitorsToday: number;
    securityOnDuty: number;
    collectionsThisMonth: number;
    outstandingDues: number;
    openIncidents: number;
    announcementsPublished: number;
};

type FinancialOverview = {
    collectionsThisMonth: number;
    outstandingBalances: number;
    collectionRate: number;
    recentPayments: {
        id: number;
        user_name: string;
        amount: number;
        paid_at: string;
        collection_name: string;
    }[];
};

type SecurityOperations = {
    securityOnDuty: number;
    visitorsExpected: number;
    visitorsCheckedIn: number;
    visitorsCheckedOut: number;
    openIncidents: number;
    recentGateActivity: {
        id: number;
        visitor_name: string;
        resident_name: string;
        type: 'checkin' | 'checkout';
        time: string;
        verifier_name: string;
    }[];
};

type ActivityItem = {
    id: number;
    description: string;
    causer: { name: string; email: string } | null;
    subject_type: string;
    created_at: string;
};

type PostItem = {
    id: number;
    hashid: string;
    title: string;
    body: string;
    author: { name: string };
    comments_count: number;
    published_at: string;
};

type Props = {
    estateShell?: { name: string; address: string | null };
    estateHealth?: EstateHealth | null;
    operationalSnapshot?: OperationalSnapshot | null;
    needsAttention?: AttentionItem[] | null;
    financialOverview?: FinancialOverview | null;
    securityOperations?: SecurityOperations | null;
    recentActivity?: ActivityItem[] | null;
    recentPosts?: PostItem[] | null;
};

function getSeverityStyles(severity: 'info' | 'warning' | 'danger') {
    switch (severity) {
        case 'danger':
            return 'bg-rose-50/50 border-rose-100 text-rose-800 hover:bg-rose-50';
        case 'warning':
            return 'bg-amber-50/50 border-amber-100 text-amber-800 hover:bg-amber-50';
        default:
            return 'bg-blue-50/30 border-blue-150/40 text-blue-800 hover:bg-blue-50/60';
    }
}

function getHealthBg(status: 'normal' | 'attention' | 'critical') {
    switch (status) {
        case 'critical':
            return 'from-rose-900 to-slate-950';
        case 'attention':
            return 'from-amber-950 to-slate-950';
        default:
            return 'from-slate-900 to-indigo-950';
    }
}

export default function Dashboard({
    estateShell,
    estateHealth,
    operationalSnapshot,
    needsAttention,
    financialOverview,
    securityOperations,
    recentActivity,
    recentPosts,
}: Props) {
    const { quality, isOnline } = useNetworkQuality();
    const skipHeavyFinance = quality === 'poor' || quality === 'offline' || !isOnline;

    return (
        <>
            <Head title="Command Center" />

            <div className="w-full space-y-6 pb-24">
                {/* SECTION 1 — ESTATE HEALTH (shell eager, details deferred) */}
                <SectionErrorBoundary name="estate-health">
                    <Deferred
                        data="estateHealth"
                        fallback={
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-lg"
                            >
                                <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Operational Command</span>
                                <h1 className="mt-0.5 text-xl font-bold tracking-tight">{estateShell?.name ?? 'Estate'}</h1>
                                {estateShell?.address && <p className="text-xs font-medium text-indigo-200/70">{estateShell.address}</p>}
                                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-4 animate-pulse rounded bg-white/10" />
                                    ))}
                                </div>
                            </motion.div>
                        }
                    >
                        {estateHealth ? (
                            <EstateHealthHero health={estateHealth} />
                        ) : (
                            <ErrorState title="Could not load estate health" only={['estateHealth']} />
                        )}
                    </Deferred>
                </SectionErrorBoundary>

                {/* SECTION 2 — ACTION CENTER */}
                <SectionErrorBoundary name="needs-attention">
                    <Deferred
                        data="needsAttention"
                        fallback={
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Action Center</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            </section>
                        }
                    >
                        <ActionCenter items={needsAttention ?? []} />
                    </Deferred>
                </SectionErrorBoundary>

                {/* SECTION 3 — OPERATIONAL SNAPSHOT */}
                <SectionErrorBoundary name="operational-snapshot">
                    <Deferred
                        data="operationalSnapshot"
                        fallback={
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Operational Snapshot</h3>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <StatCardSkeleton key={i} />
                                    ))}
                                </div>
                            </section>
                        }
                    >
                        {operationalSnapshot ? (
                            <OperationalSnapshotSection snapshot={operationalSnapshot} />
                        ) : (
                            <ErrorState title="Could not load snapshot" only={['operationalSnapshot']} />
                        )}
                    </Deferred>
                </SectionErrorBoundary>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* SECTION 4 — FINANCIAL OVERVIEW */}
                    <SectionErrorBoundary name="financial-overview">
                        {skipHeavyFinance ? (
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Financial Overview</h3>
                                <div className="rounded-2xl border border-slate-100 bg-white">
                                    <OfflineState
                                        title="Finance details limited"
                                        message="Financial overview is skipped on poor or offline connections. Reconnect for live collection data."
                                    />
                                </div>
                            </section>
                        ) : (
                            <Deferred
                                data="financialOverview"
                                fallback={
                                    <section className="space-y-2.5">
                                        <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Financial Overview</h3>
                                        <CardSkeleton />
                                    </section>
                                }
                            >
                                {financialOverview ? (
                                    <FinancialOverviewSection data={financialOverview} />
                                ) : (
                                    <ErrorState title="Could not load finances" only={['financialOverview']} />
                                )}
                            </Deferred>
                        )}
                    </SectionErrorBoundary>

                    {/* SECTION 5 — SECURITY & OPERATIONS */}
                    <SectionErrorBoundary name="security-operations">
                        <Deferred
                            data="securityOperations"
                            fallback={
                                <section className="space-y-2.5">
                                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Security & Operations</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            <StatCardSkeleton />
                                            <StatCardSkeleton />
                                            <StatCardSkeleton />
                                        </div>
                                        <FeedItemSkeleton count={5} />
                                    </div>
                                </section>
                            }
                        >
                            {securityOperations ? (
                                <SecurityOperationsSection data={securityOperations} />
                            ) : (
                                <ErrorState title="Could not load security ops" only={['securityOperations']} />
                            )}
                        </Deferred>
                    </SectionErrorBoundary>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* SECTION 6 — RECENT ACTIVITY */}
                    <SectionErrorBoundary name="recent-activity">
                        <Deferred
                            data="recentActivity"
                            fallback={
                                <section className="space-y-2.5">
                                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Estate Activity</h3>
                                    <FeedItemSkeleton count={5} />
                                </section>
                            }
                        >
                            <RecentActivitySection items={recentActivity ?? []} />
                        </Deferred>
                    </SectionErrorBoundary>

                    {/* SECTION 7 — COMMUNITY UPDATES */}
                    <SectionErrorBoundary name="recent-posts">
                        <Deferred
                            data="recentPosts"
                            fallback={
                                <section className="space-y-2.5">
                                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Updates</h3>
                                    <FeedItemSkeleton count={3} />
                                </section>
                            }
                        >
                            <RecentPostsSection posts={recentPosts ?? []} />
                        </Deferred>
                    </SectionErrorBoundary>
                </div>

                {/* SECTION 8 — QUICK ACTIONS (static) */}
                <section className="space-y-2.5">
                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div className="space-y-2.5 rounded-2xl border border-slate-150/60 bg-white p-4">
                            <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">People</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={ResidentController.create.url()}
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Add Resident</span>
                                </Link>
                                <Link
                                    href={SecurityPersonnelController.create.url()}
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Add Security Guard</span>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-2.5 rounded-2xl border border-slate-150/60 bg-white p-4">
                            <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">Operations</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={createPost.url()}
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Create Announcement</span>
                                </Link>
                                <Link
                                    href="/admin/visitors"
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <PlusCircle className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Register Visitor Log</span>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-2.5 rounded-2xl border border-slate-150/60 bg-white p-4">
                            <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">Finance</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={CollectionController.index.url()}
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <Wallet className="h-3.5 w-3.5 text-slate-400" />
                                    <span>View Collections</span>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-2.5 rounded-2xl border border-slate-150/60 bg-white p-4">
                            <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">Administration</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/admin/settings"
                                    className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-600"
                                >
                                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Estate Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

function EstateHealthHero({ health }: { health: EstateHealth }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${getHealthBg(health.status)} p-6 text-white shadow-lg`}
        >
            <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Operational Command</span>
                        <h1 className="mt-0.5 text-xl font-bold tracking-tight">{health.name}</h1>
                        {health.address && <p className="text-xs font-medium text-indigo-150/70">{health.address}</p>}
                    </div>
                    <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md">
                            {health.statusLabel}
                        </span>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-3.5">
                    <h4 className="text-[10px] font-bold tracking-wider text-indigo-200 uppercase">Daily Briefing Summary</h4>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs font-medium text-indigo-100/80 md:grid-cols-4">
                        {health.summary.map((sumText, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                <span className="truncate">{sumText}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}



function OperationalSnapshotSection({ snapshot }: { snapshot: OperationalSnapshot }) {
    const cards = [
        { label: 'Residents', value: snapshot.residentsTotal, icon: Users },
        { label: 'Occupied Props', value: snapshot.propertiesTotal, icon: Landmark },
        { label: 'Visitors Today', value: snapshot.visitorsToday, icon: Clock },
        { label: 'Security Active', value: snapshot.securityOnDuty, icon: ShieldCheck },
        { label: 'Monthly Collections', value: `₦${snapshot.collectionsThisMonth.toLocaleString()}`, icon: Wallet, tone: 'emerald' },
        { label: 'Outstanding Balances', value: `₦${snapshot.outstandingDues.toLocaleString()}`, icon: AlertTriangle, tone: 'rose' },
        { label: 'Open Incidents', value: snapshot.openIncidents, icon: Activity },
        { label: 'Board Posts', value: snapshot.announcementsPublished, icon: Megaphone },
    ] as const;

    return (
        <section className="space-y-2.5">
            <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Operational Snapshot</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    const iconTone =
                        'tone' in card && card.tone === 'emerald'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'tone' in card && card.tone === 'rose'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-50 text-slate-500';

                    return (
                        <div
                            key={card.label}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                        >
                            <div className="min-w-0">
                                <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">{card.label}</span>
                                <span className="mt-0.5 block text-sm font-bold text-slate-800">{card.value}</span>
                            </div>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconTone}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function FinancialOverviewSection({ data }: { data: FinancialOverview }) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Financial Overview</h3>
                <Link href="/admin/transactions" className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700">
                    Transactions
                </Link>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-3 text-center">
                    <div>
                        <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Collected</span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-800">₦{data.collectionsThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="border-x border-slate-100">
                        <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Outstanding</span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-800">₦{data.outstandingBalances.toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Rate</span>
                        <span className="mt-0.5 block text-xs font-bold text-emerald-600">{data.collectionRate}%</span>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <h4 className="px-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Recent Payments</h4>
                    {data.recentPayments.length > 0 ? (
                        <div className="space-y-2">
                            {data.recentPayments.map((pmt) => (
                                <div
                                    key={pmt.id}
                                    className="flex items-center justify-between rounded-lg px-1 py-1 text-xs transition-colors hover:bg-slate-50/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-slate-800">{pmt.user_name}</p>
                                        <p className="truncate text-[10px] text-slate-400">{pmt.collection_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">₦{pmt.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400">{pmt.paid_at}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-2 text-center text-[11px] font-medium text-slate-400">No recent payments recorded.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function SecurityOperationsSection({ data }: { data: SecurityOperations }) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Security & Operations</h3>
                <Link href="/admin/visitors" className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700">
                    Visitor Logs
                </Link>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-3 text-center text-xs">
                    <div>
                        <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Checked In</span>
                        <span className="mt-0.5 block font-bold text-slate-800">{data.visitorsCheckedIn}</span>
                    </div>
                    <div className="border-l border-slate-100">
                        <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Checked Out</span>
                        <span className="mt-0.5 block font-bold text-slate-800">{data.visitorsCheckedOut}</span>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <h4 className="px-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Recent Gate Activity</h4>
                    {data.recentGateActivity.length > 0 ? (
                        <div className="space-y-2">
                            {data.recentGateActivity.map((act) => (
                                <div
                                    key={act.id}
                                    className="flex items-center justify-between rounded-lg px-1 py-1 text-xs transition-colors hover:bg-slate-50/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-slate-800">{act.visitor_name}</p>
                                        <p className="truncate text-[10px] text-slate-400">Visiting {act.resident_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                                act.type === 'checkin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {act.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                                        </span>
                                        <p className="mt-0.5 text-[9px] text-slate-400">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-2 text-center text-[11px] font-medium text-slate-400">No recent gate activity recorded.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function RecentActivitySection({ items }: { items: ActivityItem[] }) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Estate Activity</h3>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                {items.length > 0 ? (
                    <div className="space-y-3.5">
                        {items.slice(0, 5).map((activity, i) => (
                            <div key={activity.id} className="relative flex items-start gap-3 text-xs">
                                {i < Math.min(items.length, 5) - 1 && <div className="absolute top-6 bottom-[-14px] left-[9px] w-0.5 bg-slate-50" />}
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-100/50 bg-slate-50">
                                    <Activity className="h-3 w-3 text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="leading-normal font-semibold text-slate-700">
                                        {activity.causer ? <span className="font-bold">{activity.causer.name}</span> : 'System'}{' '}
                                        <span className="font-medium text-slate-600">{activity.description}</span>
                                    </p>
                                    <p className="mt-0.5 text-[9px] font-medium text-slate-400">{activity.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-6 text-center text-xs text-slate-400">No recent operational activity recorded.</p>
                )}
            </div>
        </section>
    );
}

function RecentPostsSection({ posts }: { posts: PostItem[] }) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Updates</h3>
                <Link href="/admin/estate-board" className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700">
                    View All
                </Link>
            </div>
            <div className="space-y-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                {posts.length > 0 ? (
                    <div className="space-y-3">
                        {posts.slice(0, 3).map((post) => (
                            <div key={post.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 text-xs last:border-0 last:pb-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                    <Megaphone className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-semibold text-slate-800 transition-colors hover:text-indigo-600">{post.title}</h4>
                                    <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                        Published {post.published_at} by {post.author.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-6 text-center text-xs text-slate-400">No announcements published yet.</p>
                )}
            </div>
        </section>
    );
}
