import { motion } from 'framer-motion';
import { Clock, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

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
    const isActive = pass.status === 'active' && !isExpired;

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
    }

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

    // Google Chart / QR Server API QR code link with high error correction (ecc=H) to allow logo overlay
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=0a3d91&bgcolor=ffffff&qzone=1&ecc=H`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white text-slate-800 shadow-2xl"
        >
            {/* Estate & Status Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                <div className="min-w-0 flex-1 text-left">
                    <p className="text-[9px] font-black tracking-widest text-primary-500 uppercase">ESTATE</p>
                    <h2 className="truncate text-base font-bold text-slate-800">{pass.estate_name || 'My Estate'}</h2>
                </div>
                <div className={`share-exclude flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBg}`}>
                    {statusIcon}
                    {statusLabel}
                </div>
            </div>

            {/* Visitor & Host Info */}
            <div className="relative grid grid-cols-2 gap-4 border-b border-slate-100 bg-white px-5 py-3">
                <div className="text-left">
                    <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">GUEST</p>
                    <p className="text-sm leading-snug font-bold text-slate-800">{pass.visitor_name || 'Guest visitor'}</p>
                </div>
                <div className="text-right">
                    <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">HOST</p>
                    <p className="text-sm leading-snug font-bold text-slate-800">{pass.host_name || 'Resident'}</p>
                </div>
            </div>

            {/* QR Code Segment */}
            <div className="relative flex flex-col items-center justify-center bg-slate-50/50 px-5 py-4">
                <div className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-xl ring-4 ring-primary-500/5 transition-all hover:scale-102">
                    {/* Visual lock status */}
                    {!isActive && (
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
                    {isActive && (
                        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-100/50 bg-white p-0.5 shadow-md">
                            <img
                                src={`${window.location.origin}/assets/images/kontrol-transparent.png`}
                                crossOrigin="anonymous"
                                alt="Kontrol"
                                className="h-4.5 w-4.5 object-contain"
                            />
                        </div>
                    )}
                </div>
                <p className="mt-2 text-[10px] font-medium text-slate-500">Present at gate terminal for fast verification</p>
            </div>

            {/* Fallback code segment - dotted ticket line separation */}
            <div className="relative flex flex-col items-center justify-center border-t-2 border-dashed border-slate-100 bg-white px-5 py-4">
                {/* Ticket notches */}
                <div
                    className="absolute top-0 -left-3 h-5 w-5 -translate-y-1/2 rounded-full bg-[#070a0e] group-first:bg-slate-50 dark:bg-[#070a0e]"
                    style={{ backgroundColor: 'inherit' }}
                />
                <div
                    className="absolute top-0 -right-3 h-5 w-5 -translate-y-1/2 rounded-full bg-[#070a0e] dark:bg-[#070a0e]"
                    style={{ backgroundColor: 'inherit' }}
                />

                <p className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">FALLBACK ACCESS CODE</p>
                <div className="py-0.5 pl-2.5 font-mono text-2xl font-black tracking-[0.2em] text-primary-500">{pass.code}</div>
            </div>

            {/* Validity Metadata (Faint Centered Footer) */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 text-center">
                <p className="text-[10px] font-bold tracking-wide text-slate-400">{formatFaintExpiry(pass.expires_at, pass.type)}</p>
            </div>

            {/* Optional Notes */}
            {pass.notes && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button
                        onClick={() => setViewNotes(!viewNotes)}
                        className="flex w-full items-center justify-between text-xs font-bold text-slate-400 transition-colors hover:text-slate-700"
                    >
                        <span>Entry Notes / Instructions</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewNotes ? 'rotate-180' : ''}`} />
                    </button>
                    {viewNotes && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-3 text-left text-xs leading-relaxed font-medium text-slate-600"
                        >
                            {pass.notes}
                        </motion.p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
