import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import MobileSheet from '@/Components/MobileSheet';
import ContextBanner from '@/Components/Visitors/ContextBanner';
import HistoryArchive from '@/Components/Visitors/HistoryArchive';
import NextVisitorHero from '@/Components/Visitors/NextVisitorHero';
import QuickActions from '@/Components/Visitors/QuickActions';
import TodaySchedule from '@/Components/Visitors/TodaySchedule';
import UpcomingSchedule from '@/Components/Visitors/UpcomingSchedule';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingPass, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';

type RecentVisitor = {
    visitor_name: string;
    visitor_phone: string | null;
    purpose: string | null;
    type: string;
};

type Props = {
    upcomingTimeline: AccessCode[];
    historyTimeline: AccessCode[];
    recentVisitors?: RecentVisitor[];
    filters: {
        search_upcoming?: string;
        search_history?: string;
    };
    accessCodesEnabled?: boolean;
};

type Tab = 'schedule' | 'history';

function pendingBadge(status: SyncStatus): { label: string; className: string } {
    switch (status) {
        case SyncStatus.Failed:
        case SyncStatus.Conflict:
            return {
                label: status === SyncStatus.Conflict ? 'Conflict' : 'Sync failed - tap to retry',
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

export default function Visitors({ upcomingTimeline, historyTimeline, recentVisitors = [], accessCodesEnabled = true }: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const { operations, retryOperation, isSyncing, syncNow } = useSyncStatus();

    const initialTab =
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null) === 'history' ? 'history' : 'schedule';

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Offline pending passes
    const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    const loadPendingPasses = useCallback(async () => {
        try {
            const passes = await ResidentStore.getPendingPasses();
            setPendingPasses(passes);
        } catch {
            // IndexDB unsupported fallback
        }
    }, []);

    useEffect(() => {
        loadPendingPasses();
    }, [loadPendingPasses]);

    const handleRetry = async (pass: PendingPass) => {
        setRetryingId(pass.id);
        try {
            const matchingOp = operations.find((op) => op.payload && (op.payload as any).uuid === pass.id);
            if (matchingOp) {
                await retryOperation(matchingOp.id);
            } else {
                await syncNow();
            }
            await loadPendingPasses();
        } finally {
            setRetryingId(null);
        }
    };

    // Modals & Creation Sheet State
    const [showCreateSheet, setShowCreateSheet] = useState(false);
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<{ id: number; visitor_name?: string | null } | null>(null);
    const [revoking, setRevoking] = useState(false);

    const promptCancelPass = (id: number) => {
        const item = upcomingTimeline.find((code) => code.id === id);
        setCodeToRevoke({ id, visitor_name: item?.visitor_name ?? null });
        setRevokeModalOpen(true);
    };

    const handleConfirmRevoke = () => {
        if (!codeToRevoke) return;
        setRevoking(true);
        router.delete(resident.visitors.destroy.url(codeToRevoke.id), {
            onSuccess: () => {
                setRevokeModalOpen(false);
                setCodeToRevoke(null);
            },
            onFinish: () => setRevoking(false),
        });
    };

    const handleInviteAgain = (v: RecentVisitor) => {
        router.get('/resident/visitors/create', {
            type: v.type || 'single_use',
            visitor_name: v.visitor_name,
            visitor_phone: v.visitor_phone || '',
            purpose: v.purpose || '',
        });
    };

    // Filter today's vs future upcoming visits
    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisits = upcomingTimeline.filter((v: any) => v.arrival_date === todayStr);
    const futureUpcomingVisits = upcomingTimeline.filter((v: any) => v.arrival_date !== todayStr);

    return (
        <>
            <Head title="Visitors" />

            <div className="mx-auto max-w-xl space-y-4 px-2 py-3 pb-20">
                {!accessCodesEnabled && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900 shadow-xs">
                        Visitor access pass generation and code sharing are currently disabled by estate management policy.
                    </div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between pt-1 pb-1">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Visitors</h1>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href={resident.visitors.calendar.url()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                        >
                            <Calendar className="h-4 w-4 text-primary-600" />
                            <span>Calendar</span>
                        </Link>
                        {accessCodesEnabled && (
                            <button
                                onClick={() => setShowCreateSheet(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Invite</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Animated Segmented View Switcher */}
                <div className="relative flex rounded-xl bg-slate-100/90 p-1 font-semibold">
                    <button
                        onClick={() => switchTab('schedule')}
                        className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors duration-200 ${
                            activeTab === 'schedule' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {activeTab === 'schedule' && (
                            <motion.div
                                layoutId="activeTabPill"
                                className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">Schedule</span>
                    </button>

                    <button
                        onClick={() => switchTab('history')}
                        className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors duration-200 ${
                            activeTab === 'history' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {activeTab === 'history' && (
                            <motion.div
                                layoutId="activeTabPill"
                                className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">Archive</span>
                    </button>
                </div>

                {/* Pending Offline Passes Banner */}
                {pendingPasses.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                            <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>{pendingPasses.length} pass(es) pending sync</span>
                        </div>
                        <div className="mt-2 space-y-1.5">
                            {pendingPasses.map((pass) => {
                                const matchingOp = operations.find(
                                    (op) => op.payload && ((op.payload as any).uuid === pass.id || (op.payload as any).id === pass.id),
                                );
                                const status = matchingOp ? matchingOp.status : SyncStatus.Pending;
                                const badge = pendingBadge(status);

                                return (
                                    <div
                                        key={pass.id}
                                        className="flex items-center justify-between rounded-lg border border-amber-100 bg-white/80 p-2"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900">{pass.visitor_name || 'Guest Pass'}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {pass.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                            <button
                                                onClick={() => handleRetry(pass)}
                                                disabled={retryingId === pass.id || isSyncing}
                                                className="rounded-md bg-amber-100 p-1 text-amber-800 hover:bg-amber-200"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${retryingId === pass.id ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab Views Animated Transition Container */}
                <AnimatePresence mode="wait">
                    {activeTab === 'schedule' ? (
                        <motion.div
                            key="schedule"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="space-y-2"
                        >
                            {/* 1. Adaptive Context */}
                            <ContextBanner upcoming={upcomingTimeline as any} />

                            {/* 2. Next Arrival Hero */}
                            <NextVisitorHero nextCode={upcomingTimeline[0] || null} />

                            {/* 3. Today's Schedule */}
                            <TodaySchedule visits={todayVisits as any} onCancel={promptCancelPass} />

                            {/* 4. Upcoming (Event-based) */}
                            <UpcomingSchedule visits={futureUpcomingVisits as any} />

                            {/* 5. Quick Actions & Invite Again */}
                            <QuickActions
                                recentVisitors={recentVisitors}
                                onInvite={() => setShowCreateSheet(true)}
                                onInviteAgain={handleInviteAgain}
                                onOpenSearch={() => switchTab('history')}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <HistoryArchive
                                historyTimeline={historyTimeline as any}
                                recentVisitors={recentVisitors}
                                onInviteAgain={handleInviteAgain}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pass Creation Sheet */}
            <MobileSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="Create Visitor Pass">
                <div className="space-y-3 pb-8">
                    <p className="mb-2 px-1 text-xs font-medium text-slate-500">Select a pass type to continue.</p>

                    <Link
                        href="/resident/visitors/create?type=single_use"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">One-Time Pass</h4>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">Single entry for guests, deliveries, or contractors.</p>
                        </div>
                    </Link>

                    {!isHouseholdMember && (
                        <Link
                            href="/resident/visitors/create?type=long_lived"
                            onClick={() => setShowCreateSheet(false)}
                            className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Long-Term Pass</h4>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    Recurring pass for family, domestic staff, or regulars.
                                </p>
                            </div>
                        </Link>
                    )}

                    <Link
                        href="/resident/visitors/create?type=event"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">Event Pass</h4>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">Shared access pass for multiple event guests.</p>
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
                message={`Are you sure you want to cancel the pass for ${codeToRevoke?.visitor_name || 'this visitor'}?`}
                confirmLabel="Cancel Pass"
                type="danger"
                isLoading={revoking}
            />
        </>
    );
}

Visitors.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
