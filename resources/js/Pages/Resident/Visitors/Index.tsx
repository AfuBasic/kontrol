import { Head, router, usePage, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    User, 
    Clock, 
    Calendar, 
    Tag, 
    Users, 
    PlusCircle, 
    Search, 
    CheckCircle2, 
    XCircle, 
    Trash2, 
    History as HistoryIcon,
    ArrowRight,
    Activity
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import SearchInput from '@/Components/SearchInput';
import ResidentLayout from '@/Layouts/ResidentLayout';
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

export default function Visitors({ activeCodes, historyCodes, filters, recentActivity }: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    // Search State for History
    const [searchQuery, setSearchQuery] = useState(filters?.search_history || '');
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        setIsLoading(true);
        debounceTimeout.current = setTimeout(() => {
            router.get(resident.visitors.index.url(), {
                search_history: query,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['historyCodes', 'filters'],
                onFinish: () => setIsLoading(false),
            });
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
    const activePasses = activeCodes.filter(code => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        return !isFuture;
    });

    const scheduledPasses = activeCodes.filter(code => {
        const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;
        return isFuture;
    });

    // Helper to render activity icon
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'created':
                return <PlusCircle className="h-5 w-5 text-indigo-650" />;
            case 'used':
                return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
            case 'expired':
                return <Clock className="h-5 w-5 text-amber-500" />;
            case 'revoked':
                return <XCircle className="h-5 w-5 text-rose-500" />;
            default:
                return <Activity className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <>
            <Head title="Visitor Access" />

            <div className="space-y-10 pb-32">
                {/* 1. HEADER */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.4 }}
                    className="flex flex-col"
                >
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Visitor Access</h1>
                    <p className="mt-1.5 text-sm font-bold text-slate-400 leading-normal">
                        Manage visitor access and track arrivals.
                    </p>
                </motion.div>

                {/* 2. QUICK ACTIONS */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Generate Passes</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* One-Time */}
                        <Link
                            href="/resident/visitors/create?type=single_use"
                            className="group flex items-start gap-4 rounded-3xl bg-white p-5 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 hover:shadow-lg hover:border-indigo-200/60"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                                <Tag className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm tracking-tight">One-Time Pass</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 leading-normal">Perfect for a single visitor.</p>
                            </div>
                        </Link>

                        {/* Long-Term */}
                        {!isHouseholdMember && (
                            <Link
                                href="/resident/visitors/create?type=long_lived"
                                className="group flex items-start gap-4 rounded-3xl bg-white p-5 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 hover:shadow-lg hover:border-indigo-200/60"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm tracking-tight">Long-Term Pass</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 leading-normal">For recurring visitors.</p>
                                </div>
                            </Link>
                        )}

                        {/* Event Pass */}
                        <Link
                            href="/resident/visitors/create?type=event"
                            className="group flex items-start gap-4 rounded-3xl bg-white p-5 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 hover:shadow-lg hover:border-indigo-200/60"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm tracking-tight">Event Pass</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 leading-normal">One pass for many guests.</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 3. ACTIVE PASSES */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Currently Active</h2>
                    {activePasses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {activePasses.map((code) => (
                                <CodeCard
                                    key={code.id}
                                    code={code}
                                    showActions={code.status === 'active'}
                                    onRevoke={openRevokeModal}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[36px] bg-white border border-slate-200/80 px-8 py-14 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-350 border border-slate-100 mb-5">
                                <Tag className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">No Active Passes</h3>
                            <p className="mt-2 max-w-xs text-xs font-bold text-slate-400 leading-relaxed">
                                Create a pass to allow guests into your estate.
                            </p>
                            <Link
                                href="/resident/visitors/create"
                                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black text-white shadow-xl shadow-indigo-500/10 hover:bg-indigo-700 active:scale-95 transition-all"
                            >
                                <PlusCircle className="h-4.5 w-4.5" />
                                Create Pass
                            </Link>
                        </div>
                    )}
                </div>

                {/* 4. SCHEDULED PASSES */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Scheduled Passes</h2>
                    {scheduledPasses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {scheduledPasses.map((code) => (
                                <CodeCard
                                    key={code.id}
                                    code={code}
                                    showActions={false}
                                    onRevoke={openRevokeModal}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[28px] border-2 border-dashed border-slate-200 p-6 text-center bg-slate-50/10">
                            <p className="text-xs font-bold text-slate-400">No upcoming visitor passes scheduled.</p>
                        </div>
                    )}
                </div>

                {/* 5. RECENT VISITOR ACTIVITY */}
                {recentActivity && recentActivity.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Recent Activity</h2>
                        <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
                            {recentActivity.slice(0, 5).map((activity, i) => (
                                <div key={i} className="flex gap-4 items-start relative">
                                    {i < Math.min(recentActivity.length, 5) - 1 && (
                                        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-slate-100" />
                                    )}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <p className="text-xs font-extrabold text-slate-800 leading-normal">{activity.message}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. HISTORY */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Visitor History</h2>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <HistoryIcon className="h-4 w-4" />
                            Archive
                        </span>
                    </div>

                    <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
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
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                                >
                                    {historyCodes.map((code) => (
                                        <CodeCard
                                            key={code.id}
                                            code={code}
                                            showActions={false}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-xs font-bold text-slate-400">
                                        {searchQuery ? 'No matching history found.' : 'No older passes in your history.'}
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

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
