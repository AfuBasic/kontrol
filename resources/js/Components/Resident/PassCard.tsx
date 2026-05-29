import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Clock, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
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
    const formattedExpiry = expiryDate
        ? expiryDate.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Never Expires';

    const isExpired = expiryDate ? expiryDate < new Date() : false;
    const isUsed = pass.status === 'used';
    const isRevoked = pass.status === 'revoked';
    const isActive = pass.status === 'active' && !isExpired;

    // Status styling
    let statusLabel = 'Active Pass';
    let statusIcon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    let statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    if (isUsed) {
        statusLabel = 'Checked In';
        statusIcon = <CheckCircle2 className="h-5 w-5 text-blue-500" />;
        statusBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    } else if (isExpired) {
        statusLabel = 'Expired';
        statusIcon = <Clock className="h-5 w-5 text-rose-500" />;
        statusBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else if (isRevoked) {
        statusLabel = 'Revoked';
        statusIcon = <XCircle className="h-5 w-5 text-slate-500" />;
        statusBg = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }

    // Google Chart / QR Server API QR code link
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=0a3d91&bgcolor=ffffff&qzone=1`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[32px] border border-white/5 bg-linear-to-b from-[#111827] to-[#0b0f19] text-slate-100 shadow-2xl"
        >
            {/* Estate & Status Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-6 py-5">
                <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-black tracking-widest text-[#1f6fdb] uppercase">ESTATE</p>
                    <h2 className="truncate text-lg font-bold text-white">{pass.estate_name || 'My Estate'}</h2>
                </div>
                <div className={`share-exclude flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusBg}`}>
                    {statusIcon}
                    {statusLabel}
                </div>
            </div>

            {/* Visitor & Host Info */}
            <div className="relative grid grid-cols-2 gap-4 border-b border-white/5 px-6 py-6">
                <div className="text-left">
                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">GUEST</p>
                    <p className="text-base leading-snug font-bold text-white">{pass.visitor_name || 'Guest visitor'}</p>
                </div>
                <div className="text-right">
                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">HOST</p>
                    <p className="text-base leading-snug font-bold text-white">{pass.host_name || 'Resident'}</p>
                </div>
            </div>

            {/* QR Code Segment */}
            <div className="relative flex flex-col items-center justify-center bg-white/[0.01] px-6 py-8">
                <div className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-2xl ring-4 ring-[#1f6fdb]/10 transition-all hover:scale-102">
                    {/* Visual lock status */}
                    {!isActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center backdrop-blur-xs">
                            {isUsed ? (
                                <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500" strokeWidth={2.5} />
                            ) : isRevoked ? (
                                <XCircle className="mb-2 h-10 w-10 text-rose-500" />
                            ) : (
                                <Clock className="mb-2 h-10 w-10 text-rose-500" />
                            )}
                            <p className={`text-xs font-black tracking-wider uppercase ${isUsed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isUsed ? 'Visitor Admitted' : isRevoked ? 'Pass Revoked' : 'Pass Expired'}
                            </p>
                        </div>
                    )}
                    <img src={qrImageUrl} alt="Access QR Code" className="block h-48 w-48" />

                    {/* Centered logo icon overlay */}
                    {isActive && (
                        <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-100/50 bg-white p-1 shadow-md">
                            <img src="/assets/images/kontrol-transparent.png" alt="Kontrol" className="h-7 w-7 object-contain" />
                        </div>
                    )}
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400">Present at gate terminal for fast verification</p>
            </div>

            {/* Fallback code segment - dotted ticket line separation */}
            <div className="relative flex flex-col items-center justify-center border-t-2 border-dashed border-white/10 bg-white/[0.02] px-6 py-6">
                {/* Ticket notches */}
                <div
                    className="absolute top-0 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#070a0e] group-first:bg-slate-50 dark:bg-[#070a0e]"
                    style={{ backgroundColor: 'inherit' }}
                />
                <div
                    className="absolute top-0 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#070a0e] dark:bg-[#070a0e]"
                    style={{ backgroundColor: 'inherit' }}
                />

                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">FALLBACK ACCESS CODE</p>
                <div className="py-1 pl-3 font-mono text-3xl font-black tracking-[0.2em] text-[#1f6fdb]">{pass.code}</div>
            </div>

            {/* Validity Metadata */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 bg-white/2 px-6 py-5 text-sm">
                <div className="text-left">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-4 w-4 text-[#1f6fdb]" />
                        <span className="text-[10px] font-black tracking-widest uppercase">VALID UNTIL</span>
                    </div>
                    <p className="mt-1 leading-snug font-bold text-white">{formattedExpiry}</p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5 text-slate-400">
                        <ShieldCheck className="h-4 w-4 text-[#1f6fdb]" />
                        <span className="text-[10px] font-black tracking-widest uppercase">PURPOSE</span>
                    </div>
                    <p className="mt-1 leading-snug font-bold text-white">{pass.purpose || 'Visitor'}</p>
                </div>
            </div>

            {/* Optional Notes */}
            {pass.notes && (
                <div className="border-t border-white/5 bg-[#0a0e17] px-6 py-4">
                    <button
                        onClick={() => setViewNotes(!viewNotes)}
                        className="flex w-full items-center justify-between text-xs font-bold text-slate-400 transition-colors hover:text-white"
                    >
                        <span>Entry Notes / Instructions</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewNotes ? 'rotate-180' : ''}`} />
                    </button>
                    {viewNotes && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-3 text-left text-xs leading-relaxed font-medium text-slate-300"
                        >
                            {pass.notes}
                        </motion.p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
