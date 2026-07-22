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
};

type Tab = 'schedule' | 'history';

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
    recentVisitors = [],
}: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const { operations, retryOperation, isSyncing, syncNow } = useSyncStatus();

    const initialTab = (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null) === 'history' ? 'history' : 'schedule';

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
            const matchingOp = operations.find(
                (op) => op.payload && (op.payload as any).uuid === pass.uuid,
            );
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
    const [codeToRevoke, setCodeToRevoke] = useState<{ id: number; visitor_name?: string } | null>(null);
    const [revoking, setRevoking] = useState(false);

    const promptCancelPass = (id: number) => {
        const item = upcomingTimeline.find((code) => code.id === id);
        setCodeToRevoke({ id, visitor_name: item?.visitor_name });
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

            <div className="mx-auto max-w-xl px-3.5 py-3 space-y-2 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">Visitors</h1>
                    </div>
                    <button
                        onClick={() => setShowCreateSheet(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Invite</span>
                    </button>
                </div>

                {/* Segmented View Switcher */}
                <div className="flex rounded-lg bg-slate-100/80 p-0.5 font-semibold">
                    <button
                        onClick={() => switchTab('schedule')}
                        className={`flex-1 rounded-md py-1 text-xs transition ${
                            activeTab === 'schedule'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Schedule
                    </button>
                    <button
                        onClick={() => switchTab('history')}
                        className={`flex-1 rounded-md py-1 text-xs transition ${
                            activeTab === 'history'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Archive
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
                                    (op) => op.payload && (op.payload as any).uuid === pass.uuid,
                                );
                                const status = matchingOp ? matchingOp.status : SyncStatus.Pending;
                                const badge = pendingBadge(status);

                                return (
                                    <div
                                        key={pass.id}
                                        className="flex items-center justify-between rounded-lg bg-white/80 p-2 border border-amber-100"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900">{pass.visitor_name || 'Guest Pass'}</p>
                                            <p className="text-[10px] text-slate-500">{pass.type}</p>
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

                {/* Schedule View — natural flow */}
                {activeTab === 'schedule' && (
                    <div className="space-y-2">
                        {/* 1. Adaptive Context */}
                        <ContextBanner upcoming={upcomingTimeline as any} />

                        {/* 2. Next Arrival Hero */}
                        <NextVisitorHero nextCode={upcomingTimeline[0] || null} />

                        {/* 3. Today's Schedule */}
                        <TodaySchedule
                            visits={todayVisits as any}
                            onCancel={promptCancelPass}
                        />

                        {/* 4. Upcoming (Event-based, replacing week chart) */}
                        <UpcomingSchedule visits={futureUpcomingVisits as any} />

                        {/* 5. Quick Actions & Invite Again */}
                        <QuickActions
                            recentVisitors={recentVisitors}
                            onInvite={() => setShowCreateSheet(true)}
                            onInviteAgain={handleInviteAgain}
                            onOpenSearch={() => switchTab('history')}
                        />
                    </div>
                )}

                {/* History Archive View */}
                {activeTab === 'history' && (
                    <HistoryArchive
                        historyTimeline={historyTimeline as any}
                        recentVisitors={recentVisitors}
                        onInviteAgain={handleInviteAgain}
                    />
                )}
            </div>

            {/* Pass Creation Sheet */}
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
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
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
                            className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
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
                        className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-100/80"
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
