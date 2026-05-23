import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { router, usePage, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, Loader2, Hash, Check, Clock, Shield, Users, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ProfileController from '@/actions/App/Http/Controllers/Resident/ProfileController';
import SosController from '@/actions/App/Http/Controllers/Resident/SosController';
import type { SharedData } from '@/types';

interface Props {
    variant?: 'floating' | 'header';
}

export default function SosButton({ variant = 'floating' }: Props) {
    const { props } = usePage<SharedData>();
    const sosSuccessData = props.flash?.sos_success as { id: string; time: string; has_emergency_contacts: boolean } | null;

    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [autoCloseSeconds, setAutoCloseSeconds] = useState(10);

    const holdTimerRef = useRef<number | null>(null);
    const countdownTimerRef = useRef<number | null>(null);
    const autoCloseTimerRef = useRef<number | null>(null);
    const holdStartTimeRef = useRef<number>(0);

    const HOLD_DURATION = 1500; // 1.5 seconds

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleStartHold = async () => {
        setIsHolding(true);
        setHoldProgress(0);
        holdStartTimeRef.current = Date.now();

        // Native Haptic feedback for starting hold
        try {
            await Haptics.selectionStart();
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {}

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
        } catch (e) {}

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
        } catch (e) {}
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
                    setAutoCloseSeconds(10);
                    // Strong haptic pattern for SOS trigger success
                    try {
                        await Haptics.notification({ type: NotificationType.Success });
                        setTimeout(() => Haptics.vibrate(), 200);
                        setTimeout(() => Haptics.vibrate(), 600);
                    } catch (e) {}

                    // Start auto-close countdown
                    /* Disabling auto-close for UI inspection as requested
                    autoCloseTimerRef.current = window.setInterval(() => {
                        setAutoCloseSeconds((prev) => {
                            if (prev <= 1) {
                                if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
                                setIsSent(false);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    */
                },
                onError: (errors) => {
                    setIsSending(false);
                    setError(errors.error || 'Failed to send SOS');
                    try {
                        Haptics.notification({ type: NotificationType.Error });
                    } catch (e) {}
                    setTimeout(() => setError(null), 5000);
                },
            },
        );
    };

    const buttonClass =
        variant === 'floating'
            ? 'relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl ring-4 ring-red-100 transition-colors active:bg-red-700 touch-none'
            : 'relative flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 transition-colors active:bg-red-100 touch-none';

    const iconSize = variant === 'floating' ? 'h-8 w-8' : 'h-5 w-5';
    const radius = variant === 'floating' ? 30 : 20;
    const center = variant === 'floating' ? 32 : 22;
    const svgSize = variant === 'floating' ? 64 : 44;
    const circumference = 2 * Math.PI * radius;

    const TriggerButton = (
        <div className="relative flex items-center justify-center">
            <motion.button
                layoutId="sos-button-morph"
                onPointerDown={handleStartHold}
                onPointerUp={handleEndHold}
                onPointerCancel={handleEndHold}
                onContextMenu={(e) => e.preventDefault()}
                whileTap={{ scale: 0.92 }}
                className={`${buttonClass} overflow-hidden`}
            >
                {/* Hold Progress Circle Overlay */}
                <AnimatePresence>
                    {isHolding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute inset-0 z-10"
                        >
                            <svg className="h-full w-full -rotate-90 p-1" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke={variant === 'floating' ? 'rgba(255,255,255,0.2)' : 'rgba(220,38,38,0.1)'}
                                    strokeWidth={variant === 'floating' ? '6' : '4'}
                                />
                                <motion.circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke={variant === 'floating' ? 'white' : 'rgb(220,38,38)'}
                                    strokeWidth={variant === 'floating' ? '6' : '4'}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (circumference * holdProgress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ShieldAlert className={`${iconSize} relative z-20`} strokeWidth={2.5} />
            </motion.button>
        </div>
    );

    return (
        <>
            {/* Trigger placement */}
            {variant === 'floating' ? (
                <div className="fixed right-6 bottom-24 z-40">
                    {TriggerButton}

                    {/* Hold Label */}
                    <AnimatePresence>
                        {isHolding && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-black px-3 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap text-white uppercase"
                            >
                                Hold for SOS
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="relative">
                    {TriggerButton}
                    {/* Compact Hold Label */}
                    <AnimatePresence>
                        {isHolding && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-14 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase shadow-xl ring-1 ring-white/10"
                            >
                                HOLD TO TRIGGER
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

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

                        {/* Sending / Sent Overlay */}
                        {(isSending || isSent || error) && (
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

                                {isSent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative flex h-full w-full flex-col items-center bg-[#F7F9FC] p-6 text-[#111827]"
                                    >
                                        {/* Top Area (Status Icon + Message) */}
                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-[#10B981]/20"></div>
                                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg">
                                                    <Check className="h-12 w-12" strokeWidth={3} />
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight text-[#111827]">SOS Sent</h2>
                                            <div className="mt-2 text-center font-medium text-[#6B7280]">
                                                <p>Security has been notified.</p>
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
                                                <span className="font-mono font-bold text-[#111827]">{sosSuccessData?.id || '#----'}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3 text-[#6B7280]">
                                                    <Clock className="h-5 w-5" />
                                                    <span className="text-sm font-semibold">Time</span>
                                                </div>
                                                <span className="text-sm font-bold text-[#111827]">{sosSuccessData?.time || '--:--'}</span>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="mt-10 w-full max-w-sm">
                                            <h3 className="mb-6 text-lg font-black text-[#111827]">What happens next</h3>

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
                                                        <p className="text-sm text-[#6B7280]">Alert sent to security team</p>
                                                    </div>
                                                </div>

                                                {/* Step 2 */}
                                                <div className="flex gap-4">
                                                    <div className="relative flex flex-col items-center">
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${sosSuccessData?.has_emergency_contacts ? 'bg-[#F59E0B]' : 'bg-[#E5E7EB] text-[#6B7280]'}`}
                                                        >
                                                            {sosSuccessData?.has_emergency_contacts ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <Users className="h-5 w-5" />
                                                            )}
                                                        </div>
                                                        <div className="absolute top-8 bottom-[-32px] w-0.5 bg-[#E5E7EB]"></div>
                                                    </div>
                                                    <div>
                                                        <p
                                                            className={`font-bold ${sosSuccessData?.has_emergency_contacts ? 'text-[#111827]' : 'text-[#6B7280]'}`}
                                                        >
                                                            {sosSuccessData?.has_emergency_contacts
                                                                ? 'Emergency contacts alerted'
                                                                : 'No emergency contacts'}
                                                        </p>
                                                        <p className="text-sm text-[#6B7280]">
                                                            {sosSuccessData?.has_emergency_contacts
                                                                ? 'Sending alerts to your contacts'
                                                                : 'Setup contacts to alert them in future'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Step 3 */}
                                                <div className="flex gap-4">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E7EB] text-[#6B7280]">
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#111827]">Stay calm, help is on the way</p>
                                                        <p className="text-sm text-[#6B7280]">We've got you covered</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Message */}
                                        <div className="mt-auto mb-8 w-full max-w-sm">
                                            {!sosSuccessData?.has_emergency_contacts && (
                                                <Link
                                                    href={ProfileController.edit.url({ query: { open: 'emergency_contacts' } })}
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

                                            <div className="mb-8 flex items-center gap-3 rounded-xl bg-[#10B981]/10 p-4 text-[#10B981]">
                                                <Shield className="h-6 w-6" />
                                                <p className="text-sm font-bold">You're in safe hands. Help is on the way.</p>
                                            </div>

                                            {/* <p className="mb-4 text-center text-sm font-medium text-[#6B7280]">Closing in {autoCloseSeconds}...</p> */}

                                            <button
                                                onClick={() => setIsSent(false)}
                                                className="w-full rounded-xl border-2 border-[#10B981] py-4 text-lg font-black text-[#10B981] active:scale-[0.98]"
                                            >
                                                Close
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
