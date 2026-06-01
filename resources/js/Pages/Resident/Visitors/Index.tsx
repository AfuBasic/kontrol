import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, User, Clock as ClockIcon, Search, History as HistoryIcon, Calendar, Activity } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import SearchInput from '@/Components/SearchInput';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';
import CodeCard from './Components/CodeCard';
import SummaryDashboard from './Components/SummaryDashboard';

type Props = {
    activeCodes: AccessCode[];
    historyCodes: AccessCode[];
    filters: {
        search_active?: string;
        search_history?: string;
    };
    dailyUsage: {
        used: number;
        limit: number | null;
    };
    visitorStats: {
        active_codes: number;
        created_today: number;
        visitors_today: number;
        expected_today: number;
    };
};

type Tab = 'active' | 'long_lived' | 'history';

export default function Visitors({ activeCodes, historyCodes, filters, dailyUsage, visitorStats }: Props) {
    const userRoles: string[] = (usePage().props as any).auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const [activeTab, setActiveTab] = useState<Tab>('active');

    // Search State
    const [queries, setQueries] = useState({
        active: filters?.search_active || '',
        long_lived: filters?.search_active || '',
        history: filters?.search_history || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = (query: string) => {
        setQueries((prev) => ({ ...prev, [activeTab]: query }));

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        setIsLoading(true);
        debounceTimeout.current = setTimeout(() => {
            const params: any = {};

            if (activeTab === 'active' || activeTab === 'long_lived') {
                params.search_active = query;
                if (filters?.search_history) params.search_history = filters.search_history;
            } else {
                params.search_history = query;
                if (filters?.search_active) params.search_active = filters.search_active;
            }

            // Sync long_lived and active if they share the same backend filter
            if (activeTab === 'active') {
                setQueries((prev) => ({ ...prev, long_lived: query }));
            } else if (activeTab === 'long_lived') {
                setQueries((prev) => ({ ...prev, active: query }));
            }

            router.get(resident.visitors.index.url(), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: activeTab === 'history' ? ['historyCodes', 'filters'] : ['activeCodes', 'filters'],
                onFinish: () => setIsLoading(false),
            });
        }, 300);
    };

    // Update local state if URL filters change externally
    useEffect(() => {
        setQueries((prev) => ({
            ...prev,
            active: filters?.search_active || prev.active,
            long_lived: filters?.search_active || prev.active, // Sync using active filter
            history: filters?.search_history || prev.history,
        }));
    }, [filters]);

    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<AccessCode | null>(null);
    const [revoking, setRevoking] = useState(false);

    const oneTimeCodes = activeCodes.filter((code) => code.type === 'single_use');
    const longLivedCodes = activeCodes.filter((code) => code.type === 'long_lived');

    const currentCodes = activeTab === 'active' ? oneTimeCodes : activeTab === 'long_lived' ? longLivedCodes : historyCodes;

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

    return (
        <>
            <Head title="Visitors" />

            {/* 1. TOP SUMMARY */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Live Operations</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Access Control</h1>
                    <p className="mt-1 text-sm font-bold text-slate-400">Manage community flow and visitor permissions</p>
                </div>
                <SummaryDashboard
                    activeCount={visitorStats.visitors_today}
                    expectedToday={visitorStats.expected_today}
                    totalToday={dailyUsage.used}
                />
            </motion.div>

            {/* 2. TABS & SEARCH */}
            <div className="sticky top-0 z-30 -mx-4 bg-slate-50/80 px-4 pb-4 backdrop-blur-md">
                <div className="flex gap-2 rounded-[28px] bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
                    {[
                        { id: 'active' as const, label: 'Active', icon: ClockIcon },
                        ...(!isHouseholdMember ? [{ id: 'long_lived' as const, label: 'Long Term', icon: Calendar }] : []),
                        { id: 'history' as const, label: 'History', icon: HistoryIcon },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-[22px] py-3 text-[10px] font-black transition-all ${
                                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeVisitorTab"
                                        className="absolute inset-[2px] rounded-[20px] bg-slate-50 shadow-sm ring-1 ring-slate-200/50"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className="relative z-10 h-3.5 w-3.5" strokeWidth={3} />
                                <span className="relative z-10 tracking-widest whitespace-nowrap uppercase">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4">
                    <SearchInput
                        value={queries[activeTab]}
                        onChange={handleSearch}
                        placeholder={`Search ${activeTab.replace('_', ' ')} codes...`}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* 3. CODE LIST */}
            <div className="mt-4 pb-32">
                <AnimatePresence mode="wait">
                    {currentCodes.length > 0 ? (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            {currentCodes.map((code, index) => (
                                <motion.div
                                    key={code.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <CodeCard
                                        code={code}
                                        showActions={activeTab !== 'history' && code.status === 'active'}
                                        onRevoke={openRevokeModal}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center rounded-[40px] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/10 blur-3xl" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                                    <User className="h-12 w-12" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                {activeTab === 'active' ? "You're all clear" : 'No history yet'}
                            </h3>
                            <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed font-bold text-slate-400">
                                {activeTab === 'active'
                                    ? 'No active visitors right now. Everything is quiet at the gate.'
                                    : 'Your visitor activity and history will appear here once you start generating codes.'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
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
