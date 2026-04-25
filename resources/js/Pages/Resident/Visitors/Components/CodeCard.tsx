import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Copy, Trash2, Clock, CheckCircle2, AlertCircle, Calendar, MoreVertical, Share2, Zap, ExternalLink, Activity } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';
import resident from '@/routes/resident';
import MobileSheet from '@/Components/MobileSheet';

function getStatusInfo(status: AccessCode['status']) {
    switch (status) {
        case 'active':
            return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Zap };
        case 'used':
            return { label: 'Arrived', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: CheckCircle2 };
        case 'expired':
            return { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Clock };
        case 'revoked':
            return { label: 'Revoked', color: 'text-rose-400', bg: 'bg-rose-400/10', icon: AlertCircle };
    }
}

type Props = {
    code: AccessCode;
    showActions?: boolean;
    onRevoke?: (code: AccessCode) => void;
};

export default function CodeCard({ code, showActions = false, onRevoke }: Props) {
    const [copying, setCopying] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const status = getStatusInfo(code.status);

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(code.code);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        } catch {
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

    const handleRevoke = () => {
        setShowOptions(false);
        onRevoke?.(code);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200 transition-all hover:shadow-lg"
        >
            <div className="relative z-10">
                <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100 transition-colors group-hover:bg-indigo-50 group-hover:ring-indigo-100`}
                        >
                            {code.status === 'active' ? (
                                <Zap className="h-7 w-7 text-emerald-500" fill="currentColor" />
                            ) : (
                                <status.icon className={`h-7 w-7 ${status.color.replace('400', '600')}`} />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-900">{code.visitor_name || 'Anonymous Visitor'}</h3>
                                <div
                                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ${status.bg.replace('/10', '')} ${status.color.replace('400', '600')}`}
                                >
                                    <div className={`h-1 w-1 rounded-full ${status.color.replace('text', 'bg').replace('400', '600')}`} />
                                    {status.label}
                                </div>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                {code.type === 'long_lived' ? <Calendar className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {code.type === 'long_lived' ? 'Long-term access' : code.time_remaining}
                                {code.purpose && code.purpose !== 'Emergency' && (
                                    <>
                                        <span className="mx-1 opacity-30">•</span>
                                        {code.purpose}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowOptions(true)}
                        className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-600 active:scale-90"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>

                <Link 
                    href={resident.visitors.show.url(code.id)}
                    className="mb-6 block rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 transition-all hover:bg-slate-100/80 active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-1">Access Code</p>
                            <p className="font-mono text-4xl font-black tracking-[0.15em] text-slate-900">
                                {code.code}
                            </p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                copyCode();
                            }}
                            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                                copying ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:text-slate-900'
                            }`}
                        >
                            {copying ? <CheckCircle2 className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                        </motion.button>
                    </div>
                </Link>

                {showActions && code.status === 'active' && (
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copyCode}
                        className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition-all active:bg-slate-800"
                    >
                        <Share2 className="h-5 w-5" />
                        <span>{copying ? 'Code Copied' : 'Share Access'}</span>
                    </motion.button>
                )}
            </div>

            {/* Options Sheet */}
            <MobileSheet isOpen={showOptions} onClose={() => setShowOptions(false)} title="Visitor Options">
                <div className="space-y-2 pb-8">
                    <Link
                        href={resident.visitors.show.url(code.id)}
                        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">View Details & Usage</p>
                            <p className="text-xs font-bold text-slate-400">Check entrance history and logs</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => {
                            copyCode();
                            setShowOptions(false);
                        }}
                        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Copy className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Copy Code</p>
                            <p className="text-xs font-bold text-slate-400">Copy the 6-digit access code</p>
                        </div>
                    </button>

                    {code.status === 'active' && (
                        <>
                            <button
                                onClick={() => {
                                    copyCode();
                                    setShowOptions(false);
                                }}
                                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">Share Access</p>
                                    <p className="text-xs font-bold text-slate-400">Send pass to your visitor</p>
                                </div>
                            </button>

                            <div className="my-2 h-px bg-slate-100" />

                            <button
                                onClick={handleRevoke}
                                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-rose-50 active:bg-rose-100"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-rose-600">Revoke Pass</p>
                                    <p className="text-xs font-bold text-rose-400">Invalidate this code immediately</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </MobileSheet>
        </motion.div>
    );
}
