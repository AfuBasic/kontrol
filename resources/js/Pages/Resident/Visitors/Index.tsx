import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Calendar, Tag, Users, PlusCircle, CheckCircle2, XCircle, History as HistoryIcon, Activity, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import SearchInput from '@/Components/SearchInput';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';
import CodeCard from './Components/CodeCard';
import MobileSheet from '@/Components/MobileSheet';

type Props = {
    activeCodes: AccessCode[];
    historyCodes: AccessCode[];
    filters: {
        search_active?: string;
        search_history?: string;
    };
    recentActivity: {
        type: 'created' | 'used' | 'expired' | 'revoked' | 'telegram_linked' | 'telegram_unlinked' | 'logged_in' | string;
        message: string;
        time: string;
        time_full: string;
        code?: string;
        visitor?: string;
    }[];
    visitorStats: {
        active_codes: number;
        created_today: number;
        visitors_today: number;
        expected_today: number;
    };
};

export default function Visitors({ activeCodes, historyCodes, filters, recentActivity, visitorStats }: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    // Search State for History
    const [searchQuery, setSearchQuery] = useState(filters?.search_history || '');
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateSheet, setShowCreateSheet] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const activitySectionRef = useRef<HTMLDivElement>(null);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        setIsLoading(true);
        debounceTimeout.current = setTimeout(() => {
            router.get(
                resident.visitors.index.url(),
                {
                    search_history: query,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['historyCodes', 'filters'],
                    onFinish: () => setIsLoading(false),
                },
            );
        }, 300);
    };

    // Update local state if URL filters change externally
    useEffect(() => {
        setSearchQuery(filters?.search_history || '');
    }, [filters?.search_history]);

    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<AccessCode | null>(null);
    const [revoking, setRevoking] = useState(false);

    const openRevokeModal = (code: AccessCode) => {
        setCodeToRevoke(code);
        setRevokeModalOpen(true);
    };

    const handleConfirmRevoke = () => {
        if (!codeToRevoke) return;

        setRevoking(true);
        router.delete(resident.visitors.destroy.url(codeToRevoke.id), {
            onSuccess: () => {
                setRevokeModalOpen(false);
                setCodeToRevoke(null);
                setRevoking(false);
            },
            onError: () => {
                setRevoking(false);
            },
        });
    };

    // Filter Active vs Scheduled Passes
    const now = new Date();
    const activePasses = activeCodes.filter((code) => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        return !isFuture;
    });

    const scheduledPasses = activeCodes.filter((code) => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        return isFuture;
    });

    // Helper to render activity icon
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'created':
                return <PlusCircle className="h-4.5 w-4.5 text-indigo-600" />;
            case 'used':
                return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />;
            case 'expired':
                return <Clock className="h-4.5 w-4.5 text-amber-500" />;
            case 'revoked':
                return <XCircle className="h-4.5 w-4.5 text-rose-500" />;
            default:
                return <Activity className="h-4.5 w-4.5 text-slate-400" />;
        }
    };

    // Helper to format activity message for timeline
    const formatActivityMessage = (msg: string) => {
        let text = msg;
        if (text.includes('arrived')) {
            text = text.replace('arrived', 'entered the estate');
        }
        return text;
    };

    // Group history entries by month
    const groupCodesByMonth = (codes: AccessCode[]) => {
        const groups: Record<string, AccessCode[]> = {};
        codes.forEach((code) => {
            const date = new Date(code.created_at);
            const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(code);
        });
        return groups;
    };

    const groupedHistory = groupCodesByMonth(historyCodes);

    // Animation presets
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
    };

    // Stats layout
    const statsPills = [
        { label: 'Active', value: visitorStats?.active_codes ?? 0, color: 'bg-emerald-50/60 border-emerald-100 text-emerald-700' },
        { label: 'Expected Today', value: visitorStats?.expected_today ?? 0, color: 'bg-amber-50/60 border-amber-100 text-amber-700' },
        { label: 'Arrived Today', value: visitorStats?.visitors_today ?? 0, color: 'bg-indigo-50/60 border-indigo-100 text-indigo-700' },
        {
            label: 'Events Today',
            value: activeCodes.filter((c) => c.type === 'event').length,
            color: 'bg-purple-50/60 border-purple-100 text-purple-700',
        },
    ];

    return (
        <>
            <Head title="Visitor Access" />

            <div className="space-y-8 pb-32">
                {/* 1. HEADER */}
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Visitor Access</h1>
                    <p className="text-slate-450 mt-1 text-sm leading-normal font-bold">Manage everyone entering your estate in real-time.</p>
                </div>

                {/* 2. VISITOR HUB HERO */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="relative overflow-hidden rounded-[36px] bg-linear-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-xl shadow-indigo-950/15 sm:p-8"
                >
                    {/* Glowing aesthetic backdrops */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-indigo-500/15 blur-3xl" />

                    <div className="relative z-10 space-y-6">
                        <div className="max-w-md space-y-2">
                            <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">Visitor Command Center</span>
                            <h2 className="text-2xl leading-tight font-black tracking-tight sm:text-3xl">Invite guests, workers, or events</h2>
                            <p className="text-xs leading-relaxed font-bold text-indigo-100/70">
                                Generate secure digital access codes for one-time guests, long-term workers, or whole event lists instantly.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreateSheet(true)}
                                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-indigo-950 shadow-lg shadow-indigo-950/10 transition-all hover:bg-slate-50 active:scale-95"
                            >
                                <Plus className="h-4 w-4" strokeWidth={3} />
                                Create Pass
                            </button>
                            <button
                                onClick={() => activitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 text-xs font-black text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                            >
                                <Activity className="h-4 w-4" />
                                View Activity
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* 3. TODAY'S ACTIVITY PILLS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Today's Activity</h3>
                    </div>
                    <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pt-0.5 pb-2">
                        {statsPills.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                whileTap={{ scale: 0.97 }}
                                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black shadow-[0_2px_12px_rgb(0,0,0,0.01)] ${stat.color}`}
                            >
                                <span>{stat.value}</span>
                                <span className="font-bold opacity-75">{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 4. QUICK ACTIONS BAR */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Quick Actions</h3>
                    </div>
                    <button
                        onClick={() => setShowCreateSheet(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[24px] bg-slate-900 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-98"
                    >
                        <PlusCircle className="h-5 w-5" />
                        Create Access Pass
                    </button>
                </div>

                {/* 5. RECENT VISITOR ACTIVITY (TIMELINE) */}
                {recentActivity && recentActivity.length > 0 && (
                    <div ref={activitySectionRef} className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Recent Activity</h3>
                        </div>
                        <div className="space-y-6 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            {recentActivity.slice(0, 4).map((activity, i) => (
                                <div key={i} className="relative flex items-start gap-4">
                                    {/* Timeline thread line */}
                                    {i < Math.min(recentActivity.length, 4) - 1 && (
                                        <div className="absolute top-9 bottom-[-24px] left-[18px] w-0.5 bg-slate-100" />
                                    )}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1">
                                        <p className="text-xs leading-normal font-extrabold text-slate-800">
                                            {formatActivityMessage(activity.message)}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. ACTIVE VISITORS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Active Visitors</h3>
                        {activePasses.length > 0 && (
                            <span className="flex h-5 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 text-[10px] font-black text-emerald-600 uppercase">
                                {activePasses.length} Authorized
                            </span>
                        )}
                    </div>

                    {activePasses.length > 0 ? (
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {activePasses.map((code) => (
                                <motion.div key={code.id} variants={itemVariants}>
                                    <CodeCard code={code} showActions={code.status === 'active'} onRevoke={openRevokeModal} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[36px] border border-slate-200/80 bg-white px-8 py-14 text-center shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                            <div className="text-indigo-650 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100/50 bg-indigo-50">
                                <Users className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Your estate is quiet today</h3>
                            <p className="mt-2 max-w-xs text-xs leading-relaxed font-bold text-slate-400">
                                No guests currently have access. Create a pass when you're expecting visitors.
                            </p>
                            <button
                                onClick={() => setShowCreateSheet(true)}
                                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black text-white shadow-xl shadow-indigo-500/10 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                <PlusCircle className="h-4.5 w-4.5" />
                                Create Pass
                            </button>
                        </div>
                    )}
                </div>

                {/* 7. UPCOMING VISITORS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Upcoming Visitors</h3>
                        {scheduledPasses.length > 0 && (
                            <span className="flex h-5 items-center justify-center rounded-full border border-amber-100 bg-amber-50 px-2.5 text-[10px] font-black text-amber-600 uppercase">
                                {scheduledPasses.length} Scheduled
                            </span>
                        )}
                    </div>

                    {scheduledPasses.length > 0 ? (
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {scheduledPasses.map((code) => (
                                <motion.div key={code.id} variants={itemVariants}>
                                    <CodeCard code={code} showActions={false} onRevoke={openRevokeModal} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="rounded-[28px] border border-slate-200/60 bg-white p-6 text-center shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
                            <p className="text-xs font-bold text-slate-400">No upcoming visitor passes scheduled.</p>
                        </div>
                    )}
                </div>

                {/* 8. VISITOR HISTORY (LOW HIERARCHY CHRONOLOGICAL ARCHIVE) */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Visitor History Archive</h2>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <HistoryIcon className="h-4 w-4" />
                            Archive
                        </span>
                    </div>

                    <div className="space-y-6 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <SearchInput
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="Search history by visitor or code..."
                            isLoading={isLoading}
                        />

                        <AnimatePresence mode="wait">
                            {historyCodes.length > 0 ? (
                                <motion.div
                                    key="history-list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-8"
                                >
                                    {Object.keys(groupedHistory).map((month) => (
                                        <div key={month} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <span className="bg-white px-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    {month}
                                                </span>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {groupedHistory[month].map((code) => (
                                                    <CodeCard key={code.id} code={code} showActions={false} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-xs font-bold text-slate-400">
                                        {searchQuery ? 'No matching history found.' : 'No older passes in your history.'}
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* A. UNIFIED PASS CREATION DRAWER */}
            <MobileSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="What kind of access do you need?">
                <div className="space-y-3 pb-8">
                    <p className="mb-2 px-1 text-xs font-bold text-slate-400">Select a pass type to continue with invitation code generation.</p>

                    {/* One-Time Pass */}
                    <Link
                        href="/resident/visitors/create?type=single_use"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:border-indigo-200/60 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black tracking-tight text-slate-900">One-Time Pass</h4>
                            <p className="mt-1 text-xs leading-normal font-bold text-slate-400">
                                Perfect for a single visitor, delivery driver, or utility pickup. Valid for one entry.
                            </p>
                        </div>
                    </Link>

                    {/* Long-Term Pass */}
                    {!isHouseholdMember && (
                        <Link
                            href="/resident/visitors/create?type=long_lived"
                            onClick={() => setShowCreateSheet(false)}
                            className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:border-indigo-200/60 hover:bg-slate-100 active:scale-99"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black tracking-tight text-slate-900">Long-Term Pass</h4>
                                <p className="mt-1 text-xs leading-normal font-bold text-slate-400">
                                    For recurring visitors like family members, domestic staff, or contractors.
                                </p>
                            </div>
                        </Link>
                    )}

                    {/* Event Pass */}
                    <Link
                        href="/resident/visitors/create?type=event"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:border-indigo-200/60 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black tracking-tight text-slate-900">Event Pass</h4>
                            <p className="mt-1 text-xs leading-normal font-bold text-slate-400">
                                Generate one access pass that can be shared with multiple guests. Perfect for events.
                            </p>
                        </div>
                    </Link>
                </div>
            </MobileSheet>

            <ConfirmationModal
                isOpen={revokeModalOpen}
                onClose={() => setRevokeModalOpen(false)}
                onConfirm={handleConfirmRevoke}
                title="Revoke Access Code"
                message={`Are you sure you want to revoke the access code for ${
                    codeToRevoke?.visitor_name || 'this visitor'
                }? This action cannot be undone.`}
                confirmLabel="Revoke Code"
                type="danger"
                isLoading={revoking}
            />
        </>
    );
}

Visitors.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
