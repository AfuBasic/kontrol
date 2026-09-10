import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { router, usePage, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, Loader2, Hash, Check, Clock, Shield, Users, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as ProfileController from '@/actions/App/Http/Controllers/Resident/ProfileController';
import * as SosController from '@/actions/App/Http/Controllers/Resident/SosController';
import type { SharedData } from '@/types';

interface Props {
    variant?: 'header' | 'command-center' | 'sidebar' | 'mobile-menu';
    className?: string;
}

export default function SosButton({ variant = 'header', className = '' }: Props) {
    const { props } = usePage<SharedData>();
    const activeSos = props.auth?.user?.active_sos as {
        id: number;
        status: string;
        triggered_at: string;
        acknowledged_at?: string | null;
    } | null | undefined;
    const sosSuccessData = props.flash?.sos_success as { id: string; time: string; has_emergency_contacts: boolean } | null;

    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [_autoCloseSeconds, _setAutoCloseSeconds] = useState(10);

    const holdTimerRef = useRef<number | null>(null);
    const countdownTimerRef = useRef<number | null>(null);
    const holdStartTimeRef = useRef<number>(0);

    const HOLD_DURATION = 1500; // 1.5 seconds

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleStartHold = async () => {
        if (activeSos) {
            // If already active, tapping/holding opens the status sheet instead
            setIsStatusOpen(true);
            return;
        }

        setIsHolding(true);
        setHoldProgress(0);
        holdStartTimeRef.current = Date.now();

        // Native Haptic feedback for starting hold
        try {
            await Haptics.selectionStart();
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (_e) {
            // Haptics unavailable on web
        }

        holdTimerRef.current = window.setInterval(() => {
            const elapsed = Date.now() - holdStartTimeRef.current;
            const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                triggerCountdown();
            }
        }, 16);
    };

    const handleEndHold = () => {
        if (!countdown && !isSending && !isSent) {
            setIsHolding(false);
            setHoldProgress(0);
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        }
    };

    const triggerCountdown = async () => {
        setIsHolding(false);
        setCountdown(3);

        // Native Success Haptic
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (_e) {
            // Haptics unavailable on web
        }

        countdownTimerRef.current = window.setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    sendSos();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelSos = async () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdown(null);
        setIsHolding(false);
        setHoldProgress(0);
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (_e) {
            // Haptics unavailable on web
        }
    };

    const sendSos = async () => {
        setIsSending(true);
        setError(null);

        router.post(
            SosController.trigger.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: async () => {
                    setIsSending(false);
                    setIsSent(true);
                    _setAutoCloseSeconds(10);
                    // Strong haptic pattern for SOS trigger success
                    try {
                        await Haptics.notification({ type: NotificationType.Success });
                        setTimeout(() => Haptics.vibrate(), 200);
                        setTimeout(() => Haptics.vibrate(), 600);
                    } catch (_e) {
                        // Haptics unavailable on web
                    }
                },
                onError: (errors) => {
                    setIsSending(false);
                    setError(errors.error || 'Failed to send SOS');
                    try {
                        Haptics.notification({ type: NotificationType.Error });
                    } catch (_e) {
                        // Haptics unavailable on web
                    }
                    setTimeout(() => setError(null), 5000);
                },
            },
        );
    };

    // Progress circle SVG parameters for hold indicator
    const radius = variant === 'header' ? 16 : 14;
    const center = variant === 'header' ? 18 : 16;
    const svgSize = variant === 'header' ? 36 : 32;
    const circumference = 2 * Math.PI * radius;

    const renderHoldRing = (strokeColor: string, bgColor: string) => (
        <AnimatePresence>
            {isHolding && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                >
                    <svg className="h-full w-full -rotate-90 p-0.5" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke={bgColor}
                            strokeWidth="3"
                        />
                        <motion.circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke={strokeColor}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (circumference * holdProgress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
            )}
        </AnimatePresence>
    );

    let TriggerButton: React.ReactNode = null;

    if (variant === 'header') {
        TriggerButton = (
            <div className="relative flex items-center justify-center">
                <button
                    type="button"
                    aria-label={activeSos ? 'Active Emergency SOS - View Status' : 'Emergency SOS - Hold to activate'}
                    onPointerDown={handleStartHold}
                    onPointerUp={handleEndHold}
                    onPointerCancel={handleEndHold}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all select-none active:scale-95 touch-none ${
                        activeSos
                            ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    } ${className}`}
                >
                    {renderHoldRing('rgb(225, 29, 72)', 'rgba(225, 29, 72, 0.15)')}
                    <ShieldAlert
                        className={`h-5 w-5 relative z-20 ${activeSos ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}
                        strokeWidth={2}
                    />
                    {activeSos && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600"></span>
                        </span>
                    )}
                </button>

                {/* Compact Hold Indicator for Header */}
                <AnimatePresence>
                    {isHolding && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-black tracking-wider whitespace-nowrap text-white uppercase shadow-xl ring-1 ring-white/10 z-50"
                        >
                            HOLD FOR SOS
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    } else if (variant === 'command-center') {
        TriggerButton = (
            <div className="relative flex flex-col items-center">
                <button
                    type="button"
                    aria-label={activeSos ? 'Active Emergency SOS - View Status' : 'Emergency SOS - Hold to activate'}
                    onPointerDown={handleStartHold}
                    onPointerUp={handleEndHold}
                    onPointerCancel={handleEndHold}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`group relative flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all select-none active:scale-98 touch-none ${
                        activeSos
                            ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20'
                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    } ${className}`}
                >
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        {renderHoldRing('rgb(244, 63, 94)', 'rgba(255, 255, 255, 0.15)')}
                        <ShieldAlert
                            className={`h-4 w-4 relative z-20 ${
                                activeSos ? 'text-rose-400' : 'text-white/40 group-hover:text-white/80 transition-colors'
                            }`}
                            strokeWidth={2}
                        />
                    </div>
                    <span className="tracking-tight">
                        {activeSos ? 'Active Emergency SOS' : 'Emergency SOS'}
                    </span>
                    {activeSos && (
                        <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-300">
                            Live
                        </span>
                    )}
                </button>

                {/* Hold Hint for Command Center */}
                <AnimatePresence>
                    {isHolding && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-black tracking-wider whitespace-nowrap text-white uppercase backdrop-blur-md z-30"
                        >
                            KEEP HOLDING...
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    } else {
        // sidebar / mobile-menu
        TriggerButton = (
            <button
                type="button"
                aria-label={activeSos ? 'Active Emergency SOS - View Status' : 'Emergency SOS - Hold to activate'}
                onPointerDown={handleStartHold}
                onPointerUp={handleEndHold}
                onPointerCancel={handleEndHold}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all select-none active:scale-95 touch-none w-full ${
                    activeSos
                        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        : 'text-slate-600 hover:bg-slate-50'
                } ${className}`}
            >
                <div className="relative flex h-6 w-6 items-center justify-center">
                    {renderHoldRing('rgb(225, 29, 72)', 'rgba(225, 29, 72, 0.15)')}
                    <ShieldAlert
                        className={`h-5 w-5 relative z-20 ${activeSos ? 'text-rose-600' : 'text-slate-500'}`}
                        strokeWidth={2}
                    />
                </div>
                <span>{activeSos ? 'Active Emergency SOS' : 'Emergency SOS'}</span>
            </button>
        );
    }

    return (
        <>
            {TriggerButton}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {/* Countdown Overlay */}
                        {countdown !== null && (
                            <motion.div
                                layoutId="sos-button-morph"
                                className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#FFFBEB] p-6 text-[#111827] backdrop-blur-md"
                            >
                                <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-[#F59E0B]/10">
                                    <AlertTriangle className="h-16 w-16 animate-pulse text-[#F59E0B]" />
                                </div>
                                <h2 className="mb-2 text-4xl font-black tracking-tighter uppercase">SOS Launching</h2>
                                <p className="mb-12 text-center font-semibold text-[#6B7280]">Triggering emergency alert in...</p>

                                <div className="mb-16 text-[120px] leading-none font-black text-[#F59E0B]">{countdown}</div>

                                <button
                                    onClick={cancelSos}
                                    className="flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-xl font-black text-[#F59E0B] shadow-xl ring-1 ring-black/5 active:scale-95"
                                >
                                    <X className="h-6 w-6" />
                                    CANCEL NOW
                                </button>
                            </motion.div>
                        )}

                        {/* Sending / Sent / Status Overlay */}
                        {(isSending || isSent || isStatusOpen || error) && (
                            <motion.div
                                layoutId="sos-button-morph"
                                className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 backdrop-blur-md ${
                                    error ? 'bg-[#FEF2F2]' : isSending ? 'bg-[#F0F9FF]' : 'bg-[#F7F9FC]'
                                }`}
                            >
                                {isSending && (
                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/20"></div>
                                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
                                                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Alerting Security</h2>
                                        <p className="mt-2 text-center font-medium text-slate-500">Connecting to emergency responders...</p>
                                    </div>
                                )}

                                {(isSent || isStatusOpen) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative flex h-full w-full flex-col items-center bg-[#F7F9FC] p-6 text-[#111827] overflow-y-auto"
                                    >
                                        {/* Top Area (Status Icon + Message) */}
                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="relative mb-6">
                                                <div className={`absolute inset-0 scale-150 animate-pulse rounded-full ${activeSos?.acknowledged_at ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
                                                <div className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg ${activeSos?.acknowledged_at ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                                    {activeSos?.acknowledged_at ? <Check className="h-12 w-12" strokeWidth={3} /> : <ShieldAlert className="h-12 w-12" strokeWidth={2.5} />}
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight text-[#111827]">
                                                {activeSos?.acknowledged_at ? 'SOS Acknowledged' : 'SOS Active'}
                                            </h2>
                                            <div className="mt-2 text-center font-medium text-[#6B7280]">
                                                <p>
                                                    {activeSos?.acknowledged_at
                                                        ? 'Security has acknowledged your alert and is responding.'
                                                        : 'Security has been notified and alerted.'}
                                                </p>
                                                {sosSuccessData?.has_emergency_contacts ? (
                                                    <p>Emergency contacts are being alerted.</p>
                                                ) : (
                                                    <p className="mt-1 text-sm text-[#F59E0B]">
                                                        Add emergency contacts to notify loved ones in emergencies.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Information Card */}
                                        <div className="mt-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                                            <div className="flex items-center justify-between border-b border-[#E5E7EB] p-4">
                                                <div className="flex items-center gap-3 text-[#6B7280]">
                                                    <Hash className="h-5 w-5" />
                                                    <span className="text-sm font-semibold">Event ID</span>
                                                </div>
                                                <span className="font-mono font-bold text-[#111827]">
                                                    {sosSuccessData?.id || (activeSos?.id ? `#${activeSos.id}` : '#----')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3 text-[#6B7280]">
                                                    <Clock className="h-5 w-5" />
                                                    <span className="text-sm font-semibold">Status</span>
                                                </div>
                                                <span className="text-sm font-bold capitalize text-[#111827]">
                                                    {activeSos?.status || 'Active'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="mt-10 w-full max-w-sm">
                                            <h3 className="mb-6 text-lg font-black text-[#111827]">Response Timeline</h3>

                                            <div className="space-y-8">
                                                {/* Step 1 */}
                                                <div className="flex gap-4">
                                                    <div className="relative flex flex-col items-center">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10B981] text-white">
                                                            <Check className="h-5 w-5" />
                                                        </div>
                                                        <div className="absolute top-8 bottom-[-32px] w-0.5 bg-[#10B981]"></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#111827]">Security notified</p>
                                                        <p className="text-sm text-[#6B7280]">Emergency alert dispatched</p>
                                                    </div>
                                                </div>

                                                {/* Step 2 */}
                                                <div className="flex gap-4">
                                                    <div className="relative flex flex-col items-center">
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                                                                activeSos?.acknowledged_at
                                                                    ? 'bg-[#10B981]'
                                                                    : 'bg-[#F59E0B]'
                                                            }`}
                                                        >
                                                            {activeSos?.acknowledged_at ? (
                                                                <Check className="h-5 w-5" />
                                                            ) : (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            )}
                                                        </div>
                                                        <div className="absolute top-8 bottom-[-32px] w-0.5 bg-[#E5E7EB]"></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#111827]">
                                                            {activeSos?.acknowledged_at
                                                                ? 'Security Acknowledged'
                                                                : 'Awaiting Acknowledgment'}
                                                        </p>
                                                        <p className="text-sm text-[#6B7280]">
                                                            {activeSos?.acknowledged_at
                                                                ? 'Responder assigned & on the way'
                                                                : 'Security team currently being reached'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Step 3 */}
                                                <div className="flex gap-4">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                                                        activeSos?.acknowledged_at ? 'bg-indigo-600' : 'bg-[#E5E7EB] text-[#6B7280]'
                                                    }`}>
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#111827]">On-Site Assistance</p>
                                                        <p className="text-sm text-[#6B7280]">
                                                            {activeSos?.acknowledged_at
                                                                ? 'Help is on the way to your unit'
                                                                : 'Responders will verify your location'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Message */}
                                        <div className="mt-auto mb-8 w-full max-w-sm pt-6">
                                            {!sosSuccessData?.has_emergency_contacts && (
                                                <Link
                                                    href={ProfileController.edit.url({ query: { open: 'emergency_management' } })}
                                                    className="mb-6 flex w-full items-center justify-between rounded-2xl bg-[#F59E0B]/10 p-4 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B] text-white">
                                                            <Users className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black tracking-tight uppercase">Add Emergency Contacts</p>
                                                            <p className="text-[10px] font-bold uppercase opacity-80">Protect your loved ones</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5" />
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setIsSent(false);
                                                    setIsStatusOpen(false);
                                                }}
                                                className="w-full rounded-xl border-2 border-slate-900 bg-slate-900 py-4 text-base font-bold text-white shadow-lg active:scale-[0.98]"
                                            >
                                                Dismiss Status
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                                            <AlertTriangle className="h-12 w-12 text-red-600" />
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Trigger Failed</h2>
                                        <p className="mt-2 max-w-xs font-medium text-slate-500">{error}</p>
                                        <button
                                            onClick={() => setError(null)}
                                            className="mt-10 w-full max-w-xs rounded-2xl bg-slate-900 py-4 text-lg font-black text-white shadow-lg active:scale-95"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
}
