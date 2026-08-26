import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Pause, Play, ShieldAlert, WifiOff } from 'lucide-react';
import {
    formatDateTimeSafe,
    formatStayDurationSafe,
    ResolvedDecision,
    resolveVerificationDecision,
    ValidationResult,
} from './verificationDecision';

interface VerificationResultCardProps {
    result: ValidationResult;
    onAdmit: (data?: Record<string, unknown>) => void;
    onCheckout: () => void;
    onReset: () => void;
}

export default function VerificationResultCard({
    result,
    onAdmit,
    onCheckout,
    onReset,
}: VerificationResultCardProps) {
    const decision: ResolvedDecision = resolveVerificationDecision(result);

    const [countdown, setCountdown] = useState(4);
    const [isPaused, setIsPaused] = useState(false);

    const onResetRef = useRef(onReset);
    useEffect(() => {
        onResetRef.current = onReset;
    });

    const isAutoReturnActive = decision.allowAutoReturn;

    useEffect(() => {
        if (!isAutoReturnActive || isPaused) return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onResetRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isAutoReturnActive, isPaused]);

    // Tone-based visual accents (compact badges and icons, neutral background)
    const toneStyles = {
        success: {
            bannerBg: 'bg-emerald-50/80 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/40',
            iconBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
            titleColor: 'text-emerald-900 dark:text-emerald-300',
            subtitleColor: 'text-emerald-700/90 dark:text-emerald-400/90',
            accentRing: 'ring-emerald-500/20',
        },
        error: {
            bannerBg: 'bg-rose-50/80 border-rose-200/70 dark:bg-rose-950/20 dark:border-rose-900/40',
            iconBg: 'bg-rose-600 text-white shadow-rose-600/20',
            titleColor: 'text-rose-950 dark:text-rose-300',
            subtitleColor: 'text-rose-700/90 dark:text-rose-400/90',
            accentRing: 'ring-rose-500/20',
        },
        warning: {
            bannerBg: 'bg-amber-50/80 border-amber-200/70 dark:bg-amber-950/20 dark:border-amber-900/40',
            iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
            titleColor: 'text-amber-950 dark:text-amber-300',
            subtitleColor: 'text-amber-800/90 dark:text-amber-400/90',
            accentRing: 'ring-amber-500/20',
        },
        info: {
            bannerBg: 'bg-blue-50/80 border-blue-200/70 dark:bg-blue-950/20 dark:border-blue-900/40',
            iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
            titleColor: 'text-blue-950 dark:text-blue-300',
            subtitleColor: 'text-blue-700/90 dark:text-blue-400/90',
            accentRing: 'ring-blue-500/20',
        },
        neutral: {
            bannerBg: 'bg-slate-50/80 border-slate-200/70 dark:bg-slate-800/30 dark:border-slate-700/40',
            iconBg: 'bg-slate-700 text-white shadow-slate-700/20',
            titleColor: 'text-slate-900 dark:text-slate-100',
            subtitleColor: 'text-slate-600 dark:text-slate-400',
            accentRing: 'ring-slate-500/20',
        },
    }[decision.tone];

    const Icon = decision.Icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col justify-between"
        >
            <div className="space-y-4">
                {/* 1. COMPACT STATUS HEADER */}
                <div
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 shadow-xs sm:p-4.5 ${toneStyles.bannerBg}`}
                >
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ring-4 ${toneStyles.iconBg} ${toneStyles.accentRing}`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                            <h2 className={`text-base font-black tracking-tight ${toneStyles.titleColor}`}>
                                {decision.statusLabel}
                            </h2>
                            {decision.badgeLabel && (
                                <span className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-700 uppercase shadow-2xs dark:bg-slate-800 dark:text-slate-300">
                                    {decision.badgeLabel}
                                </span>
                            )}
                        </div>
                        <p className={`mt-0.5 text-xs font-semibold leading-relaxed ${toneStyles.subtitleColor}`}>
                            {decision.statusSubtitle}
                        </p>
                    </div>
                </div>

                {/* 2. VISITOR IDENTITY CARD (Prominent & Neutral) */}
                {decision.showIdentity && decision.visitorName && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="min-w-0">
                            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Visitor Identity
                            </p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white break-words">
                                {decision.visitorName}
                            </h3>
                            {decision.hostName && (
                                <p className="mt-1 flex items-baseline gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <span className="text-slate-400">Visiting:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{decision.hostName}</span>
                                    {decision.purpose && (
                                        <span className="text-slate-400">· {decision.purpose}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. RELEVANT PASS FACTS (Clean Summary Grid) */}
                {decision.facts.length > 0 && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                            Pass Summary
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {decision.facts.map((fact, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-baseline justify-between rounded-xl px-3.5 py-2.5 sm:flex-col sm:items-start sm:gap-1 ${
                                        fact.highlight
                                            ? 'bg-slate-100/80 dark:bg-slate-800/60'
                                            : 'bg-slate-50/60 dark:bg-slate-800/30'
                                    }`}
                                >
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {fact.label}
                                    </span>
                                    <span
                                        className={`text-xs font-extrabold break-words ${
                                            fact.highlight
                                                ? 'text-slate-950 dark:text-white'
                                                : 'text-slate-700 dark:text-slate-200'
                                        }`}
                                    >
                                        {fact.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 4. ACTIONS & AUTO-RETURN BAR (Sticky Bottom Dock) */}
            <div className="mt-6 border-t border-slate-100 bg-white pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] dark:border-slate-800 dark:bg-slate-900">
                {/* Optional Vehicle Input for check-ins with vehicle */}
                {result.valid && result.has_vehicle && decision.actionType === 'admit' && (
                    <div className="mb-4">
                        <VehicleEntryForm onSubmit={(data) => onAdmit(data)} />
                    </div>
                )}

                {/* Checkout Confirmation State */}
                {decision.actionType === 'checkout_confirm' && (
                    <div className="space-y-2.5">
                        <button
                            type="button"
                            onClick={() => onCheckout()}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition-all hover:bg-blue-700 active:scale-[0.98]"
                        >
                            Confirm Check-Out
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-full cursor-pointer rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Bypass Action for Offline Not-Found */}
                {decision.actionType === 'bypass' && (
                    <div className="space-y-2.5">
                        <button
                            type="button"
                            onClick={() => onAdmit({ bypass: 'true' })}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
                        >
                            Admit via Security Bypass
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-full cursor-pointer rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300"
                        >
                            Verify Another Pass
                        </button>
                    </div>
                )}

                {/* Standard Scan Next Pass / Auto-Return Countdown */}
                {decision.actionType === 'scan_next' && !result.has_vehicle && (
                    <div>
                        {isAutoReturnActive ? (
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="relative flex h-5 w-5 items-center justify-center">
                                        <svg className="-rotate-90" width="20" height="20">
                                            <circle
                                                strokeWidth="2"
                                                stroke="#e2e8f0"
                                                fill="transparent"
                                                r="8"
                                                cx="10"
                                                cy="10"
                                            />
                                            {!isPaused && (
                                                <circle
                                                    className="transition-all duration-1000 ease-linear"
                                                    strokeWidth="2"
                                                    strokeDasharray="50.2"
                                                    strokeDashoffset={50.2 - (countdown / 4) * 50.2}
                                                    strokeLinecap="round"
                                                    stroke="#0f172a"
                                                    fill="transparent"
                                                    r="8"
                                                    cx="10"
                                                    cy="10"
                                                />
                                            )}
                                        </svg>
                                        <span className="absolute text-[8px] font-black text-slate-800 dark:text-white">
                                            {countdown}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {isPaused ? 'Paused' : `Next scan in ${countdown}s`}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsPaused(!isPaused)}
                                        aria-label={isPaused ? 'Resume countdown' : 'Pause countdown'}
                                        className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                        {isPaused ? (
                                            <Play className="h-3 w-3 fill-slate-500" />
                                        ) : (
                                            <Pause className="h-3 w-3" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="cursor-pointer rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-950"
                                >
                                    Scan Next Pass
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={onReset}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-950"
                            >
                                {decision.primaryActionLabel}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function VehicleEntryForm({ onSubmit }: { onSubmit: (data: Record<string, string>) => void }) {
    const [data, setData] = useState({
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate_number: '',
    });

    return (
        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                    Vehicle Details Required
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <input
                    type="text"
                    placeholder="Make (e.g. Toyota)"
                    value={data.vehicle_make}
                    onChange={(e) => setData({ ...data, vehicle_make: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition-all focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                    type="text"
                    placeholder="Model (e.g. Corolla)"
                    value={data.vehicle_model}
                    onChange={(e) => setData({ ...data, vehicle_model: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition-all focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
            </div>
            <input
                type="text"
                placeholder="License Plate Number"
                value={data.vehicle_plate_number}
                onChange={(e) => setData({ ...data, vehicle_plate_number: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition-all focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => onSubmit({})}
                    className="flex-1 cursor-pointer rounded-xl bg-slate-200/70 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200"
                >
                    Skip
                </button>
                <button
                    type="button"
                    onClick={() => onSubmit(data)}
                    className="flex-[2] cursor-pointer rounded-xl bg-slate-950 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-950"
                >
                    Confirm & Admit
                </button>
            </div>
        </div>
    );
}
