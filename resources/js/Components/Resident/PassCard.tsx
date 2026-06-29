import { motion } from 'framer-motion';
import { Clock, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { KONTROL_LOGO_BASE64 } from '@/Utils/logo';

export interface PassData {
    id: number;
    uuid?: string;
    code: string;
    visitor_name: string | null;
    visitor_phone: string | null;
    purpose: string | null;
    status: string;
    type: string;
    expires_at: string | null;
    starts_at?: string | null;
    estate_name?: string;
    host_name?: string;
    notes?: string | null;
    created_at?: string;
}

interface Props {
    pass: PassData;
    qrUrl: string;
}

export default function PassCard({ pass, qrUrl }: Props) {
    const [viewNotes, setViewNotes] = useState(false);

    // Format dates nicely
    const expiryDate = pass.expires_at ? new Date(pass.expires_at) : null;

    const isExpired = expiryDate ? expiryDate < new Date() : false;
    const isUsed = pass.status === 'used';
    const isRevoked = pass.status === 'revoked';

    const startsAtDate = pass.starts_at ? new Date(pass.starts_at) : null;
    const isFutureStart = startsAtDate ? startsAtDate > new Date() : false;
    const isScheduled = pass.status === 'scheduled' && isFutureStart;
    const isActive = (pass.status === 'active' || (pass.status === 'scheduled' && !isFutureStart)) && !isExpired;
    const isPassActiveOrScheduled = isActive || isScheduled;

    // Status styling
    let statusLabel = 'Active Pass';
    let statusIcon = <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    let statusBg = 'bg-emerald-50 text-emerald-600 border-emerald-100';

    if (isUsed) {
        statusLabel = 'Checked In';
        statusIcon = <CheckCircle2 className="h-5 w-5 text-blue-600" />;
        statusBg = 'bg-blue-50 text-blue-600 border-blue-100';
    } else if (isExpired) {
        statusLabel = 'Expired';
        statusIcon = <Clock className="h-5 w-5 text-rose-600" />;
        statusBg = 'bg-rose-50 text-rose-600 border-rose-100';
    } else if (isRevoked) {
        statusLabel = 'Revoked';
        statusIcon = <XCircle className="h-5 w-5 text-slate-600" />;
        statusBg = 'bg-slate-50 text-slate-600 border-slate-200';
    } else if (isScheduled) {
        statusLabel = 'Scheduled';
        statusIcon = <Clock className="h-5 w-5 text-indigo-600" />;
        statusBg = 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }

    const formatSmartStartsAt = (iso: string | null | undefined) => {
        if (!iso) return '';
        const date = new Date(iso);
        const now = new Date();

        const timeStr = date
            .toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })
            .toLowerCase();

        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        if (isToday) {
            return `Valid from ${timeStr} today`;
        }
        if (isTomorrow) {
            return `Valid from ${timeStr} tomorrow`;
        }

        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        return `Valid from ${timeStr} on ${dateStr}`;
    };

    const formatFaintExpiry = (iso: string | null, type: string) => {
        if (type === 'long_lived') {
            if (!iso) return 'Long-term access · Never expires';
            const date = new Date(iso);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            return `Long-term access · Valid until ${dateStr}`;
        }

        if (!iso) return 'Never expires';
        const date = new Date(iso);
        const now = new Date();

        // Format time like "9:00 pm"
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        if (isToday) {
            return `Valid until ${timeStr.toLowerCase()} today`;
        }
        if (isTomorrow) {
            return `Valid until ${timeStr.toLowerCase()} tomorrow`;
        }

        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        return `Valid until ${timeStr.toLowerCase()} on ${dateStr}`;
    };

    const isEvent = pass.type === 'event';
    const qrColor = isEvent ? '7c3aed' : '0a3d91';

    // Google Chart / QR Server API QR code link with high error correction (ecc=H) to allow logo overlay
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=${qrColor}&bgcolor=ffffff&qzone=1&ecc=H`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[32px] border shadow-2xl transition-all duration-300 ${
                isEvent
                    ? 'border-violet-500/30 bg-gradient-to-br from-[#0b0f19] via-[#111827] to-[#1e112f] text-slate-100 shadow-[0_20px_50px_rgba(124,58,237,0.25)]'
                    : 'border-slate-100 bg-white text-slate-800'
            }`}
        >
            {/* Estate & Status Header */}
            <div
                className={`flex items-center justify-between border-b px-5 py-3 ${
                    isEvent ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'
                }`}
            >
                <div className="min-w-0 flex-1 text-left">
                    <p className={`text-[9px] font-black tracking-widest uppercase ${isEvent ? 'text-violet-400' : 'text-primary-500'}`}>ESTATE</p>
                    <h2 className={`truncate text-base font-bold ${isEvent ? 'text-white' : 'text-slate-800'}`}>{pass.estate_name || 'My Estate'}</h2>
                </div>
                <div
                    className={`share-exclude flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        isEvent ? 'border-violet-500/30 bg-violet-500/20 text-violet-300' : statusBg
                    }`}
                >
                    {statusIcon}
                    {statusLabel}
                </div>
            </div>

            {/* Visitor & Host Info */}
            <div
                className={`relative grid grid-cols-2 gap-4 border-b px-5 py-3 ${
                    isEvent ? 'border-white/5 bg-transparent' : 'border-slate-100 bg-white'
                }`}
            >
                <div className="text-left">
                    <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">{isEvent ? 'EVENT' : 'GUEST'}</p>
                    <p className={`text-sm leading-snug font-bold ${isEvent ? 'text-white' : 'text-slate-800'}`}>
                        {pass.visitor_name || 'Guest visitor'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">HOST</p>
                    <p className={`text-sm leading-snug font-bold ${isEvent ? 'text-white' : 'text-slate-800'}`}>{pass.host_name || 'Resident'}</p>
                </div>
            </div>

            {/* QR Code Segment */}
            <div className={`relative flex flex-col items-center justify-center px-5 py-4 ${isEvent ? 'bg-white/5' : 'bg-slate-50/50'}`}>
                <div
                    className={`relative overflow-hidden rounded-2xl border p-3 transition-all hover:scale-102 ${
                        isEvent ? 'border-white/10 bg-[#0d111d]' : 'border-slate-100 bg-white'
                    }`}
                >
                    {/* Visual lock status */}
                    {!isPassActiveOrScheduled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center backdrop-blur-xs">
                            {isUsed ? (
                                <CheckCircle2 className="mb-1 h-8 w-8 text-emerald-500" strokeWidth={2.5} />
                            ) : isRevoked ? (
                                <XCircle className="mb-1 h-8 w-8 text-rose-500" />
                            ) : (
                                <Clock className="mb-1 h-8 w-8 text-rose-500" />
                            )}
                            <p className={`text-[10px] font-black tracking-wider uppercase ${isUsed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isUsed ? 'Visitor Admitted' : isRevoked ? 'Pass Revoked' : 'Pass Expired'}
                            </p>
                        </div>
                    )}
                    <img src={qrImageUrl} alt="Access QR Code" className="block h-36 w-36" />

                    {/* Centered logo icon overlay (Safe with ecc=H error correction) */}
                    {isPassActiveOrScheduled && (
                        <div
                            className="absolute flex items-center justify-center rounded-lg bg-white p-1"
                            style={{ top: '68px', left: '68px', zIndex: 10 }}
                        >
                            <img src={KONTROL_LOGO_BASE64} alt="Kontrol" className="h-6 w-6 object-contain" />
                        </div>
                    )}
                </div>
                {isScheduled ? (
                    <div
                        className={`mt-2.5 rounded-xl border px-4 py-1.5 text-center ${
                            isEvent ? 'border-violet-500/20 bg-violet-500/10 text-violet-300' : 'border-indigo-100/50 bg-indigo-50/80 text-indigo-700'
                        }`}
                    >
                        <p className="text-[10px] font-black tracking-wide uppercase">Pass Scheduled</p>
                        <p className="mt-0.5 text-[9px] font-bold opacity-90">{formatSmartStartsAt(pass.starts_at)}</p>
                    </div>
                ) : (
                    <p className={`mt-2 text-[10px] font-medium ${isEvent ? 'text-slate-400' : 'text-slate-500'}`}>
                        Present at gate terminal for fast verification
                    </p>
                )}
            </div>

            {/* Fallback code segment - dotted ticket line separation */}
            <div
                className={`relative flex flex-col items-center justify-center border-t-2 border-dashed px-5 py-4 ${
                    isEvent ? 'border-white/5 bg-transparent' : 'border-slate-100 bg-white'
                }`}
            >
                {/* Ticket notches */}
                <div className="absolute top-0 -left-3 h-5 w-5 -translate-y-1/2 rounded-full" style={{ backgroundColor: '#f8fafc' }} />
                <div className="absolute top-0 -right-3 h-5 w-5 -translate-y-1/2 rounded-full" style={{ backgroundColor: '#f8fafc' }} />

                <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">FALLBACK ACCESS CODE</p>
                <div
                    className={`py-0.5 pl-2.5 font-mono text-2xl font-black tracking-[0.2em] ${
                        isEvent
                            ? 'bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(167,139,250,0.3)]'
                            : 'text-primary-500'
                    }`}
                >
                    {pass.code}
                </div>
            </div>

            {/* Validity Metadata (Faint Centered Footer) */}
            <div className={`border-t px-5 py-2.5 text-center ${isEvent ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                <p className={`text-[10px] font-bold tracking-wide ${isEvent ? 'text-slate-400' : 'text-slate-400'}`}>
                    {formatFaintExpiry(pass.expires_at, pass.type)}
                </p>
            </div>

            {/* Optional Notes */}
            {pass.notes && (
                <div className={`border-t px-6 py-4 ${isEvent ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button
                        onClick={() => setViewNotes(!viewNotes)}
                        className={`flex w-full items-center justify-between text-xs font-bold transition-colors ${
                            isEvent ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span>Entry Notes / Instructions</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewNotes ? 'rotate-180' : ''}`} />
                    </button>
                    {viewNotes && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className={`mt-3 text-left text-xs leading-relaxed font-medium ${isEvent ? 'text-slate-350' : 'text-slate-600'}`}
                        >
                            {pass.notes}
                        </motion.p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
