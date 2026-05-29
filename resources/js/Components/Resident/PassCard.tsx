import { motion } from 'framer-motion';
import { Clock, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

const KONTROL_LOGO_BASE64 = 'data:image/png;base64,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';

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

    const [compositeQrUrl, setCompositeQrUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isActive) return;

        let cancelled = false;

        const compose = async () => {
            try {
                const size = 144;
                const logoSize = 30;
                const logoOffset = (size - logoSize) / 2;

                // Fetch QR image respecting CORS
                const response = await fetch(qrImageUrl);
                const blob = await response.blob();
                const qrDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                if (cancelled) return;

                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d')!;

                // Draw QR code
                await new Promise<void>((resolve, reject) => {
                    const qrImg = new Image();
                    qrImg.onload = () => { ctx.drawImage(qrImg, 0, 0, size, size); resolve(); };
                    qrImg.onerror = reject;
                    qrImg.src = qrDataUrl;
                });

                if (cancelled) return;

                // Draw logo on top (no white background box — just the transparent logo directly)
                await new Promise<void>((resolve, reject) => {
                    const logoImg = new Image();
                    logoImg.onload = () => {
                        ctx.drawImage(logoImg, logoOffset, logoOffset, logoSize, logoSize);
                        resolve();
                    };
                    logoImg.onerror = reject;
                    logoImg.src = KONTROL_LOGO_BASE64;
                });

                if (cancelled) return;
                setCompositeQrUrl(canvas.toDataURL('image/png'));
            } catch (e) {
                // Compositing failed - fall back to plain QR (no logo)
                console.warn('QR logo compositing failed', e);
            }
        };

        compose();
        return () => { cancelled = true; };
    }, [qrImageUrl, isActive]);

    // Show the composite (with logo baked in), falling back to plain QR while loading
    const displayQrSrc = compositeQrUrl || qrImageUrl;

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
                    {/* QR image — uses canvas-composited version when available (for sharing), plain QR otherwise */}
                    <img src={displayQrSrc} alt="Access QR Code" className="block h-36 w-36" />

                    {/* Logo overlay — shown while canvas compositing is in progress or unavailable */}
                    {isActive && !compositeQrUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img
                                src={KONTROL_LOGO_BASE64}
                                alt="Kontrol"
                                className="h-8 w-8 object-contain"
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
