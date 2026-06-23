import { Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Trash2, Clock, CheckCircle2, AlertCircle, Calendar, Share2, Download, ExternalLink, Users, Tag } from 'lucide-react';
import { useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';
import { shareAccessCode } from '@/Utils/share';

function getStatusInfo(status: string) {
    switch (status) {
        case 'active':
            return { label: 'Active', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', accent: 'bg-emerald-500' };
        case 'scheduled':
            return { label: 'Not Active Yet', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', accent: 'bg-amber-500' };
        case 'used':
            return { label: 'Completed', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', accent: 'bg-blue-500' };
        case 'expired':
            return { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20', accent: 'bg-slate-400' };
        case 'revoked':
            return { label: 'Cancelled', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20', accent: 'bg-rose-500' };
        default:
            return { label: status, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100', accent: 'bg-slate-400' };
    }
}

function getPassTypeLabel(type: string) {
    switch (type) {
        case 'single_use':
            return 'One-Time Pass';
        case 'long_lived':
            return 'Long-Term Pass';
        case 'event':
            return 'Event Pass';
        default:
            return 'Access Pass';
    }
}

type Props = {
    code: AccessCode;
    showActions?: boolean;
    onRevoke?: (code: AccessCode) => void;
};

export default function CodeCard({ code, showActions = false, onRevoke }: Props) {
    const [copying, setCopying] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    // Compute effective status based on timestamps
    const isExpired = code.expires_at ? new Date(code.expires_at) < new Date() : false;
    const isFuture = code.starts_at ? new Date(code.starts_at) > new Date() : false;
    const effectiveStatus = code.status === 'active' && isExpired ? 'expired' : (code.status === 'active' && isFuture ? 'scheduled' : code.status);
    const status = getStatusInfo(effectiveStatus);

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

    async function handleShare() {
        setSharing(true);
        try {
            await shareAccessCode(code);
        } catch (err) {
            console.error('Sharing failed', err);
        } finally {
            setSharing(false);
        }
    }

    async function downloadQrCode() {
        if (!code.pass_uuid || !code.qr_token) return;
        setDownloading(true);
        const passUrl = `kontrol://pass/${code.pass_uuid}?token=${code.qr_token}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(passUrl)}&color=0a3d91&bgcolor=ffffff&qzone=1&ecc=H`;
        
        try {
            const response = await fetch(qrImageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `pass-qr-${code.code}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(qrImageUrl, '_blank');
        } finally {
            setDownloading(false);
        }
    }

    const handleRevoke = () => {
        setShowOptions(false);
        onRevoke?.(code);
    };

    // Format display date
    const formatFaintExpiry = () => {
        if (effectiveStatus === 'scheduled' && code.starts_at) {
            const date = new Date(code.starts_at);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            if (date.toDateString() === today.toDateString()) {
                return `Starts today at ${timeStr.toLowerCase()}`;
            }
            if (date.toDateString() === tomorrow.toDateString()) {
                return `Starts tomorrow at ${timeStr.toLowerCase()}`;
            }
            return `Starts ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr.toLowerCase()}`;
        }

        if (code.type === 'long_lived') {
            if (!code.expires_at) return 'Valid indefinitely';
            return `Valid until ${new Date(code.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

        if (!code.expires_at) return 'Valid indefinitely';
        const date = new Date(code.expires_at);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (date.toDateString() === today.toDateString()) {
            return `Valid until ${timeStr.toLowerCase()} today`;
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return `Valid until ${timeStr.toLowerCase()} tomorrow`;
        }
        return `Valid until ${timeStr.toLowerCase()} on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    return (
        <motion.div
            layoutId={`visitor-card-${code.id}`}
            className="group relative overflow-hidden rounded-[32px] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-xl hover:border-slate-300/80"
        >
            {/* Top Ticket Section */}
            <div className="p-6 pb-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        {getPassTypeLabel(code.type)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wider uppercase ${status.bg} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.accent}`} />
                        {status.label}
                    </span>
                </div>

                {/* Name / Event Details */}
                <div className="mb-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                        {code.visitor_name || 'Visitor'}
                    </h3>
                    {code.purpose && (
                        <p className="text-xs font-bold text-slate-400 mt-1">
                            Purpose: {code.purpose}
                        </p>
                    )}
                </div>

                {/* Event Pass Specific UI */}
                {code.type === 'event' && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-indigo-600 uppercase">
                                <Users className="h-3.5 w-3.5" />
                                Attendance
                            </span>
                            <span className="text-xs font-extrabold text-indigo-900">
                                {code.uses_count ?? 0} {code.guest_limit ? `/ ${code.guest_limit}` : ''} Admitted
                            </span>
                        </div>
                        {code.guest_limit && (
                            <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, ((code.uses_count ?? 0) / code.guest_limit) * 100)}%` }}
                                />
                            </div>
                        )}
                        {code.used_at && (
                            <p className="mt-2 text-[10px] font-bold text-slate-400">
                                Last entry: {new Date(code.used_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Separator line with left/right ticket punches */}
            <div className="relative border-t-2 border-dashed border-slate-100 bg-slate-50/15">
                {/* Ticket punches */}
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 border-r border-slate-200/80 z-10" />
                <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 border-l border-slate-200/80 z-10" />
            </div>

            {/* Bottom Stub Section */}
            <div className="px-6 py-5 bg-slate-50/20">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <span className="block text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase mb-0.5">
                            Access Code
                        </span>
                        <span className="font-mono text-3xl font-black tracking-[0.1em] text-slate-900">
                            {code.code.split('').join(' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Copy button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                copyCode();
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
                                copying ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400 shadow-xs hover:text-slate-600'
                            }`}
                            title="Copy code"
                        >
                            <Copy className="h-4.5 w-4.5" />
                        </button>

                        {/* View details */}
                        <Link
                            href={resident.visitors.show.url(code.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 shadow-xs hover:text-slate-600 active:scale-90"
                            title="View details"
                        >
                            <ExternalLink className="h-4.5 w-4.5" />
                        </Link>

                        {/* Actions Sheet button */}
                        <button
                            onClick={() => setShowOptions(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 shadow-xs hover:text-slate-600 active:scale-90"
                            title="More options"
                        >
                            <Clock className="h-4.5 w-4.5 rotate-90" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatFaintExpiry()}
                    </span>
                </div>
            </div>

            {/* Quick Share action button on Active passes */}
            {showActions && effectiveStatus === 'active' && (
                <div className="px-6 pb-6 pt-0">
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-slate-900 py-3.5 text-xs font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-98 disabled:opacity-50"
                    >
                        <Share2 className="h-4 w-4" />
                        {sharing ? 'Sharing...' : 'Share Access Pass'}
                    </button>
                </div>
            )}

            {/* Options Sheet */}
            <MobileSheet isOpen={showOptions} onClose={() => setShowOptions(false)} title="Pass Options">
                <div className="space-y-2 pb-8">
                    <Link
                        href={resident.visitors.show.url(code.id)}
                        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <ExternalLink className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">View Full Details</p>
                            <p className="text-xs font-bold text-slate-400">Scan status, logs and settings</p>
                        </div>
                    </Link>

                    <button
                        onClick={handleShare}
                        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Share2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Share Pass</p>
                            <p className="text-xs font-bold text-slate-400">Send code and ticket instructions</p>
                        </div>
                    </button>

                    {code.pass_uuid && code.qr_token && (
                        <button
                            onClick={() => {
                                downloadQrCode();
                                setShowOptions(false);
                            }}
                            disabled={downloading}
                            className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Download className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Download QR Code</p>
                                <p className="text-xs font-bold text-slate-400">Save QR image to your phone</p>
                            </div>
                        </button>
                    )}

                    {effectiveStatus === 'active' && (
                        <>
                            <div className="my-2 h-px bg-slate-100" />
                            <button
                                onClick={handleRevoke}
                                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-rose-50 active:bg-rose-100"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-rose-600">Cancel Pass</p>
                                    <p className="text-xs font-bold text-rose-400">Revoke access immediately</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </MobileSheet>
        </motion.div>
    );
}
