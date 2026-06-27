import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';
import { ArrowLeft, ShieldCheck, ShieldX, User, Home as HomeIcon, Clock, Car, Loader2, QrCode, CameraOff, WifiOff, Calendar, Users, Tag } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import SecurityLayout from '@/Layouts/SecurityLayout';
import { offlineDb, sha256 } from '@/Utils/offlineDb';

const CODE_LENGTH = 6;

type ValidationResult = {
    valid: boolean;
    status: string;
    message: string;
    visitor_name: string | null;
    host_name: string | null;
    purpose: string | null;
    expires_at: string | null;
    code_type: string | null;
    has_vehicle: boolean;
    access_log_id?: number | null;
    guest_limit?: number | null;
    uses_count?: number;
    starts_at?: string | null;
    action?: string | null;
    checked_in_at?: string | null;
};

interface PageProps {
    estateName: string;
    gateName: string;
    flash?: {
        validation_result?: ValidationResult;
    };
    [key: string]: unknown;
}

function formatExpiry(iso: string | null) {
    if (!iso) return null;
    const date = new Date(iso);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Expired';
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins}m`;
}

function formatDateTime(iso: string | null) {
    if (!iso) return null;
    try {
        const date = new Date(iso);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return null;
    }
}

function getPassTypeLabel(type: string | null) {
    switch (type) {
        case 'single_use':
            return 'One-Time Pass';
        case 'long_lived':
            return 'Recurring Pass';
        case 'event':
            return 'Event Pass';
        default:
            return 'Visitor Pass';
    }
}

async function checkServerReachable(timeoutMs = 2000): Promise<boolean> {
    if (!navigator.onLine) return false;
    try {
        const response = await axios.get('/security/verify/sync', {
            method: 'HEAD',
            params: { ping: Date.now() },
            timeout: timeoutMs,
        });
        return response.status === 200 || response.status === 404 || response.status === 405;
    } catch {
        return false;
    }
}

export default function SecurityVerify() {
    const { flash } = usePage<PageProps>().props;
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

    // Offline / Sync State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [pendingLogsCount, setPendingLogsCount] = useState(0);

    const syncOfflineLogsAndData = useCallback(async () => {
        if (syncing) return;
        const online = await checkServerReachable(3000);
        setIsOnline(online);
        if (!online) return;
        setSyncing(true);

        try {
            // 1. Sync pending check-in logs
            const pending = await offlineDb.getPendingLogs();
            if (pending.length > 0) {
                const response = await axios.post('/security/verify/sync', { logs: pending });
                if (response.data?.success) {
                    await offlineDb.clearPendingLogs();
                    setPendingLogsCount(0);
                }
            }

            // 2. Fetch new active code hashes to cache
            const response = await axios.get('/security/verify/sync');
            if (response.data?.success && response.data.codes) {
                await offlineDb.saveActiveCodes(response.data.codes);
            }
        } catch (err) {
            console.error('Offline sync failed:', err);
        } finally {
            setSyncing(false);
        }
    }, [syncing]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineLogsAndData();
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Run sync on load if online
        if (navigator.onLine) {
            syncOfflineLogsAndData();
        }

        // Get initial pending count
        offlineDb.getPendingLogs().then((logs) => {
            setPendingLogsCount(logs.length);
        });

        // Sync periodically every 2 minutes
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncOfflineLogsAndData();
            }
        }, 120000);

        // Periodic reachability heartbeat to auto-recover when online status is restored (webview support)
        const reachabilityInterval = setInterval(async () => {
            if (navigator.onLine) {
                const online = await checkServerReachable(2000);
                if (online !== isOnline) {
                    setIsOnline(online);
                    if (online) {
                        syncOfflineLogsAndData();
                    }
                }
            } else if (isOnline) {
                setIsOnline(false);
            }
        }, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
            clearInterval(reachabilityInterval);
        };
    }, [isOnline, syncOfflineLogsAndData]);

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

    const submit = useCallback(async (code: string, source?: 'scanned' | 'typed') => {
        if (submittedFor.current === code) return;
        submittedFor.current = code;
        setSubmitting(true);

        const online = await checkServerReachable(2000);
        setIsOnline(online);
        if (!online) {
            try {
                const codeHash = await sha256(code);
                const cached = await offlineDb.findActiveCode(codeHash);

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
                setResult(response.data.validation_result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }, []);

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
                setScannerError('Camera access denied or unavailable. Please use manual fallback.');
                setIsScanning(false);
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

    const reset = () => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setResult(null);
        submittedFor.current = null;
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
    };

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

        const online = await checkServerReachable(2000);
        setIsOnline(online);
        if (!online) {
            try {
                await offlineDb.queueOfflineLog({
                    code,
                    decision,
                    vehicle_make: extraData.vehicle_make,
                    vehicle_model: extraData.vehicle_model,
                    vehicle_plate_number: extraData.vehicle_plate_number,
                    created_at: new Date().toISOString(),
                });
                const logs = await offlineDb.getPendingLogs();
                setPendingLogsCount(logs.length);
            } catch (err) {
                console.error('Failed to queue offline log:', err);
            } finally {
                reset();
            }
            return;
        }

        try {
            await axios.post(
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
        } catch (err) {
            console.error(err);
        } finally {
            reset();
        }
    };

    return (
        <>
            <Head title="Verify Access · Security" />

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-8 pb-6 sm:px-8">
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
                                            Verifying codes locally via encrypted cache
                                        </span>
                                    </div>
                                </div>
                                {pendingLogsCount > 0 && (
                                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-mono text-[10px] font-black tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                        {pendingLogsCount} Queue
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {isOnline && pendingLogsCount > 0 && (
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
                                            Synchronizing Logs
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-600/85 dark:text-indigo-500/85">
                                            Uploading {pendingLogsCount} queued check-ins to server...
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
                        <ResultPanel
                            key="result"
                            result={result}
                            onAdmit={(data) => recordDecision('admit', { ...data, access_log_id: result.access_log_id })}
                            onReject={(data) => recordDecision('reject', data)}
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

                            {scannerError && <p className="mt-4 text-xs font-bold text-rose-500">{scannerError}</p>}

                            <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-4">
                                <button
                                    onClick={() => setIsScanning(true)}
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

type ResultPanelProps = {
    result: ValidationResult;
    onAdmit: (data?: Record<string, unknown>) => void;
    onReject?: (data?: Record<string, unknown>) => void;
    onCheckout: () => void;
    onReset: () => void;
};

function ResultPanel({ result, onAdmit, onReject, onCheckout, onReset }: ResultPanelProps) {
    const valid = result.valid;
    const expiry = formatExpiry(result.expires_at);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!valid || result.status === 'offline_not_found' || result.has_vehicle || result.action === 'checkout_pending') {
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onReset();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [valid, result.has_vehicle, result.status, onReset]);

    if (result.status === 'offline_not_found') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center pt-10 text-center"
            >
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-amber-50 text-amber-500 ring-4 ring-amber-500/5">
                    <WifiOff className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Code Not Recognized Offline</h2>

                <div className="mt-4 max-w-sm space-y-4 px-4 text-center">
                    <p className="text-sm leading-relaxed font-semibold text-slate-500">
                        This code is not in our offline cache. If this code was created recently, connect this device to the internet to verify it
                        online.
                    </p>

                    <div className="text-indigo-850 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-left text-xs leading-relaxed font-semibold dark:border-indigo-950/20 dark:bg-indigo-950/10 dark:text-indigo-400">
                        <p className="mb-1 text-[10px] font-extrabold tracking-wider uppercase">Visual Verification Option</p>
                        If the visitor displays their valid app pass visually on their phone showing the resident's name, host's villa, and timestamp,
                        you can manually admit them.
                    </div>
                </div>

                <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                    <button
                        onClick={() => onAdmit({ override: true })}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/10 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        Manually Admit Visitor
                    </button>
                    <button
                        onClick={onReset}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-900 transition-all active:scale-95"
                    >
                        Try another code
                    </button>
                </div>
            </motion.div>
        );
    }

    if (!valid) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center pt-10 text-center"
            >
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-rose-50 text-rose-500 ring-4 ring-rose-500/5">
                    <ShieldX className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Invalid Code</h2>
                <p className="mt-3 max-w-xs text-lg font-medium text-slate-500">{result.message}</p>

                <button
                    onClick={onReset}
                    className="mt-12 flex items-center gap-3 rounded-2xl bg-slate-100 px-8 py-4 text-sm font-black text-slate-900 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Try another code
                </button>
            </motion.div>
        );
    }

    const isCheckoutPending = result.action === 'checkout_pending';

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
                    <div className="flex flex-col items-center px-8 pt-12 pb-8">
                        {isCheckoutPending ? (
                            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-4 ring-amber-500/5">
                                <Clock className="h-12 w-12" strokeWidth={2} />
                            </div>
                        ) : (
                            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/5">
                                <ShieldCheck className="h-12 w-12" strokeWidth={2} />
                            </div>
                        )}

                        <h2 className="text-3xl font-black tracking-tight text-slate-900">
                            {isCheckoutPending ? 'Visitor In Estate' : 'Access Granted'}
                        </h2>
                        <div className="mt-2 text-center">
                            <p className="text-base font-medium text-slate-500">
                                {isCheckoutPending ? 'Visitor has an active check-in session.' : (result.message || 'Visitor verification successful.')}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-2">
                        <div className="divide-y divide-slate-100">
                            {result.visitor_name && (
                                <DetailRow icon={<User className="h-5 w-5" strokeWidth={2} />} label="Visitor" value={result.visitor_name} />
                            )}
                            {result.host_name && (
                                <DetailRow icon={<HomeIcon className="h-5 w-5" strokeWidth={2} />} label="Host" value={result.host_name} />
                            )}
                            <DetailRow icon={<Tag className="h-5 w-5" strokeWidth={2} />} label="Pass Type" value={getPassTypeLabel(result.code_type)} />
                            {result.checked_in_at && (
                                <DetailRow icon={<Clock className="h-5 w-5" strokeWidth={2} />} label="Checked In At" value={formatDateTime(result.checked_in_at) || ''} />
                            )}
                            {result.starts_at && (
                                <DetailRow icon={<Calendar className="h-5 w-5" strokeWidth={2} />} label="Starts at" value={formatDateTime(result.starts_at) || ''} />
                            )}
                            {expiry && result.code_type !== 'long_lived' && !isCheckoutPending && (
                                <DetailRow icon={<Clock className="h-5 w-5" strokeWidth={2} />} label="Expires in" value={expiry} />
                            )}
                        </div>
                    </div>

                    {result.code_type === 'event' && (
                        <div className="px-8 py-5 bg-indigo-50/50 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Event Capacity</span>
                                </div>
                                <span className="text-sm font-extrabold text-indigo-900">
                                    {result.uses_count ?? 0} / {result.guest_limit ?? '∞'} Checked-in
                                </span>
                            </div>
                            {result.guest_limit && (
                                <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-indigo-600 transition-all duration-700 ease-out rounded-full" 
                                        style={{ width: `${Math.min(100, ((result.uses_count ?? 0) / result.guest_limit) * 100)}%` }}
                                    />
                                </div>
                            )}
                            <p className="mt-2 text-[10px] font-bold text-slate-500">
                                This scan records check-in number {result.uses_count ?? 0} for this event pass.
                            </p>
                        </div>
                    )}

                    <div className="px-8 pt-8 pb-10">
                        {isCheckoutPending ? (
                            <button
                                type="button"
                                onClick={() => onCheckout()}
                                className="w-full rounded-[1.25rem] bg-amber-600 py-5 text-lg font-black text-white shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98]"
                            >
                                Record Check-out
                            </button>
                        ) : (
                            <>
                                <VehicleForm show={result.has_vehicle} onSubmit={(data) => onAdmit(data)} />

                                {!result.has_vehicle && (
                                    <button
                                        type="button"
                                        onClick={onReset}
                                        className="w-full rounded-[1.25rem] bg-indigo-600 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Okay ({countdown}s)
                                    </button>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onReset}
                            className="mt-6 flex w-full items-center justify-center gap-3 text-sm font-black text-slate-400 transition-all hover:text-slate-600 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isCheckoutPending ? 'Cancel' : 'Verify another code'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function VehicleForm({ show, onSubmit }: { show: boolean; onSubmit: (data: Record<string, string>) => void }) {
    const [data, setData] = useState({
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate_number: '',
    });

    if (!show) return null;

    return (
        <div className="space-y-6 pt-2">
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4">
                <div className="flex items-center gap-3 text-indigo-600">
                    <Car className="h-5 w-5" />
                    <p className="text-xs font-black tracking-widest uppercase">Vehicle Details Required</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Vehicle Make (e.g. Toyota)"
                        value={data.vehicle_make}
                        onChange={(e) => setData({ ...data, vehicle_make: e.target.value })}
                        className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Vehicle Model (e.g. Camry)"
                        value={data.vehicle_model}
                        onChange={(e) => setData({ ...data, vehicle_model: e.target.value })}
                        className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Plate Number"
                        value={data.vehicle_plate_number}
                        onChange={(e) => setData({ ...data, vehicle_plate_number: e.target.value })}
                        className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={() => onSubmit(data)}
                disabled={!data.vehicle_make || !data.vehicle_plate_number}
                className="w-full rounded-[1.25rem] bg-indigo-600 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                Admit with Vehicle
            </button>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</p>
                <p className="truncate text-base leading-tight font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}
