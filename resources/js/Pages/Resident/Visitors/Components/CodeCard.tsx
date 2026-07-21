import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Trash2, Clock, Calendar, Share2, Download, ExternalLink, Users, Tag, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';
import resident from '@/routes/resident';
import type { AccessCode } from '@/types/access-code';
import { shareAccessCode } from '@/Utils/share';

function getStatusInfo(status: string) {
    switch (status) {
        case 'active':
            return {
                label: 'Active',
                color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100/80',
            };
        case 'scheduled':
            return {
                label: 'Scheduled',
                color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100/80',
            };
        case 'used':
            return {
                label: 'Completed',
                color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100/80',
            };
        case 'expired':
            return {
                label: 'Expired',
                color: 'text-slate-600 bg-slate-50 border-slate-100',
            };
        case 'revoked':
            return {
                label: 'Cancelled',
                color: 'text-rose-755 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100/80',
            };
        default:
            return {
                label: status,
                color: 'text-slate-600 bg-slate-50 border-slate-100',
            };
    }
}

function getPassTypeDetails(type: string) {
    switch (type) {
        case 'single_use':
            return { label: 'One-Time', icon: Tag, bg: 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50' };
        case 'long_lived':
            return { label: 'Long-Term', icon: Calendar, bg: 'bg-blue-50/50 text-blue-700 border-blue-100/50' };
        case 'event':
            return { label: 'Event', icon: Users, bg: 'bg-purple-50/50 text-purple-700 border-purple-100/50' };
        default:
            return { label: 'Visitor', icon: Tag, bg: 'bg-slate-50/50 text-slate-700 border-slate-100/50' };
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

    const now = new Date();
    const isExpired = code.expires_at ? new Date(code.expires_at) < now : false;
    const isFuture = code.starts_at ? new Date(code.starts_at) > now : false;

    let tempStatus = code.status;
    if (code.status === 'scheduled' && !isFuture) {
        tempStatus = 'active';
    } else if (code.status === 'active' && isFuture) {
        tempStatus = 'scheduled';
    }

    const effectiveStatus = tempStatus === 'active' && isExpired ? 'expired' : tempStatus;
    const status = getStatusInfo(effectiveStatus);
    const typeInfo = getPassTypeDetails(code.type);

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

    const formatDateLabel = (dateString: string | null, prefix: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

        if (date.toDateString() === today.toDateString()) {
            return `${prefix} ${timeStr} today`;
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return `${prefix} ${timeStr} tomorrow`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `${prefix} ${timeStr} yesterday`;
        }
        return `${prefix} ${timeStr} on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const formatFaintExpiry = () => {
        if (effectiveStatus === 'used') {
            return formatDateLabel(code.used_at || code.expires_at, 'Used at');
        }

        if (effectiveStatus === 'expired') {
            return formatDateLabel(code.expires_at, 'Expired at');
        }

        if (effectiveStatus === 'revoked') {
            return formatDateLabel(code.revoked_at || code.expires_at, 'Cancelled at');
        }

        if (effectiveStatus === 'scheduled' && code.starts_at) {
            return formatDateLabel(code.starts_at, 'Starts at');
        }

        if (code.type === 'long_lived') {
            if (!code.expires_at) return 'Valid indefinitely';
            return `Valid until ${new Date(code.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

        if (!code.expires_at) return 'Valid indefinitely';
        return formatDateLabel(code.expires_at, 'Valid until');
    };

    return (
        <motion.div
            layoutId={`visitor-card-${code.id}`}
            whileHover={{ y: -1 }}
            onClick={() => router.visit(resident.visitors.show.url(code.id))}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-250 active:bg-slate-50"
        >
            <div className="flex flex-col gap-3">
                {/* Header Row: Name and Status Badge */}
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900">
                            {code.visitor_name || 'Visitor'}
                        </h3>
                        {code.purpose && (
                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                                {code.purpose}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>
                            {status.label}
                        </span>
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOptions(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                        >
                            <Clock className="h-3.5 w-3.5 rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Info Row: Type, Expiry */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${typeInfo.bg}`}>
                        {typeInfo.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                        {formatFaintExpiry()}
                    </span>
                </div>

                {/* Event Attendance (Progress Bar) */}
                {code.type === 'event' && (
                    <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-[10px] text-slate-500">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-medium">
                                <Users className="h-3 w-3 text-purple-550" />
                                Attendance
                            </span>
                            <span className="font-semibold text-slate-700">
                                {code.uses_count ?? 0} {code.guest_limit ? `/ ${code.guest_limit}` : ''} Admitted
                            </span>
                        </div>
                        {code.guest_limit && (
                            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, ((code.uses_count ?? 0) / code.guest_limit) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Access Code Row - High Contrast and Prominent */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-2.5">
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            copyCode();
                        }}
                        className={`flex flex-1 items-center justify-between rounded-xl px-3 py-2 transition-all ${
                            copying 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className={`text-[8px] font-semibold uppercase tracking-widest ${copying ? 'text-emerald-100' : 'text-slate-400'}`}>
                                Access Code
                            </span>
                            <span className="font-mono text-sm font-bold tracking-widest">
                                {code.code}
                            </span>
                        </div>
                        <div className="shrink-0 p-1">
                            {copying ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-80" />}
                        </div>
                    </div>

                    {showActions && (effectiveStatus === 'active' || effectiveStatus === 'scheduled') && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                            disabled={sharing}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-700 transition-colors hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            title="Share Pass"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

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
                            <p className="text-sm font-semibold text-slate-900">View Full Details</p>
                            <p className="text-xs font-medium text-slate-400">Scan status, logs and settings</p>
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
                            <p className="text-sm font-semibold text-slate-900">Share Pass</p>
                            <p className="text-xs font-medium text-slate-400">Send code and ticket instructions</p>
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
                                <p className="text-sm font-semibold text-slate-900">Download QR Code</p>
                                <p className="text-xs font-medium text-slate-400">Save QR image to your phone</p>
                            </div>
                        </button>
                    )}

                    {(effectiveStatus === 'active' || effectiveStatus === 'scheduled') && (
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
                                    <p className="text-sm font-semibold text-rose-600">Cancel Pass</p>
                                    <p className="text-rose-450 text-xs font-medium">Revoke access immediately</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </MobileSheet>
        </motion.div>
    );
}
