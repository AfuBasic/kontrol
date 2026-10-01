import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Car, CheckCircle2, ChevronLeft, Clock, Loader2, LogOut, Plus, ShieldAlert, WifiOff } from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { WalkInDestination } from '@/Components/Security/DestinationPicker';
import WalkInAdmitForm from '@/Components/Security/WalkInAdmitForm';

const TAG_LENGTH = 4;

interface Props {
    destinations: WalkInDestination[];
    isOnline: boolean;
    requireVehicleInformation?: boolean;
    /** Estate enforces checkout: the entry tag is also the exit tag. */
    checkoutEnabled?: boolean;
}

interface InsideVisitor {
    tag: string;
    visitor_name: string | null;
    organization_name: string | null;
    verified_at: string | null;
    vehicle_plate_number?: string | null;
}

type ExitState =
    | { kind: 'idle' }
    | { kind: 'looking' }
    | { kind: 'found'; visitor: InsideVisitor }
    | { kind: 'checking_out'; visitor: InsideVisitor }
    | { kind: 'done'; visitor: InsideVisitor; at: string }
    | { kind: 'error'; message: string };

const timeLabel = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

const durationLabel = (iso: string | null) => {
    if (!iso) return null;
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

export default function WalkInPanel({ destinations, isOnline, requireVehicleInformation = false, checkoutEnabled = false }: Props) {
    const [admitting, setAdmitting] = useState(!checkoutEnabled);
    const [digits, setDigits] = useState<string[]>(Array(TAG_LENGTH).fill(''));
    const [exit, setExit] = useState<ExitState>({ kind: 'idle' });
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const resetExit = () => {
        setDigits(Array(TAG_LENGTH).fill(''));
        setExit({ kind: 'idle' });
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
    };

    const lookUp = async (tag: string) => {
        setExit({ kind: 'looking' });
        try {
            const res = await axios.get('/security/quick-entry/lookup', { params: { tag } });
            if (res.data?.found) {
                setExit({ kind: 'found', visitor: res.data as InsideVisitor });
            } else {
                setExit({ kind: 'error', message: `No one inside with tag ${tag}.` });
            }
        } catch (err: any) {
            setExit({
                kind: 'error',
                message: err?.response ? err.response.data?.message || 'Could not look up that tag.' : 'Check-out needs a connection.',
            });
        }
    };

    const checkOut = async (visitor: InsideVisitor) => {
        setExit({ kind: 'checking_out', visitor });
        try {
            const res = await axios.post('/security/quick-entry/checkout', { tag: visitor.tag });
            setExit({
                kind: 'done',
                visitor,
                at: timeLabel(res.data?.checked_out_at ?? new Date().toISOString()) ?? '',
            });
        } catch (err: any) {
            const data = err?.response?.data;
            const message = data?.errors ? (Object.values(data.errors)[0] as string[])[0] : data?.message;
            setExit({ kind: 'error', message: message || 'Check-out failed. Try again.' });
        }
    };

    const updateDigit = (index: number, raw: string) => {
        const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (exit.kind === 'error' || exit.kind === 'done') setExit({ kind: 'idle' });

        // Pasted or auto-filled full tag.
        if (clean.length > 1) {
            const next = Array(TAG_LENGTH).fill('');
            clean
                .slice(0, TAG_LENGTH)
                .split('')
                .forEach((c, i) => (next[i] = c));
            setDigits(next);
            inputsRef.current[Math.min(clean.length, TAG_LENGTH - 1)]?.focus();
            if (clean.length >= TAG_LENGTH) void lookUp(next.join(''));
            return;
        }

        const next = [...digits];
        next[index] = clean;
        setDigits(next);
        if (clean && index < TAG_LENGTH - 1) inputsRef.current[index + 1]?.focus();
        if (next.every((d) => d.length === 1)) void lookUp(next.join(''));
    };

    const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            const next = [...digits];
            next[index - 1] = '';
            setDigits(next);
            inputsRef.current[index - 1]?.focus();
            e.preventDefault();
        }
    };

    if (admitting) {
        return (
            <div className="flex w-full flex-col">
                {checkoutEnabled && (
                    <button
                        type="button"
                        onClick={() => setAdmitting(false)}
                        className="-ml-1.5 mb-3 inline-flex min-h-[40px] items-center gap-0.5 self-start pr-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Check-out
                    </button>
                )}
                <WalkInAdmitForm
                    destinations={destinations}
                    isOnline={isOnline}
                    requireVehicleInformation={requireVehicleInformation}
                    checkoutEnabled={checkoutEnabled}
                />
            </div>
        );
    }

    const busy = exit.kind === 'looking' || exit.kind === 'checking_out';

    return (
        <div className="flex w-full flex-col items-center">
            {/* Check-out by tag */}
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Leaving?</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Enter their tag</h2>

            <div className="mt-5 flex items-center gap-3" role="group" aria-label="Walk-in tag">
                {digits.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => {
                            inputsRef.current[i] = el;
                        }}
                        value={digit}
                        onChange={(e) => updateDigit(i, e.target.value)}
                        onKeyDown={(e) => onKeyDown(i, e)}
                        onFocus={(e) => e.currentTarget.select()}
                        inputMode="text"
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        autoComplete="off"
                        maxLength={TAG_LENGTH}
                        disabled={busy || !isOnline || exit.kind === 'found'}
                        aria-label={`Tag character ${i + 1}`}
                        className="h-16 w-14 rounded-2xl border-2 border-slate-200 bg-white text-center font-mono text-3xl font-black text-slate-900 shadow-sm transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                ))}
            </div>

            <div className="mt-4 w-full">
                <AnimatePresence mode="wait">
                    {!isOnline ? (
                        <motion.p
                            key="offline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-amber-700"
                        >
                            <WifiOff className="h-3.5 w-3.5" /> Check-out needs a connection. Admitting still works offline.
                        </motion.p>
                    ) : exit.kind === 'looking' ? (
                        <motion.p key="looking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Looking up tag…
                        </motion.p>
                    ) : exit.kind === 'found' || exit.kind === 'checking_out' ? (
                        <motion.div
                            key="found"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">{exit.visitor.visitor_name || 'Walk-in visitor'}</p>
                            <div className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                {exit.visitor.organization_name && (
                                    <p className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> {exit.visitor.organization_name}
                                    </p>
                                )}
                                {exit.visitor.verified_at && (
                                    <p className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" /> In since {timeLabel(exit.visitor.verified_at)} (
                                        {durationLabel(exit.visitor.verified_at)})
                                    </p>
                                )}
                                {exit.visitor.vehicle_plate_number && (
                                    <p className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                        <Car className="h-3.5 w-3.5 text-slate-400" /> {exit.visitor.vehicle_plate_number}
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={resetExit}
                                    disabled={exit.kind === 'checking_out'}
                                    className="min-h-[48px] flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => checkOut(exit.visitor)}
                                    disabled={exit.kind === 'checking_out'}
                                    className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                                >
                                    {exit.kind === 'checking_out' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                    Check out
                                </button>
                            </div>
                        </motion.div>
                    ) : exit.kind === 'done' ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40"
                        >
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                        {exit.visitor.visitor_name || 'Visitor'} checked out
                                    </p>
                                    <p className="text-xs text-emerald-800/80 dark:text-emerald-400">
                                        Tag {exit.visitor.tag} · {exit.at}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetExit} className="min-h-[40px] shrink-0 rounded-xl px-3 text-sm font-bold text-emerald-800">
                                Next
                            </button>
                        </motion.div>
                    ) : exit.kind === 'error' ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                            <span className="flex-1">{exit.message}</span>
                            <button type="button" onClick={resetExit} className="shrink-0 font-black text-rose-700">
                                Clear
                            </button>
                        </motion.div>
                    ) : (
                        <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-semibold text-slate-400">
                            Looks up automatically on the 4th character
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="my-7 flex w-full items-center gap-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                or
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Admit */}
            <button
                type="button"
                onClick={() => setAdmitting(true)}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-4.5 text-base font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
            >
                <Plus className="h-5 w-5" strokeWidth={2.75} />
                Admit a walk-in
            </button>
            <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Choose where they are going and photograph their ID</p>
        </div>
    );
}
