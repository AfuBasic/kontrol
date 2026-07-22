import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Calendar, Tag, Users, PlusCircle, CheckCircle2, XCircle, History as HistoryIcon, Activity, Plus, Search, Filter, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import MobileSheet from '@/Components/MobileSheet';
import SearchInput from '@/Components/SearchInput';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingPass, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';
import CodeCard from './Components/CodeCard';

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

export default function Visitors({ activeCodes, historyCodes, filters, recentActivity, visitorStats }: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const { operations, retryOperation, isSyncing, syncNow } = useSyncStatus();

    const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'history'>('active');
    const [searchQuery, setSearchQuery] = useState(filters?.search_history || '');
    const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'expired' | 'revoked'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateSheet, setShowCreateSheet] = useState(false);
    const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const refreshPending = useCallback(async () => {
        try {
            const stored = await ResidentStore.getPendingPasses();
            // Merge live engine status onto stored optimistic passes.
            const merged = stored.map((pass) => {
                const op = operations.find((o) => o.id === pass.id);
                if (!op) {
                    return pass;
                }
                return {
                    ...pass,
                    status: op.status,
                    error: op.lastError ?? pass.error,
                };
            });
            setPendingPasses(merged.filter((p) => p.status !== SyncStatus.Synced));

            // Drop synced locals and refresh list once engine finishes.
            const syncedIds = stored.filter((p) => {
                const op = operations.find((o) => o.id === p.id);
                return op?.status === SyncStatus.Synced;
            });
            if (syncedIds.length > 0) {
                await Promise.all(syncedIds.map((p) => ResidentStore.removePendingPass(p.id)));
                router.reload({ only: ['activeCodes', 'historyCodes', 'visitorStats'] });
            }
        } catch {
            setPendingPasses([]);
        }
    }, [operations]);

    useEffect(() => {
        void refreshPending();
    }, [refreshPending]);

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

    // Helper to resolve effective status
    const getEffectiveStatus = (code: AccessCode) => {
        const now = new Date();
        const isExpired = code.expires_at ? new Date(code.expires_at) < now : false;
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;

        let tempStatus = code.status;
        if (code.status === 'scheduled' && !isFuture) {
            tempStatus = 'active';
        } else if (code.status === 'active' && isFuture) {
            tempStatus = 'scheduled';
        }

        return tempStatus === 'active' && isExpired ? 'expired' : tempStatus;
    };

    // Filter Active vs Scheduled Passes
    const now = new Date();
    const activePasses = activeCodes.filter((code) => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        const isExpired = code.expires_at ? new Date(code.expires_at) < now : false;
        return !isFuture && !isExpired && code.status !== 'revoked' && code.status !== 'used';
    });

    const upcomingPasses = activeCodes.filter((code) => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        const isExpired = code.expires_at ? new Date(code.expires_at) < now : false;
        return isFuture && !isExpired && code.status !== 'revoked' && code.status !== 'used';
    });

    // Frontend filtering for history passes by effective status
    const filteredHistoryCodes = historyCodes.filter((code) => {
        if (statusFilter === 'all') return true;
        const effStatus = getEffectiveStatus(code);
        return effStatus === statusFilter;
    });

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

    const groupedHistory = groupCodesByMonth(filteredHistoryCodes);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.04 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
    };

    return (
        <>
            <Head title="Visitor Access" />

            <div className="mx-auto max-w-3xl space-y-5 pb-24">
                {/* 1. HEADER */}
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 px-1">Visitor Passes</h1>
                </div>

                {/* 2. VISITOR HUB HERO */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, type: 'spring' }}
                    className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-slate-900 to-indigo-950 p-5.5 text-white shadow-md shadow-indigo-950/10"
                >
                    <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative z-10 max-w-md space-y-1.5">
                        <span className="text-[9px] font-bold tracking-widest text-indigo-300 uppercase">Visitor Command Center</span>
                        <h2 className="text-lg font-bold tracking-tight sm:text-xl">Invite guests, workers, or events</h2>
                        <p className="text-[11px] font-medium leading-relaxed text-indigo-100/70">
                            Generate secure digital access codes for one-time guests, long-term workers, or whole event lists instantly.
                        </p>
                    </div>
                </motion.div>

                {/* 3. TABS (Segmented Control style - Native Mobile-ish) */}
                <div className="bg-slate-100/80 p-0.5 rounded-xl flex relative">
                    {(['active', 'upcoming', 'history'] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        const count = 
                            tab === 'active' 
                                ? activePasses.length 
                                : tab === 'upcoming' 
                                ? upcomingPasses.length 
                                : historyCodes.length;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative flex-grow flex-1 py-2.5 text-xs font-semibold text-center transition-colors select-none cursor-pointer capitalize ${
                                    isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-1.5">
                                    {tab}
                                    <span className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full font-medium ${
                                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileSegmentedIndicator"
                                        className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Offline pending passes */}
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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {pendingPasses.map((pass) => {
                                const badge = pendingBadge(pass.status);
                                return (
                                    <div
                                        key={pass.id}
                                        className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm ring-1 ring-amber-50"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900">
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
                                        {(pass.status === SyncStatus.Failed || pass.status === SyncStatus.Conflict) && (
                                            <button
                                                type="button"
                                                onClick={() => void retryOperation(pass.id)}
                                                className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white"
                                            >
                                                Retry sync
                                            </button>
                                        )}
                                        {pass.error && (
                                            <p className="mt-2 text-[11px] leading-snug text-rose-600">{pass.error}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 4. CONTENT AREA */}
                <AnimatePresence mode="wait">
                    {activeTab === 'active' && (
                        <motion.div
                            key="active-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {activePasses.length > 0 ? (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                                >
                                    {activePasses.map((code) => (
                                        <motion.div key={code.id} variants={itemVariants}>
                                            <CodeCard code={code} showActions={code.status === 'active'} onRevoke={openRevokeModal} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : pendingPasses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">No Active Visitor Passes</h3>
                                    <p className="mt-1 max-w-xs text-xs leading-normal text-slate-400">
                                        Create a visitor pass for family, friends, deliveries, or service providers.
                                    </p>
                                </div>
                            ) : null}
                        </motion.div>
                    )}

                    {activeTab === 'upcoming' && (
                        <motion.div
                            key="upcoming-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {upcomingPasses.length > 0 ? (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                                >
                                    {upcomingPasses.map((code) => (
                                        <motion.div key={code.id} variants={itemVariants}>
                                            <CodeCard code={code} showActions={code.status === 'active'} onRevoke={openRevokeModal} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">No Upcoming Visitor Passes</h3>
                                    <p className="mt-1 max-w-xs text-xs leading-normal text-slate-400">
                                        Schedule a visitor pass for family, friends, deliveries, or service providers in the future.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {/* Search and Filters */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                    <SearchInput
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        placeholder="Search history by visitor or code..."
                                        isLoading={isLoading}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                    {(['all', 'used', 'expired', 'revoked'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setStatusFilter(filter)}
                                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                                                statusFilter === filter
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {filter === 'all' ? 'All Status' : filter === 'used' ? 'Completed' : filter === 'revoked' ? 'Cancelled' : 'Expired'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Grouped History */}
                            {filteredHistoryCodes.length > 0 ? (
                                <div className="space-y-6">
                                    {Object.keys(groupedHistory).map((month) => (
                                        <div key={month} className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-1">
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
                                </div>
                            ) : (
                                <div className="py-12 text-center rounded-2xl border border-slate-100 bg-white">
                                    <p className="text-xs font-medium text-slate-400">
                                        {searchQuery ? 'No matching history found.' : 'No older passes in your history.'}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button (FAB) - Hidden on Mobile to avoid layout overlap with sticky bar */}
            <div className="fixed bottom-6 right-6 z-40 hidden md:block">
                <button
                    onClick={() => setShowCreateSheet(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                    title="Create Pass"
                >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                </button>
            </div>

            {/* A. UNIFIED PASS CREATION DRAWER */}
            <MobileSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="What kind of access do you need?">
                <div className="space-y-3 pb-8">
                    <p className="mb-2 px-1 text-xs font-semibold text-slate-450">Select a pass type to continue with invitation code generation.</p>

                    {/* One-Time Pass */}
                    <Link
                        href="/resident/visitors/create?type=single_use"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                            <Tag className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-tight text-slate-900">One-Time Pass</h4>
                            <p className="mt-0.5 text-[11px] leading-normal font-medium text-slate-400">
                                Perfect for a single visitor, delivery driver, or utility pickup. Valid for one entry.
                            </p>
                        </div>
                    </Link>

                    {/* Long-Term Pass */}
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

                    {/* Event Pass */}
                    <Link
                        href="/resident/visitors/create?type=event"
                        onClick={() => setShowCreateSheet(false)}
                        className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 active:scale-99"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                            <Users className="h-4.5 w-4.5" />
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
