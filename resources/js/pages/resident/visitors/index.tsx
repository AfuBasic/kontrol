import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { AccessCode } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';
import ConfirmationModal from '@/components/ConfirmationModal';

type Props = {
    activeCodes: AccessCode[];
    historyCodes: AccessCode[];
    dailyUsage: {
        used: number;
        limit: number | null;
    };
};

type Tab = 'active' | 'history';

function DailyLimitCard({ used, limit }: { used: number; limit: number | null }) {
    const isUnlimited = limit === null;
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= limit;

    return (
        <div className="mb-6 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Daily Generation Limit</h3>
                    <p className="text-xs text-gray-500">
                        {isUnlimited ? (
                            <span>
                                You have generated <span className="font-medium text-gray-900">{used}</span> codes today
                            </span>
                        ) : (
                            <span>
                                You have generated <span className="font-medium text-gray-900">{used}</span> of{' '}
                                <span className="font-medium text-gray-900">{limit}</span> codes today
                            </span>
                        )}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isAtLimit ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                    }`}
                >
                    {isUnlimited ? <span className="text-xl font-bold">∞</span> : <span className="text-sm font-bold">{limit - used}</span>}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`absolute inset-y-0 left-0 rounded-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                />
            </div>

            {isAtLimit && <p className="mt-2 text-xs font-medium text-red-600">You have reached your daily limit. Please try again tomorrow.</p>}
        </div>
    );
}

function getStatusBadge(status: AccessCode['status']) {
    switch (status) {
        case 'active':
            return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>;
        case 'used':
            return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Arrived</span>;
        case 'expired':
            return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Expired</span>;
        case 'revoked':
            return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Revoked</span>;
    }
}

function CodeCard({ code, showActions = false, onRevoke }: { code: AccessCode; showActions?: boolean; onRevoke?: (code: AccessCode) => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const [copying, setCopying] = useState(false);

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(code.code);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code.code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        }
    }

    function handleRevoke() {
        if (onRevoke) {
            onRevoke(code);
        }
        setShowMenu(false);
    }

    return (
        <motion.div
            layout
            className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            code.status === 'active' ? 'bg-emerald-50' : code.status === 'used' ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                    >
                        {code.status === 'active' ? (
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        ) : code.status === 'used' ? (
                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        )}
                    </div>
                    <Link href={resident.visitors.show.url(code.id)} className="group">
                        <div>
                            <p className="font-medium text-gray-900 transition-colors group-hover:text-indigo-600">
                                {code.visitor_name || 'Visitor'}
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-lg font-semibold tracking-wider text-gray-700 transition-colors group-hover:text-indigo-600">
                                    {code.code}
                                </p>
                                {getStatusBadge(code.status)}
                                {code.type === 'long_lived' && (
                                    <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        Long-lived
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
                {showActions && code.status === 'active' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                                />
                            </svg>
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-xl border border-gray-100 bg-white p-1 shadow-lg"
                                    >
                                        <button
                                            onClick={() => {
                                                copyCode();
                                                setShowMenu(false);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                                />
                                            </svg>
                                            Copy
                                        </button>
                                        <button
                                            onClick={handleRevoke}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                            Revoke
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {code.status === 'active' && (
                    <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {code.time_remaining}
                    </span>
                )}
                {code.purpose && <span>{code.purpose}</span>}
            </div>

            {/* Quick Actions for Active */}
            {showActions && code.status === 'active' && (
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={copyCode}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
                    >
                        {copying ? (
                            <>
                                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                    />
                                </svg>
                                Copy Code
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleRevoke}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        Revoke
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default function Visitors({ activeCodes, historyCodes, dailyUsage }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('active');
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState<AccessCode | null>(null);
    const [revoking, setRevoking] = useState(false);

    const currentCodes = activeTab === 'active' ? activeCodes : historyCodes;

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

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-6">
                <div className="inline-flex rounded-xl bg-gray-100 p-1">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Active
                        {activeCodes.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white">{activeCodes.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        History
                    </button>
                </div>
            </motion.div>

            {/* Code List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <AnimatePresence mode="wait">
                    {currentCodes.length > 0 ? (
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            {currentCodes.map((code, index) => (
                                <motion.div
                                    key={code.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <CodeCard code={code} showActions={activeTab === 'active'} onRevoke={openRevokeModal} />
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
