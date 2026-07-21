import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Users, Shield, Megaphone, FileText, Wallet, AlertTriangle, 
    CheckCircle2, ChevronRight, Activity, Settings, UserPlus, 
    PlusCircle, Landmark, BellRing, ArrowRight, Eye, ShieldCheck, Clock
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useFeature } from '@/Hooks/useFeature';
import type { SharedData } from '@/types';

// Quick action routes
import CollectionController from '@/actions/App/Http/Controllers/Admin/CollectionController';
import { create as createPost, index as postsIndex } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';

type DetailedStats = {
    estateHealth: {
        name: string;
        address: string | null;
        status: 'normal' | 'attention' | 'critical';
        statusLabel: string;
        summary: string[];
    };
    needsAttention: {
        type: string;
        title: string;
        desc: string;
        severity: 'info' | 'warning' | 'danger';
        actionUrl: string;
    }[];
    operationalSnapshot: {
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
    financialOverview: {
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
    securityOperations: {
        securityOnDuty: number;
        visitorsExpected: number;
        visitorsCheckedIn: number;
        visitorsCheckedOut: number;
        openIncidents: number;
        emergencyAlerts: number;
        recentGateActivity: {
            id: number;
            visitor_name: string;
            resident_name: string;
            type: 'checkin' | 'checkout';
            time: string;
            verifier_name: string;
        }[];
    };
};

type Props = {
    detailedStats: any;
    recentActivity: {
        id: number;
        description: string;
        causer: { name: string; email: string } | null;
        subject_type: string;
        created_at: string;
    }[];
    recentPosts: {
        id: number;
        hashid: string;
        title: string;
        body: string;
        author: { name: string };
        comments_count: number;
        published_at: string;
    }[];
};

export default function Dashboard({ detailedStats, recentActivity, recentPosts }: Props) {
    const { estateHealth, needsAttention, operationalSnapshot, financialOverview, securityOperations } = detailedStats;

    // Severity color helper
    const getSeverityStyles = (severity: 'info' | 'warning' | 'danger') => {
        switch (severity) {
            case 'danger':
                return 'bg-rose-50/50 border-rose-100 text-rose-800 hover:bg-rose-50';
            case 'warning':
                return 'bg-amber-50/50 border-amber-100 text-amber-800 hover:bg-amber-50';
            default:
                return 'bg-blue-50/30 border-blue-150/40 text-blue-800 hover:bg-blue-50/60';
        }
    };

    // Health color helper
    const getHealthBg = (status: 'normal' | 'attention' | 'critical') => {
        switch (status) {
            case 'critical':
                return 'from-rose-900 to-slate-950';
            case 'attention':
                return 'from-amber-950 to-slate-950';
            default:
                return 'from-slate-900 to-indigo-950';
        }
    };

    return (
        <>
            <Head title="Command Center" />

            <div className="space-y-6 pb-24 w-full">

                {/* SECTION 1 — ESTATE HEALTH (Hero Section) */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${getHealthBg(estateHealth.status)} p-6 text-white shadow-lg`}
                >
                    <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Operational Command</span>
                                <h1 className="text-xl font-bold tracking-tight mt-0.5">{estateHealth.name}</h1>
                                {estateHealth.address && <p className="text-xs text-indigo-150/70 font-medium">{estateHealth.address}</p>}
                            </div>
                            <div className="shrink-0">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md">
                                    {estateHealth.statusLabel}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-3.5">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Daily Briefing Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-xs font-medium text-indigo-100/80">
                                {estateHealth.summary.map((sumText, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        <span className="truncate">{sumText}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 2 — NEEDS ATTENTION */}
                <section className="space-y-2.5">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">Needs Attention</h3>
                    {needsAttention.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {needsAttention.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={item.actionUrl}
                                    className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all active:scale-99 ${getSeverityStyles(item.severity)}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-normal">{item.desc}</p>
                                    </div>
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 border border-slate-100 text-slate-700">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-emerald-800">Everything looks good</h4>
                                <p className="mt-0.5 text-[11px] font-medium text-emerald-600/90 leading-tight">
                                    No operational issues require your attention today.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION 3 — OPERATIONAL SNAPSHOT */}
                <section className="space-y-2.5">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">Operational Snapshot</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        
                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Residents</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.residentsTotal}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Props</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.propertiesTotal}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Landmark className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Visitors Today</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.visitorsToday}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Security Active</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.securityOnDuty}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Collections</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">₦{operationalSnapshot.collectionsThisMonth.toLocaleString()}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-650">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balances</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">₦{operationalSnapshot.outstandingDues.toLocaleString()}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-650">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Open Incidents</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.openIncidents}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Board Posts</span>
                                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{operationalSnapshot.announcementsPublished}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Megaphone className="h-4 w-4" />
                            </div>
                        </div>

                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SECTION 4 — FINANCIAL OVERVIEW */}
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Financial Overview</h3>
                            <Link href="/admin/transactions" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-755 uppercase tracking-wide">
                                Transactions
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center border-b border-slate-50 pb-3">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Collected</span>
                                    <span className="text-xs font-bold text-slate-800 block mt-0.5">₦{financialOverview.collectionsThisMonth.toLocaleString()}</span>
                                </div>
                                <div className="border-x border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
                                    <span className="text-xs font-bold text-slate-800 block mt-0.5">₦{financialOverview.outstandingBalances.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rate</span>
                                    <span className="text-xs font-bold text-emerald-600 block mt-0.5">{financialOverview.collectionRate}%</span>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">Recent Payments</h4>
                                {financialOverview.recentPayments.length > 0 ? (
                                    <div className="space-y-2">
                                        {financialOverview.recentPayments.map((pmt) => (
                                            <div key={pmt.id} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/50 rounded-lg px-1 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{pmt.user_name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{pmt.collection_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600">₦{pmt.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-450">{pmt.paid_at}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-medium text-slate-400 text-center py-2">No recent payments recorded.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 5 — SECURITY & OPERATIONS */}
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Security & Operations</h3>
                            <Link href="/admin/visitors" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-755 uppercase tracking-wide">
                                Visitor Logs
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-center border-b border-slate-50 pb-3 text-xs">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
                                    <span className="font-bold text-slate-800 block mt-0.5">{securityOperations.visitorsCheckedIn}</span>
                                </div>
                                <div className="border-l border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked Out</span>
                                    <span className="font-bold text-slate-800 block mt-0.5">{securityOperations.visitorsCheckedOut}</span>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">Recent Gate Activity</h4>
                                {securityOperations.recentGateActivity.length > 0 ? (
                                    <div className="space-y-2">
                                        {securityOperations.recentGateActivity.map((act) => (
                                            <div key={act.id} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/50 rounded-lg px-1 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{act.visitor_name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">Visiting {act.resident_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${act.type === 'checkin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'}`}>
                                                        {act.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                                                    </span>
                                                    <p className="text-[9px] text-slate-450 mt-0.5">{act.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-medium text-slate-400 text-center py-2">No recent gate activity recorded.</p>
                                )}
                            </div>
                        </div>
                    </section>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SECTION 6 — RECENT ESTATE ACTIVITY */}
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Estate Activity</h3>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                            {recentActivity.length > 0 ? (
                                <div className="space-y-3.5">
                                    {recentActivity.slice(0, 5).map((activity, i) => (
                                        <div key={activity.id} className="relative flex items-start gap-3 text-xs">
                                            {i < Math.min(recentActivity.length, 5) - 1 && (
                                                <div className="absolute top-6 bottom-[-14px] left-[9px] w-0.5 bg-slate-50" />
                                            )}
                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-100/50">
                                                <Activity className="h-3 w-3 text-slate-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-700 leading-normal">
                                                    {activity.causer ? <span className="font-bold">{activity.causer.name}</span> : 'System'}{' '}
                                                    <span className="text-slate-600 font-medium">{activity.description}</span>
                                                </p>
                                                <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                                    {activity.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-6">No recent operational activity recorded.</p>
                            )}
                        </div>
                    </section>

                    {/* SECTION 7 — COMMUNITY UPDATES */}
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Updates</h3>
                            <Link href="/admin/estate-board" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-755 uppercase tracking-wide">
                                View All
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-3.5">
                            {recentPosts.length > 0 ? (
                                <div className="space-y-3">
                                    {recentPosts.slice(0, 3).map((post) => (
                                        <div key={post.id} className="flex items-start gap-3 text-xs pb-3 last:pb-0 border-b border-slate-50 last:border-0">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                <Megaphone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-slate-800 hover:text-indigo-650 transition-colors truncate">
                                                    {post.title}
                                                </h4>
                                                <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                                    Published {post.published_at} by {post.author.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-6">No announcements published yet.</p>
                            )}
                        </div>
                    </section>

                </div>

                {/* SECTION 8 — QUICK ACTIONS */}
                <section className="space-y-2.5">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        
                        {/* People */}
                        <div className="rounded-2xl border border-slate-150/60 bg-white p-4 space-y-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">People</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={ResidentController.create.url()}
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
                                >
                                    <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Add Resident</span>
                                </Link>
                                <Link
                                    href={SecurityPersonnelController.create.url()}
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
                                >
                                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Add Security Guard</span>
                                </Link>
                            </div>
                        </div>

                        {/* Operations */}
                        <div className="rounded-2xl border border-slate-150/60 bg-white p-4 space-y-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Operations</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={createPost.url()}
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
                                >
                                    <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Create Announcement</span>
                                </Link>
                                <Link
                                    href="/admin/visitors"
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
                                >
                                    <PlusCircle className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Register Visitor Log</span>
                                </Link>
                            </div>
                        </div>

                        {/* Finance */}
                        <div className="rounded-2xl border border-slate-150/60 bg-white p-4 space-y-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Finance</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={CollectionController.index.url()}
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
                                >
                                    <Wallet className="h-3.5 w-3.5 text-slate-400" />
                                    <span>View Collections</span>
                                </Link>
                            </div>
                        </div>

                        {/* Administration */}
                        <div className="rounded-2xl border border-slate-150/60 bg-white p-4 space-y-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Administration</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/admin/settings"
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1"
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
