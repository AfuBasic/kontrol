import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { AccessCode } from '@/types/access-code';
import resident from '@/routes/resident';

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

type Props = {
    code: AccessCode;
    showActions?: boolean;
    onRevoke?: (code: AccessCode) => void;
};

export default function CodeCard({ code, showActions = false, onRevoke }: Props) {
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
