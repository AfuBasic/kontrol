import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import MobileSheet from '@/Components/MobileSheet';
import SearchInput from '@/Components/SearchInput';
import VisitorTimeline from '@/Components/Visitors/VisitorTimeline';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingPass, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
    upcomingTimeline: AccessCode[];
    historyTimeline: AccessCode[];
    filters: {
        search_upcoming?: string;
        search_history?: string;
    };
    recentActivity: {
        type: string;
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

type Tab = 'upcoming' | 'history';

// ── Helpers ────────────────────────────────────────────────────────────────────

function pendingBadge(status: SyncStatus): { label: string; className: string } {
    switch (status) {
        case SyncStatus.Failed:
        case SyncStatus.Conflict:
            return {
                label: status === SyncStatus.Conflict ? 'Conflict' : 'Sync failed — tap to retry',
                className: 'bg-rose-50 text-rose-700 border-rose-100',
            };
        case SyncStatus.Syncing:
            return { label: 'Syncing…', className: 'bg-blue-50 text-blue-700 border-blue-100' };
        case SyncStatus.Synced:
            return { label: 'Synced ✓', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        default:
            return { label: 'Pending sync', className: 'bg-amber-50 text-amber-800 border-amber-100' };
    }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Visitors({
    upcomingTimeline,
    historyTimeline,
    filters,
    visitorStats,
}: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const { operations, retryOperation, isSyncing, syncNow } = useSyncStatus();

    const [activeTab, setActiveTab] = useState<Tab>('upcoming');
    const [searchQuery, setSearchQuery] = useState(
        activeTab === 'upcoming' ? (filters?.search_upcoming ?? '') : (filters?.search_history ?? ''),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateSheet, setShowCreateSheet] = useState(false);
    const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Revoke modal
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<AccessCode | null>(null);
    const [revoking, setRevoking] = useState(false);

    // ── Sync pending passes ────────────────────────────────────────────────────

    const refreshPending = useCallback(async () => {
        try {
            const stored = await ResidentStore.getPendingPasses();
            const merged = stored.map((pass) => {
                const op = operations.find((o) => o.id === pass.id);
                return op ? { ...pass, status: op.status, error: op.lastError ?? pass.error } : pass;
            });
            setPendingPasses(merged.filter((p) => p.status !== SyncStatus.Synced));

            const syncedIds = stored.filter((p) => {
                const op = operations.find((o) => o.id === p.id);
                return op?.status === SyncStatus.Synced;
            });
            if (syncedIds.length > 0) {
                await Promise.all(syncedIds.map((p) => ResidentStore.removePendingPass(p.id)));
                router.reload({ only: ['upcomingTimeline', 'historyTimeline', 'visitorStats'] });
            }
        } catch {
            setPendingPasses([]);
        }
    }, [operations]);

    useEffect(() => {
        void refreshPending();
    }, [refreshPending]);

    // ── Search ─────────────────────────────────────────────────────────────────

    // Sync search query when switching tabs
    useEffect(() => {
        setSearchQuery(
            activeTab === 'upcoming'
                ? (filters?.search_upcoming ?? '')
                : (filters?.search_history ?? ''),
        );
    }, [activeTab, filters]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        setIsLoading(true);

        debounceTimeout.current = setTimeout(() => {
            const params =
                activeTab === 'upcoming'
                    ? { search_upcoming: query }
                    : { search_history: query };
            const only =
                activeTab === 'upcoming'
                    ? (['upcomingTimeline', 'filters'] as const)
                    : (['historyTimeline', 'filters'] as const);

            router.get(resident.visitors.index.url(), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only,
                onFinish: () => setIsLoading(false),
            });
        }, 300);
    };

    // ── Revoke ─────────────────────────────────────────────────────────────────

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
            onError: () => setRevoking(false),
        });
    };

    // ── Tab counts ─────────────────────────────────────────────────────────────

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'upcoming', label: 'Upcoming', count: upcomingTimeline.length },
        { id: 'history', label: 'History', count: historyTimeline.length },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Visitor Passes" />

            <div className="mx-auto max-w-3xl space-y-5 pb-24">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 px-1">
                        Visitor Passes
                    </h1>
                    <p className="mt-0.5 px-1 text-xs text-slate-400 font-medium">
                        Your scheduled visits &amp; access history
                    </p>
                </div>

                {/* ── Today's summary strip ──────────────────────────────── */}
                {visitorStats.expected_today > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-2xl bg-indigo-950 px-4 py-3.5 text-white"
                    >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                            <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold">
                                {visitorStats.expected_today === 1
                                    ? '1 visitor expected today'
                                    : `${visitorStats.expected_today} visitors expected today`}
                            </p>
                            {visitorStats.visitors_today > 0 && (
                                <p className="text-[11px] text-indigo-300 mt-0.5">
                                    {visitorStats.visitors_today} already arrived
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Tabs ───────────────────────────────────────────────── */}
                <div className="bg-slate-100/80 p-0.5 rounded-xl flex relative">
                    {/* Active tabs */}
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            id={`visitor-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 py-2.5 text-xs font-semibold text-center transition-colors select-none cursor-pointer ${
                                activeTab === tab.id
                                    ? 'text-slate-900 font-bold'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-1.5">
                                {tab.label}
                                <span
                                    className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full font-medium ${
                                        activeTab === tab.id
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="visitorTabIndicator"
                                    className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                />
                            )}
                        </button>
                    ))}

                    {/* Calendar tab — future, disabled */}
                    <button
                        disabled
                        title="Calendar view — coming soon"
                        className="relative flex-1 py-2.5 text-xs font-semibold text-center text-slate-300 cursor-not-allowed select-none"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-1">
                            Calendar
                            <span className="text-[8px] leading-none bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                soon
                            </span>
                        </span>
                    </button>
                </div>

                {/* ── Offline pending passes ─────────────────────────────── */}
                {pendingPasses.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-700 uppercase">
                                <WifiOff className="h-3.5 w-3.5" />
                                Pending sync ({pendingPasses.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() => void syncNow()}
                                disabled={isSyncing}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                Sync now
                            </button>
                        </div>

                        <div className="rounded-xl border border-amber-100 bg-white divide-y divide-slate-50 shadow-sm overflow-hidden">
                            {pendingPasses.map((pass) => {
                                const badge = pendingBadge(pass.status);
                                return (
                                    <div key={pass.id} className="flex items-start gap-3 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-semibold text-slate-900">
                                                {pass.visitor_name || 'Visitor pass'}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {pass.purpose || pass.type || 'Access code'} · saved offline
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {pendingPasses.some(
                            (p) => p.status === SyncStatus.Failed || p.status === SyncStatus.Conflict,
                        ) && (
                            <button
                                type="button"
                                onClick={() =>
                                    pendingPasses.forEach((p) => {
                                        if (
                                            p.status === SyncStatus.Failed ||
                                            p.status === SyncStatus.Conflict
                                        ) {
                                            void retryOperation(p.id);
                                        }
                                    })
                                }
                                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white"
                            >
                                Retry all failed
                            </button>
                        )}
                    </section>
                )}

                {/* ── Search (History only) ──────────────────────────────── */}
                <AnimatePresence>
                    {activeTab === 'history' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                        >
                            <SearchInput
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search history by visitor or code..."
                                isLoading={isLoading}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Timeline content ───────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'upcoming' && (
                        <motion.div
                            key="upcoming"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <VisitorTimeline
                                codes={upcomingTimeline}
                                variant="upcoming"
                                alwaysShowToday
                                getCardHref={(code) => resident.visitors.show.url(code.id)}
                                renderCardActions={(code) =>
                                    code.status === 'active' || code.status === 'scheduled' ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openRevokeModal(code);
                                            }}
                                            className="rounded-lg px-2 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    ) : null
                                }
                            />
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <VisitorTimeline
                                codes={historyTimeline}
                                variant="history"
                                getCardHref={(code) => resident.visitors.show.url(code.id)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Floating Action Button ─────────────────────────────────── */}
            <div className="fixed bottom-6 right-6 z-40 hidden md:block">
                <button
                    id="create-visitor-pass-fab"
                    onClick={() => setShowCreateSheet(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                    title="Create Pass"
                >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Pass creation drawer ───────────────────────────────────── */}
            <MobileSheet
                isOpen={showCreateSheet}
                onClose={() => setShowCreateSheet(false)}
                title="What kind of access do you need?"
            >
                <div className="space-y-3 pb-8">
                    <p className="mb-2 px-1 text-xs font-semibold text-slate-450">
                        Select a pass type to continue with invitation code generation.
                    </p>

                    <Link
                        href="/resident/visitors/create?type=single_use"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                            <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-tight text-slate-900">One-Time Pass</h4>
                            <p className="mt-0.5 text-[11px] leading-normal font-medium text-slate-400">
                                Perfect for a single visitor, delivery driver, or utility pickup. Valid for one entry.
                            </p>
                        </div>
                    </Link>

                    {!isHouseholdMember && (
                        <Link
                            href="/resident/visitors/create?type=long_lived"
                            onClick={() => setShowCreateSheet(false)}
                            className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 active:scale-99"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                                <Calendar className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold tracking-tight text-slate-900">Long-Term Pass</h4>
                                <p className="mt-0.5 text-[11px] leading-normal font-medium text-slate-400">
                                    For recurring visitors like family members, domestic staff, or contractors.
                                </p>
                            </div>
                        </Link>
                    )}

                    <Link
                        href="/resident/visitors/create?type=event"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                            <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-tight text-slate-900">Event Pass</h4>
                            <p className="mt-0.5 text-[11px] leading-normal font-medium text-slate-400">
                                Generate one access pass that can be shared with multiple guests. Perfect for events.
                            </p>
                        </div>
                    </Link>
                </div>
            </MobileSheet>

            {/* ── Revoke confirmation ────────────────────────────────────── */}
            <ConfirmationModal
                isOpen={revokeModalOpen}
                onClose={() => setRevokeModalOpen(false)}
                onConfirm={handleConfirmRevoke}
                title="Cancel Visitor Pass"
                message={`Are you sure you want to cancel the pass for ${
                    codeToRevoke?.visitor_name || 'this visitor'
                }? This action cannot be undone.`}
                confirmLabel="Cancel Pass"
                type="danger"
                isLoading={revoking}
            />
        </>
    );
}

Visitors.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
