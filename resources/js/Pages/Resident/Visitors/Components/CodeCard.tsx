import { Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Trash2, Clock, Calendar, Share2, Download, ExternalLink, Users, Tag } from 'lucide-react';
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
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
                accent: 'bg-emerald-500',
            };
        case 'scheduled':
            return {
                label: 'Scheduled',
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
                accent: 'bg-amber-500',
            };
        case 'used':
            return {
                label: 'Completed',
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
                accent: 'bg-blue-500',
            };
        case 'expired':
            return {
                label: 'Expired',
                color: 'text-slate-500',
                bg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20',
                accent: 'bg-slate-400',
            };
        case 'revoked':
            return {
                label: 'Cancelled',
                color: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
                accent: 'bg-rose-500',
            };
        default:
            return { label: status, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100', accent: 'bg-slate-400' };
    }
}

function getPassTypeDetails(type: string) {
    switch (type) {
        case 'single_use':
            return { label: 'One-Time', icon: Tag, bg: 'bg-emerald-50 text-emerald-600' };
        case 'long_lived':
            return { label: 'Long-Term', icon: Calendar, bg: 'bg-blue-50 text-blue-600' };
        case 'event':
            return { label: 'Event', icon: Users, bg: 'bg-purple-50 text-purple-600' };
        default:
            return { label: 'Visitor', icon: Tag, bg: 'bg-slate-50 text-slate-600' };
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

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
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
            whileHover={{ y: -4, shadow: '0 12px 30px rgba(0, 0, 0, 0.04)' }}
            className="group relative overflow-hidden rounded-[28px] bg-white p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300"
        >
            {/* Card Body */}
            <div className="flex gap-4 items-start">
                {/* Avatar Bubble */}
                <div className="relative shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${typeInfo.bg} font-black text-sm relative transition-all group-hover:scale-105 select-none`}>
                        {code.type === 'event' ? <typeInfo.icon className="h-5 w-5" /> : getInitials(code.visitor_name || 'Visitor')}
                    </div>
                    {/* Status Indicator Dot */}
                    <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${status.accent}`} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-900 truncate tracking-tight leading-snug">
                                {code.visitor_name || 'Visitor'}
                            </h3>
                            {code.purpose && (
                                <p className="text-xs font-bold text-slate-400 truncate mt-0.5">
                                    {code.purpose}
                                </p>
                            )}
                        </div>
                        
                        {/* Options button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOptions(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            <Clock className="h-4 w-4 rotate-90" />
                        </button>
                    </div>

                    {/* Badges and Validity Row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase">
                            {typeInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            {formatFaintExpiry()}
                        </span>
                    </div>

                    {/* Attendance Progress if Event */}
                    {code.type === 'event' && (
                        <div className="mt-3.5 space-y-1.5 rounded-2xl bg-slate-50/50 p-3 border border-slate-100/50">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-purple-500" />
                                    Attendance
                                </span>
                                <span className="font-extrabold text-slate-700">
                                    {code.uses_count ?? 0} {code.guest_limit ? `/ ${code.guest_limit}` : ''} Admitted
                                </span>
                            </div>
                            {code.guest_limit && (
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-purple-650 rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, ((code.uses_count ?? 0) / code.guest_limit) * 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Access Code & Actions */}
            <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between gap-3">
                {/* Copyable Access Code badge */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        copyCode();
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                        copying ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <span className="text-[10px] font-sans font-black tracking-widest text-slate-400 uppercase">Code:</span>
                    <span className="font-black tracking-wider">{copying ? 'COPIED' : code.code}</span>
                </button>

                <div className="flex items-center gap-2">
                    {/* Share button */}
                    {showActions && effectiveStatus === 'active' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                            disabled={sharing}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Share</span>
                        </button>
                    )}
                    
                    {/* Details Link */}
                    <Link
                        href={resident.visitors.show.url(code.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
                        title="View Details"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Link>
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
                                    <p className="text-xs font-bold text-rose-450">Revoke access immediately</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </MobileSheet>
        </motion.div>
    );
}
