import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShieldX, User, Home as HomeIcon, Clock, Car, Loader2, QrCode, CameraOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import SecurityLayout from '@/Layouts/SecurityLayout';

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

    const loadJSQR = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if ((window as any).jsQR) {
                resolve((window as any).jsQR);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js';
            script.onload = () => resolve((window as any).jsQR);
            script.onerror = (err) => reject(err);
            document.body.appendChild(script);
        });
    };

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

    const submit = useCallback((code: string) => {
        if (submittedFor.current === code) return;
        submittedFor.current = code;
        setSubmitting(true);
        router.post(
            VerifyController.validate.url(),
            { code },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
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

                let jsQRDec: any = null;
                const hasNative = 'BarcodeDetector' in window;
                let detector: any = null;

                if (hasNative) {
                    try {
                        detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                    } catch {}
                }

                jsQRDec = await loadJSQR().catch(() => null);

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
                            } catch (e) {
                                console.warn('Native barcode matching slipped, using jsQR fallback.');
                            }
                        }

                        // 2. Secondary Fallback Engine Layer
                        if (!decodedValue && jsQRDec && ctx) {
                            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const codeObj = jsQRDec(imgData.data, imgData.width, imgData.height, {
                                inversionAttempts: 'attemptInvert', // Patched to intercept low-light items
                            });
                            if (codeObj) decodedValue = codeObj.data;
                        }

                        if (decodedValue) {
                            if (navigator.vibrate) navigator.vibrate(150);
                            setIsScanning(false); // Shuts down execution blocks cleanly
                            submit(decodedValue);
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

    const recordDecision = (decision: 'admit' | 'reject', extraData: any = {}) => {
        const code = submittedFor.current;
        if (!code) {
            reset();
            return;
        }
        router.post(
            VerifyController.decision.url(),
            {
                decision,
                code,
                ...extraData,
            },
            {
                preserveScroll: true,
                onFinish: reset,
            },
        );
    };

    return (
        <>
            <Head title="Verify Access · Security" />

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-8 pb-6 sm:px-8">
                <AnimatePresence mode="wait">
                    {result ? (
                        <ResultPanel
                            key="result"
                            result={result}
                            onAdmit={(data) => recordDecision('admit', data)}
                            onReject={(data) => recordDecision('reject', data)}
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
    onAdmit: (data?: any) => void;
    onReject: (data?: any) => void;
    onReset: () => void;
};

function ResultPanel({ result, onAdmit, onReject, onReset }: ResultPanelProps) {
    const valid = result.valid;
    const expiry = formatExpiry(result.expires_at);

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

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
                    <div className="flex flex-col items-center px-8 pt-12 pb-8">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/5">
                            <ShieldCheck className="h-12 w-12" strokeWidth={2} />
                        </div>

                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Access Granted</h2>
                        <div className="mt-2 text-center">
                            <p className="text-base font-medium text-slate-500">Visitor verification successful.</p>
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
                            {expiry && result.code_type !== 'long_lived' && (
                                <DetailRow icon={<Clock className="h-5 w-5" strokeWidth={2} />} label="Expires in" value={expiry} />
                            )}
                        </div>
                    </div>

                    <div className="px-8 pt-8 pb-10">
                        <VehicleForm show={result.has_vehicle} onSubmit={(data) => onAdmit(data)} />

                        {!result.has_vehicle && (
                            <button
                                type="button"
                                onClick={() => onAdmit()}
                                className="w-full rounded-[1.25rem] bg-indigo-600 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
                            >
                                Admit Visitor
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onReset}
                            className="mt-6 flex w-full items-center justify-center gap-3 text-sm font-black text-slate-400 transition-all hover:text-slate-600 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Verify another code
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function VehicleForm({ show, onSubmit }: { show: boolean; onSubmit: (data: any) => void }) {
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
