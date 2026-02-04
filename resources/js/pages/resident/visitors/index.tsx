import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { AccessCode } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';
import ConfirmationModal from '@/components/ConfirmationModal';
import SearchInput from '@/components/SearchInput';
import DailyLimitCard from './components/DailyLimitCard';
import CodeCard from './components/CodeCard';

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
};

type Tab = 'active' | 'long_lived' | 'history';

export default function Visitors({ activeCodes, historyCodes, filters, dailyUsage }: Props) {
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
        <ResidentLayout>
            <Head title="Visitors" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Visitors</h1>
                <p className="mt-1 text-gray-500">Manage your access codes</p>
            </motion.div>

            {/* Daily Limit Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.02 }}>
                <DailyLimitCard used={dailyUsage.used} limit={dailyUsage.limit} />
            </motion.div>

            {/* Search Code */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }} className="mb-4">
                <SearchInput
                    value={queries[activeTab]}
                    onChange={handleSearch}
                    placeholder={`Search ${activeTab === 'history' ? 'history' : 'active codes'}...`}
                    isLoading={isLoading}
                />
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-6">
                <div className="flex w-full rounded-2xl bg-gray-100 p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                    {[
                        { id: 'active' as const, label: 'Active', count: oneTimeCodes.length },
                        { id: 'long_lived' as const, label: 'Long Term', count: longLivedCodes.length },
                        { id: 'history' as const, label: 'History' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                                            activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Code List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <AnimatePresence mode="wait">
                    {currentCodes.length > 0 ? (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm"
                        >
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-1 font-medium text-gray-900">{activeTab === 'active' ? 'No active codes' : 'No history yet'}</h3>
                            <p className="mb-5 text-sm text-gray-500">
                                {activeTab === 'active' ? 'Create a code for your next visitor' : 'Your visitor history will appear here'}
                            </p>
                            {activeTab === 'active' && (
                                <Link
                                    href="/resident/visitors/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Create Code
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Floating Action Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="fixed right-4 bottom-24 z-30"
            >
                <Link
                    href="/resident/visitors/create"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Link>
            </motion.div>

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
        </ResidentLayout>
    );
}
