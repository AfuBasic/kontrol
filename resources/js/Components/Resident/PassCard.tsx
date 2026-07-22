import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle2, Clock, XCircle } from 'lucide-react';
import StatusBadge from '@/Components/Visitors/StatusBadge';
import VisitorAvatar from '@/Components/Visitors/VisitorAvatar';
import { KONTROL_LOGO_BASE64 } from '@/Utils/logo';
import { deriveCategory, formatRelativeDate, normalizeStatus } from '@/Utils/visitorTheme';

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

    const resolvedStatus = normalizeStatus(pass);
    const category = deriveCategory(pass.purpose, pass.type);
    const isPassActiveOrScheduled = resolvedStatus === 'expected' || resolvedStatus === 'checked_in';

    // Format single combined validity range
    const formatValidityRange = () => {
        if (pass.type === 'long_lived') {
            if (!pass.expires_at) return 'Long-term access · Unlimited';
            return `Long-term access · Until ${formatRelativeDate(pass.expires_at)}`;
        }

        const startDate = pass.starts_at ? new Date(pass.starts_at) : (pass.created_at ? new Date(pass.created_at) : null);
        const endDate = pass.expires_at ? new Date(pass.expires_at) : null;

        if (!startDate && !endDate) return 'Unlimited validity';

        const startTimeStr = startDate
            ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
            : null;

        const endTimeStr = endDate
            ? endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
            : null;

        const dateFormatted = formatRelativeDate(startDate || endDate);

        if (startTimeStr && endTimeStr) {
            return `${startTimeStr} – ${endTimeStr} (${dateFormatted})`;
        }
        if (endTimeStr) {
            return `Until ${endTimeStr} (${dateFormatted})`;
        }
        if (startTimeStr) {
            return `From ${startTimeStr} (${dateFormatted})`;
        }

        return dateFormatted;
    };

    const isEvent = pass.type === 'event';
    const qrColor = isEvent ? '7c3aed' : '1f6fdb'; // Kontrol Primary Blue

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=${qrColor}&bgcolor=ffffff&qzone=1&ecc=H`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[28px] border shadow-xl transition-all duration-300 ${
                isEvent
                    ? 'border-violet-500/30 bg-gradient-to-br from-[#0b0f19] via-[#111827] to-[#1e112f] text-slate-100'
                    : 'border-slate-200 bg-white text-slate-900'
            }`}
        >
            {/* Top Info: Visitor Avatar, Name & Single Status Badge */}
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isEvent ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/60'}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <VisitorAvatar category={category} name={pass.visitor_name} size="md" />
                    <div className="min-w-0 text-left">
                        <h2 className={`truncate text-base font-bold ${isEvent ? 'text-white' : 'text-slate-900'}`}>
                            {pass.visitor_name || 'Guest Visitor'}
                        </h2>
                        {pass.purpose && (
                            <p className="truncate text-xs text-slate-400 font-medium">{pass.purpose}</p>
                        )}
                    </div>
                </div>

                {/* Single Status Badge */}
                <StatusBadge codeObj={pass} />
            </div>

            {/* Host & Validity Info Section - Stacked Layout to Prevent Text Truncation */}
            <div className={`space-y-2.5 border-b px-5 py-3 text-xs ${isEvent ? 'border-white/10 bg-transparent' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">HOST / ESTATE</span>
                    <span className={`font-bold text-right ${isEvent ? 'text-white' : 'text-slate-800'}`}>
                        {pass.host_name || 'Resident'} <span className="text-slate-400 font-medium">• {pass.estate_name || 'My Estate'}</span>
                    </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100/60 pt-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">VALIDITY WINDOW</span>
                    <span className={`font-bold text-right ${isEvent ? 'text-violet-300' : 'text-primary-600'}`}>
                        {formatValidityRange()}
                    </span>
                </div>
            </div>

            {/* QR Code Section */}
            <div className={`relative flex flex-col items-center justify-center px-5 py-5 ${isEvent ? 'bg-white/5' : 'bg-slate-50/50'}`}>
                <div className={`relative overflow-hidden rounded-2xl border p-3 ${isEvent ? 'border-white/10 bg-[#0d111d]' : 'border-slate-200 bg-white shadow-xs'}`}>
                    {!isPassActiveOrScheduled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center backdrop-blur-xs">
                            {resolvedStatus === 'completed' ? (
                                <CheckCircle2 className="mb-1 h-8 w-8 text-emerald-500" strokeWidth={2.5} />
                            ) : (
                                <XCircle className="mb-1 h-8 w-8 text-rose-500" />
                            )}
                            <p className={`text-[10px] font-black uppercase tracking-wider ${resolvedStatus === 'completed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {resolvedStatus === 'completed' ? 'Visitor Admitted' : 'Pass Expired / Revoked'}
                            </p>
                        </div>
                    )}
                    <img src={qrImageUrl} alt="Access QR Code" className="block h-36 w-36" />

                    {/* Centered logo icon overlay */}
                    {isPassActiveOrScheduled && (
                        <div className="absolute flex items-center justify-center rounded-lg bg-white p-1" style={{ top: '68px', left: '68px', zIndex: 10 }}>
                            <img src={KONTROL_LOGO_BASE64} alt="Kontrol" className="h-6 w-6 object-contain" />
                        </div>
                    )}
                </div>
                <p className={`mt-2 text-[10px] font-medium ${isEvent ? 'text-slate-400' : 'text-slate-500'}`}>
                    Present at gate terminal for fast verification
                </p>
            </div>

            {/* Fallback Code Section with Ticket Notches */}
            <div className={`relative flex flex-col items-center justify-center border-t-2 border-dashed px-5 py-4 ${isEvent ? 'border-white/10 bg-transparent' : 'border-slate-200 bg-white'}`}>
                {/* Left & Right Ticket Notches */}
                <div className="absolute -left-3 top-0 h-5 w-5 -translate-y-1/2 rounded-full border-r border-slate-200 bg-white dark:bg-slate-950" />
                <div className="absolute -right-3 top-0 h-5 w-5 -translate-y-1/2 rounded-full border-l border-slate-200 bg-white dark:bg-slate-950" />

                <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">FALLBACK ACCESS CODE</p>
                <div className={`font-mono text-2xl font-black tracking-[0.2em] ${isEvent ? 'text-violet-300' : 'text-primary-600'}`}>
                    {pass.code}
                </div>
            </div>

            {/* Optional Notes */}
            {pass.notes && (
                <div className={`border-t px-5 py-3 ${isEvent ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button
                        onClick={() => setViewNotes(!viewNotes)}
                        className={`flex w-full items-center justify-between text-xs font-bold ${isEvent ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <span>Entry Instructions</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewNotes ? 'rotate-180' : ''}`} />
                    </button>
                    {viewNotes && (
                        <p className={`mt-2 text-left text-xs leading-relaxed font-medium ${isEvent ? 'text-slate-300' : 'text-slate-600'}`}>
                            {pass.notes}
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
