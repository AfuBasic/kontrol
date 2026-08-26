import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';
import { CameraOff, Loader2, QrCode, ShieldX, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import VerificationResultCard from '@/Components/Security/VerificationResultCard';
import { type ValidationResult } from '@/Components/Security/verificationDecision';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import SecurityLayout from '@/Layouts/SecurityLayout';
import { SyncEngine } from '@/Resilience/SyncEngine';
import { SecurityStore, sha256 } from '@/Resilience/OfflineStorage/SecurityStore';
import { SyncStatus } from '@/Resilience/SyncStatus';

const CODE_LENGTH = 6;
const SYNC_ENDPOINT = '/security/verify/sync';

interface PageProps {
    estateName: string;
    gateName: string;
    flash?: {
        validation_result?: ValidationResult;
    };
    [key: string]: unknown;
}

function cameraErrorMessage(err: unknown): string {
    const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return 'Camera permission denied - use manual code entry below';
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return 'No camera detected - use manual code entry below';
    }

    if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'Camera is in use by another app - use manual code entry below';
    }

    return 'Camera unavailable - use manual code entry below';
}

export default function SecurityVerify() {
    const {
        flash,
        accessCodesEnabled = true,
        visitorCheckoutEnabled: _visitorCheckoutEnabled = true,
        requireVehicleInformation: _requireVehicleInformation = false,
    } = usePage<PageProps>().props;
    const { quality, isOnline, isServerReachable } = useNetworkQuality();
    const { pendingCount, isSyncing, syncNow } = useSyncStatus();
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const submittedFor = useRef<string | null>(null);

    // QR Code Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Offline cache inventory
    const [cachedCodesCount, setCachedCodesCount] = useState<number | null>(null);
    const [refreshingCache, setRefreshingCache] = useState(false);

    const securityPendingCount = pendingCount;
    const offlineWithEmptyCache = !isOnline && cachedCodesCount === 0;

    const refreshCodeCache = useCallback(async () => {
        const online = await isServerReachable(3000, SYNC_ENDPOINT);
        if (!online) {
            return;
        }

        setRefreshingCache(true);
        try {
            await syncNow();

            // Drop local mirror of pending logs once the engine has no security ops left.
            const state = await SyncEngine.getState();
            const hasSecurityPending = state.operations.some(
                (op) =>
                    op.type === 'security_log' &&
                    (op.status === SyncStatus.Pending || op.status === SyncStatus.Syncing || op.status === SyncStatus.Failed),
            );
            if (!hasSecurityPending) {
                await SecurityStore.clearPendingLogs();
            }

            const response = await axios.get(SYNC_ENDPOINT, {
                headers: { Accept: 'application/json' },
            });
            if (response.data?.success && response.data.codes) {
                await SecurityStore.saveActiveCodes(response.data.codes);
                setCachedCodesCount(response.data.codes.length);
            }
        } catch (err) {
            console.error('Offline cache refresh failed:', err);
        } finally {
            setRefreshingCache(false);
        }
    }, [isServerReachable, syncNow]);

    useEffect(() => {
        SecurityStore.countActiveCodes()
            .then(setCachedCodesCount)
            .catch(() => setCachedCodesCount(0));
    }, []);

    const hasInitialRefreshed = useRef(false);

    useEffect(() => {
        if (!isOnline) {
            hasInitialRefreshed.current = false;
        } else if (!hasInitialRefreshed.current) {
            hasInitialRefreshed.current = true;
            void refreshCodeCache();
        }
    }, [isOnline, refreshCodeCache]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isOnline) {
                void refreshCodeCache();
            }
        }, 120_000);

        return () => clearInterval(interval);
    }, [isOnline, refreshCodeCache]);

    useEffect(() => {
        if (flash?.validation_result) {
            setResult(flash.validation_result);
            setSubmitting(false);
        }
    }, [flash?.validation_result]);

    useEffect(() => {
        if (!result && !isScanning) {
            const timer = setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [result, isScanning]);

    const submit = useCallback(
        async (code: string, source?: 'scanned' | 'typed') => {
            if (submittedFor.current === code) return;
            submittedFor.current = code;
            setSubmitting(true);

            const online = await isServerReachable(2000, SYNC_ENDPOINT);
            if (!online) {
                try {
                    const codeHash = await sha256(code);
                    const cached = await SecurityStore.findActiveCode(codeHash);

                    if (cached) {
                        setResult({
                            valid: true,
                            status: 'granted',
                            message: 'Access code validated offline',
                            visitor_name: cached.visitor_name,
                            host_name: cached.host_name,
                            purpose: cached.purpose || null,
                            expires_at: cached.expires_at,
                            code_type: cached.code_type || null,
                            has_vehicle: cached.has_vehicle,
                            guest_limit: cached.guest_limit || null,
                            uses_count: cached.uses_count || 0,
                            starts_at: cached.starts_at || null,
                            offline: true,
                        });
                    } else {
                        setResult({
                            valid: false,
                            status: 'offline_not_found',
                            message: 'Code Not Recognized Offline',
                            visitor_name: null,
                            host_name: null,
                            purpose: null,
                            expires_at: null,
                            code_type: null,
                            has_vehicle: false,
                            offline: true,
                        });
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            try {
                const response = await axios.post(
                    VerifyController.validate.url(),
                    { code, source },
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );
                if (response.data?.validation_result) {
                    setResult({ ...response.data.validation_result, offline: false });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setSubmitting(false);
            }
        },
        [isServerReachable],
    );

    // FIXED: Unified Sequential Processing Pipeline
    useEffect(() => {
        if (!isScanning) return;

        let isComponentActive = true;

        const startCameraAndScan = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });

                if (!isComponentActive) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    await videoRef.current.play().catch(() => {});
                }

                const hasNative = 'BarcodeDetector' in window;

                let detector: any = null;

                if (hasNative) {
                    try {
                        detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                    } catch {
                        // ignore native BarcodeDetector initialization errors
                    }
                }

                // Create offscreen canvas asset layers ONCE to protect GPU memory context
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                let dimensionsSet = false;

                const scanFrame = async () => {
                    // Check absolute kill switches before executing evaluation cycle
                    if (!isComponentActive || !isScanning) return;

                    const video = videoRef.current;
                    if (!video || video.paused || video.ended) {
                        // Safe loop re-entry point if video device is temporarily buffer-cycling
                        animationFrameRef.current = requestAnimationFrame(scanFrame);
                        return;
                    }

                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        // Set dimensions once instead of thrashing backing stores on every tick
                        if (!dimensionsSet || canvas.width !== video.videoWidth) {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            dimensionsSet = true;
                        }

                        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                        let decodedValue = '';

                        // 1. Primary Native Evaluation Route
                        if (detector) {
                            try {
                                const barcodes = await detector.detect(canvas);
                                if (barcodes.length > 0) {
                                    decodedValue = barcodes[0].rawValue;
                                }
                            } catch {
                                console.warn('Native barcode matching slipped, using jsQR fallback.');
                            }
                        }

                        // 2. Secondary Fallback Engine Layer
                        if (!decodedValue && jsQR && ctx) {
                            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const codeObj = jsQR(imgData.data, imgData.width, imgData.height, {
                                inversionAttempts: 'attemptBoth', // Patched to intercept low-light items
                            });
                            if (codeObj) decodedValue = codeObj.data;
                        }

                        if (decodedValue) {
                            if (navigator.vibrate) navigator.vibrate(150);
                            setIsScanning(false); // Shuts down execution blocks cleanly
                            submit(decodedValue, 'scanned');
                            return; // Terminates loop sequence
                        }
                    }

                    // FIXED: Schedule the next evaluation frame ONLY when processing has fully finished
                    animationFrameRef.current = requestAnimationFrame(scanFrame);
                };

                animationFrameRef.current = requestAnimationFrame(scanFrame);
            } catch (err) {
                console.error('Camera access failed:', err);
                setScannerError(cameraErrorMessage(err));
                setIsScanning(false);
                // Manual entry remains the primary path - focus first digit.
                setTimeout(() => inputsRef.current[0]?.focus(), 100);
            }
        };

        const initTimeout = setTimeout(startCameraAndScan, 200);

        return () => {
            isComponentActive = false;
            clearTimeout(initTimeout);

            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isScanning, submit]);

    const updateDigit = (index: number, raw: string) => {
        const sanitized = raw
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, CODE_LENGTH);

        if (sanitized.length > 1) {
            const next = Array(CODE_LENGTH).fill('');
            for (let i = 0; i < Math.min(sanitized.length, CODE_LENGTH); i++) {
                next[i] = sanitized[i];
            }
            setDigits(next);
            const focusIndex = Math.min(sanitized.length, CODE_LENGTH - 1);
            inputsRef.current[focusIndex]?.focus();
            if (sanitized.length === CODE_LENGTH) {
                submit(next.join(''));
            }
            return;
        }

        const next = [...digits];
        next[index] = sanitized;
        setDigits(next);

        if (sanitized && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        if (next.every((d) => d.length === 1)) {
            submit(next.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
            const next = [...digits];
            next[index - 1] = '';
            setDigits(next);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
            e.preventDefault();
        }
    };

    const reset = useCallback(() => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setResult(null);
        submittedFor.current = null;
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }, []);

    const recordDecision = async (
        decision: 'admit' | 'reject' | 'checkout',
        extraData: {
            vehicle_make?: string;
            vehicle_model?: string;
            vehicle_plate_number?: string;
            access_log_id?: number | null;
        } = {},
    ) => {
        const code = submittedFor.current;
        if (!code) {
            reset();
            return;
        }

        const online = await isServerReachable(2000, SYNC_ENDPOINT);
        if (!online) {
            // Checkout requires live server state; only queue admit/reject offline.
            if (decision === 'admit' || decision === 'reject') {
                try {
                    const log = {
                        code,
                        decision,
                        vehicle_make: extraData.vehicle_make,
                        vehicle_model: extraData.vehicle_model,
                        vehicle_plate_number: extraData.vehicle_plate_number,
                        created_at: new Date().toISOString(),
                    };

                    await SecurityStore.queueOfflineLog(log);
                    await SyncEngine.enqueue({
                        type: 'security_log',
                        endpoint: SYNC_ENDPOINT,
                        method: 'POST',
                        payload: { logs: [log] },
                        retryPolicyKey: 'security_log',
                    });
                } catch (err) {
                    console.error('Failed to queue offline log:', err);
                }
            }
            reset();
            return;
        }

        try {
            const res = await axios.post(
                VerifyController.decision.url(),
                {
                    decision,
                    code,
                    ...extraData,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (decision === 'checkout') {
                const checkoutData = res.data || {};
                setResult((prev) => ({
                    valid: true,
                    status: 'checked_out_success',
                    message: 'Visitor successfully checked out',
                    visitor_name: prev?.visitor_name || null,
                    host_name: prev?.host_name || null,
                    purpose: prev?.purpose || null,
                    expires_at: prev?.expires_at || null,
                    code_type: prev?.code_type || null,
                    checked_out_at: checkoutData.checked_out_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    exit_point: checkoutData.exit_point || 'Main Gate',
                    duration_minutes: checkoutData.duration_minutes ?? 0,
                    has_vehicle: false,
                }));
            } else {
                reset();
            }
        } catch (err: any) {
            console.error('Decision error:', err);
            const errorMessage =
                err.response?.data?.errors?.checkout?.[0] || err.response?.data?.message || 'Checkout rejected: Gate mismatch or invalid request.';

            setResult((prev) => ({
                valid: false,
                status: 'checkout_mismatch',
                message: errorMessage,
                visitor_name: prev?.visitor_name || null,
                host_name: prev?.host_name || null,
                purpose: prev?.purpose || null,
                expires_at: prev?.expires_at || null,
                code_type: prev?.code_type || null,
                has_vehicle: false,
            }));
        }
    };

    return (
        <>
            <Head title="Verify Access · Security" />

            <main className={`mx-auto flex w-full max-w-xl flex-1 flex-col ${result ? '-mx-4 -mt-4 sm:mx-0 sm:mt-0' : 'px-4 pt-8 pb-6 sm:px-8'}`}>
                {/* Offline & Sync Status Banner */}
                <AnimatePresence>
                    {!isOnline && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between rounded-2xl border border-amber-500/15 bg-linear-to-r from-amber-500/8 via-orange-500/5 to-amber-500/8 p-3.5 shadow-sm backdrop-blur-md dark:border-amber-500/10 dark:from-amber-500/5 dark:to-orange-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                        <WifiOff className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-extrabold tracking-wide text-amber-800 dark:text-amber-400">
                                            Offline Mode Active
                                        </span>
                                        <span className="text-[10px] font-bold text-amber-600/85 dark:text-amber-500/80">
                                            {offlineWithEmptyCache
                                                ? 'No offline pass cache - manual entry still available'
                                                : 'Verifying codes locally via encrypted cache'}
                                        </span>
                                    </div>
                                </div>
                                {securityPendingCount > 0 && (
                                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-mono text-[10px] font-black tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                        {securityPendingCount} Queue
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {!accessCodesEnabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center shadow-sm">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                    <ShieldX className="h-6 w-6" />
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900">Visitor Pass Verification Disabled</h3>
                                <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-slate-600">
                                    Visitor access code generation and gate verification are currently turned off by estate management policy.
                                </p>
                            </div>
                        </motion.div>
                    )}
                    {offlineWithEmptyCache && !result && !isScanning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-left shadow-sm">
                                <p className="text-sm font-black text-amber-900">No offline codes available</p>
                                <p className="mt-1 text-xs leading-relaxed font-semibold text-amber-800/90">
                                    Connect to the internet once to download offline pass data. Manual code entry is still available.
                                </p>
                            </div>
                        </motion.div>
                    )}
                    {isOnline && (securityPendingCount > 0 || isSyncing || refreshingCache) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between rounded-2xl border border-indigo-500/15 bg-linear-to-r from-indigo-500/8 via-purple-500/5 to-indigo-500/8 p-3.5 shadow-sm backdrop-blur-md dark:border-indigo-500/10 dark:from-indigo-500/5 dark:to-purple-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-extrabold tracking-wide text-indigo-800 dark:text-indigo-400">
                                            {securityPendingCount > 0 ? 'Synchronizing Logs' : 'Refreshing offline cache'}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-600/85 dark:text-indigo-500/85">
                                            {securityPendingCount > 0
                                                ? `Uploading ${securityPendingCount} queued check-ins to server...`
                                                : quality === 'poor'
                                                  ? 'Limited connectivity - cache update may be slow'
                                                  : 'Downloading latest pass hashes...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {submitting ? (
                        <motion.div
                            key="validating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-1 flex-col items-center justify-center pt-10 text-center"
                        >
                            <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-50 shadow-sm ring-1 ring-slate-200">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            </div>
                            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Verification in progress</p>
                            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Validating Access Code</h1>
                            <p className="mt-3 text-sm text-slate-500">Checking credentials with the gate server...</p>
                        </motion.div>
                    ) : result ? (
                        <VerificationResultCard
                            key="result"
                            result={result}
                            onAdmit={(data) => recordDecision('admit', { ...data, access_log_id: result.access_log_id })}
                            onCheckout={() => recordDecision('checkout')}
                            onReset={reset}
                        />
                    ) : isScanning ? (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-1 flex-col items-center justify-center pt-6 text-center"
                        >
                            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">QR scan terminal</p>
                            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Scan Visitor QR Pass</h1>

                            <div className="relative mt-8 h-80 w-80 overflow-hidden rounded-[2.5rem] bg-black shadow-2xl ring-4 ring-indigo-500/20">
                                <video
                                    ref={videoRef}
                                    className="h-full w-full object-cover"
                                    playsInline
                                    autoPlay // Added to guarantee runtime thread pickup by default
                                    muted
                                />
                                <div className="absolute inset-x-0 top-0 h-1 animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]" />
                                <div className="absolute top-6 left-6 h-6 w-6 rounded-tl-md border-t-4 border-l-4 border-white/80" />
                                <div className="absolute top-6 right-6 h-6 w-6 rounded-tr-md border-t-4 border-r-4 border-white/80" />
                                <div className="absolute bottom-6 left-6 h-6 w-6 rounded-bl-md border-b-4 border-l-4 border-white/80" />
                                <div className="absolute right-6 bottom-6 h-6 w-6 rounded-br-md border-r-4 border-b-4 border-white/80" />
                            </div>

                            <p className="mt-6 text-sm font-bold text-slate-400">Position the QR code inside the frame</p>

                            <button
                                onClick={() => setIsScanning(false)}
                                className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-100 px-8 py-4 text-sm font-black text-slate-900 transition-all active:scale-95"
                            >
                                <CameraOff className="h-4 w-4" />
                                Use Fallback Code
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-1 flex-col items-center justify-center pt-10"
                        >
                            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Verification Terminal</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Enter Access Code</h1>

                            <div className="mt-12 flex items-center gap-2 sm:gap-4" role="group" aria-label="Access code">
                                {digits.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => {
                                            inputsRef.current[i] = el;
                                        }}
                                        value={digit}
                                        onChange={(e) => updateDigit(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onFocus={(e) => e.currentTarget.select()}
                                        inputMode="text"
                                        autoCapitalize="characters"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        autoComplete="off"
                                        maxLength={CODE_LENGTH}
                                        disabled={submitting}
                                        className="h-16 w-12 rounded-2xl border-2 border-slate-200 bg-white text-center font-mono text-3xl font-black tracking-tight text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-60 sm:h-20 sm:w-16 sm:text-4xl"
                                        aria-label={`Code character ${i + 1}`}
                                    />
                                ))}
                            </div>

                            {scannerError && (
                                <p className="mt-4 max-w-xs rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
                                    {scannerError}
                                </p>
                            )}

                            <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-4">
                                <button
                                    onClick={() => {
                                        setScannerError(null);
                                        setIsScanning(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4.5 text-sm font-black text-white shadow-xl shadow-indigo-500/10 transition-all hover:bg-indigo-700 active:scale-95"
                                >
                                    <QrCode className="h-5 w-5" />
                                    Scan QR Pass
                                </button>
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-1">
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                        <span className="text-sm font-bold text-slate-500">Validating...</span>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-slate-400">Code validates automatically as you type</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}

SecurityVerify.layout = (page: React.ReactNode) => <SecurityLayout variant="light">{page}</SecurityLayout>;
