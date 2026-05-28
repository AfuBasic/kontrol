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
            className="bg-linear-to-b from-[#111827] to-[#0b0f19] rounded-[32px] shadow-2xl border border-white/5 overflow-hidden flex flex-col text-slate-100 max-w-sm w-full mx-auto"
        >
            {/* Estate & Status Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-black tracking-widest text-[#1f6fdb] uppercase">ESTATE</p>
                    <h2 className="text-lg font-bold text-white truncate">{pass.estate_name || 'My Estate'}</h2>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusBg}`}>
                    {statusIcon}
                    {statusLabel}
                </div>
            </div>

            {/* Visitor & Host Info */}
            <div className="grid grid-cols-2 gap-4 px-6 py-6 border-b border-white/5 relative">
                <div className="text-left">
                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1">GUEST</p>
                    <p className="text-base font-bold text-white leading-snug">{pass.visitor_name || 'Guest visitor'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1">HOST</p>
                    <p className="text-base font-bold text-white leading-snug">{pass.host_name || 'Resident'}</p>
                </div>
            </div>

            {/* QR Code Segment */}
            <div className="flex flex-col items-center justify-center px-6 py-8 bg-white/[0.01] relative">
                <div className="relative p-4 bg-white rounded-3xl shadow-2xl overflow-hidden ring-4 ring-[#1f6fdb]/10 transition-all hover:scale-102">
                    {/* Visual lock status */}
                    {!isActive && (
                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs">
                            {isRevoked ? (
                                <XCircle className="h-10 w-10 text-rose-500 mb-2" />
                            ) : (
                                <Clock className="h-10 w-10 text-rose-500 mb-2" />
                            )}
                            <p className="text-xs font-black text-rose-400 tracking-wider uppercase">
                                {isRevoked ? 'Pass Revoked' : 'Pass Expired'}
                            </p>
                        </div>
                    )}
                    <img src={qrImageUrl} alt="Access QR Code" className="w-48 h-48 block" />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-4">Present at gate terminal for fast verification</p>
            </div>

            {/* Fallback code segment - dotted ticket line separation */}
            <div className="relative border-t-2 border-dashed border-white/10 px-6 py-6 flex flex-col items-center justify-center bg-white/[0.02]">
                {/* Ticket notches */}
                <div className="absolute -left-3 top-0 -translate-y-1/2 w-6 h-6 rounded-full bg-[#070a0e] dark:bg-[#070a0e] group-first:bg-slate-50" style={{ backgroundColor: 'inherit' }} />
                <div className="absolute -right-3 top-0 -translate-y-1/2 w-6 h-6 rounded-full bg-[#070a0e] dark:bg-[#070a0e]" style={{ backgroundColor: 'inherit' }} />

                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1">FALLBACK ACCESS CODE</p>
                <div className="text-3xl font-mono font-black tracking-[0.2em] text-[#1f6fdb] pl-3 py-1">
                    {pass.code}
                </div>
            </div>

            {/* Validity Metadata */}
            <div className="px-6 py-5 bg-white/2 border-t border-white/5 grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-4 w-4 text-[#1f6fdb]" />
                        <span className="text-[10px] font-black tracking-widest uppercase">VALID UNTIL</span>
                    </div>
                    <p className="font-bold text-white mt-1 leading-snug">{formattedExpiry}</p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 text-slate-400 justify-end">
                        <ShieldCheck className="h-4 w-4 text-[#1f6fdb]" />
                        <span className="text-[10px] font-black tracking-widest uppercase">PURPOSE</span>
                    </div>
                    <p className="font-bold text-white mt-1 leading-snug">{pass.purpose || 'Visitor'}</p>
                </div>
            </div>

            {/* Optional Notes */}
            {pass.notes && (
                <div className="border-t border-white/5 px-6 py-4 bg-[#0a0e17]">
                    <button
                        onClick={() => setViewNotes(!viewNotes)}
                        className="flex items-center justify-between w-full text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <span>Entry Notes / Instructions</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewNotes ? 'rotate-180' : ''}`} />
                    </button>
                    {viewNotes && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="text-xs text-slate-300 leading-relaxed font-medium mt-3 text-left"
                        >
                            {pass.notes}
                        </motion.p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
