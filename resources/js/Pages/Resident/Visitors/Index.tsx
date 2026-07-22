import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import MobileSheet from '@/Components/MobileSheet';
import SearchInput from '@/Components/SearchInput';
import NextVisitorHero from '@/Components/Visitors/NextVisitorHero';
import VisitorTimeline from '@/Components/Visitors/VisitorTimeline';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingPass, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';

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

export default function Visitors({
    upcomingTimeline,
    historyTimeline,
    filters,
    visitorStats,
}: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const { operations, retryOperation, isSyncing, syncNow } = useSyncStatus();

    const initialTab = (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null) === 'history' ? 'history' : 'upcoming';

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const [searchQuery, setSearchQuery] = useState(
        activeTab === 'upcoming' ? (filters?.search_upcoming ?? '') : (filters?.search_history ?? ''),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateSheet, setShowCreateSheet] = useState(false);
    const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Revoke modal state
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<AccessCode | null>(null);
    const [revoking, setRevoking] = useState(false);

    // Immediate next visitor
    const nextVisitor = upcomingTimeline.length > 0 ? upcomingTimeline[0] : null;

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

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'upcoming', label: 'Agenda', count: upcomingTimeline.length },
        { id: 'history', label: 'History', count: historyTimeline.length },
    ];

    return (
        <>
            <Head title="Visitor Agenda" />

            <div className="mx-auto max-w-2xl space-y-4 pb-24 px-1">
                {/* Clean Header */}
                <div className="flex items-center justify-between pt-1">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Visitor Agenda
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">
                            Personal timeline of scheduled visits
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateSheet(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-98 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        New Visitor
                    </button>
                </div>

                {/* Next Visitor Hero Card */}
                {activeTab === 'upcoming' && (
                    <NextVisitorHero
                        nextCode={nextVisitor}
                        totalExpectedToday={visitorStats.expected_today}
                    />
                )}

                {/* Segmented Navigation & Search */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 pt-1">
                    <div className="flex items-center gap-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                className={`relative py-1 text-xs font-bold transition-colors cursor-pointer ${
                                    activeTab === tab.id
                                        ? 'text-slate-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {tab.label}
                                    <span
                                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                                            activeTab === tab.id
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'bg-slate-50 text-slate-400'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </span>

                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="plannerTabUnderline"
                                        className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-slate-900 rounded-full"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Calendar tab placeholder */}
                    <button
                        disabled
                        title="Calendar view — coming soon"
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-300 cursor-not-allowed select-none"
                    >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Calendar</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-400">
                            soon
                        </span>
                    </button>
                </div>

                {/* Offline Pending Passes */}
                {pendingPasses.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
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

                        <div className="rounded-xl border border-amber-100 bg-white divide-y divide-slate-50 shadow-xs overflow-hidden">
                            {pendingPasses.map((pass) => {
                                const badge = pendingBadge(pass.status);
                                return (
                                    <div key={pass.id} className="flex items-start gap-3 px-3 py-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-900">
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
                    </section>
                )}

                {/* Quick Search */}
                <SearchInput
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={
                        activeTab === 'upcoming'
                            ? 'Search upcoming visits...'
                            : 'Search history by visitor or code...'
                    }
                    isLoading={isLoading}
                />

                {/* Flowing Agenda Timeline */}
                <AnimatePresence mode="wait">
                    {activeTab === 'upcoming' && (
                        <motion.div
                            key="upcoming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                        >
                            <VisitorTimeline
                                codes={upcomingTimeline}
                                variant="upcoming"
                                alwaysShowToday
                                getCardHref={(code) => `${resident.visitors.show.url(code.id)}?from_tab=upcoming`}
                                renderCardActions={(code) =>
                                    code.status === 'active' || code.status === 'scheduled' ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openRevokeModal(code);
                                            }}
                                            className="rounded-lg px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                        >
                            <VisitorTimeline
                                codes={historyTimeline}
                                variant="history"
                                getCardHref={(code) => `${resident.visitors.show.url(code.id)}?from_tab=history`}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Creation Sheet */}
            <MobileSheet
                isOpen={showCreateSheet}
                onClose={() => setShowCreateSheet(false)}
                title="Create Visitor Pass"
            >
                <div className="space-y-3 pb-8">
                    <p className="mb-2 px-1 text-xs font-medium text-slate-500">
                        Select a pass type to continue.
                    </p>

                    <Link
                        href="/resident/visitors/create?type=single_use"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80 active:scale-99"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">One-Time Pass</h4>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                                Single entry for guests, deliveries, or contractors.
                            </p>
                        </div>
                    </Link>

                    {!isHouseholdMember && (
                        <Link
                            href="/resident/visitors/create?type=long_lived"
                            onClick={() => setShowCreateSheet(false)}
                            className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80 active:scale-99"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Long-Term Pass</h4>
                                <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                                    Recurring pass for family, domestic staff, or regulars.
                                </p>
                            </div>
                        </Link>
                    )}

                    <Link
                        href="/resident/visitors/create?type=event"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80 active:scale-99"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">Event Pass</h4>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                                Shared access pass for multiple event guests.
                            </p>
                        </div>
                    </Link>
                </div>
            </MobileSheet>

            {/* Revoke Modal */}
            <ConfirmationModal
                isOpen={revokeModalOpen}
                onClose={() => setRevokeModalOpen(false)}
                onConfirm={handleConfirmRevoke}
                title="Cancel Visitor Pass"
                message={`Are you sure you want to cancel the pass for ${
                    codeToRevoke?.visitor_name || 'this visitor'
                }?`}
                confirmLabel="Cancel Pass"
                type="danger"
                isLoading={revoking}
            />
        </>
    );
}

Visitors.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
