import { router } from '@inertiajs/react';
import { Loader2, Check, Copy, ExternalLink, X } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import resident from '@/routes/resident';

interface Props {
    linked: boolean;
    botUsername: string;
    className?: string;
}

interface OtpData {
    otp: string;
    expires_at: string;
}

export default function TelegramLinkToggle({ linked, botUsername, className = '' }: Props) {
    const [isLinked, setIsLinked] = useState(linked);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [otpData, setOtpData] = useState<OtpData | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    useEffect(() => {
        if (otpData?.expires_at) {
            const updateTimer = () => {
                const expiresAt = new Date(otpData.expires_at).getTime();
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    clearTimer();
                    setOtpData(null);
                    setError('Code expired. Please generate a new one.');
                }
            };

            updateTimer();
            timerRef.current = setInterval(updateTimer, 1000);

            return () => clearTimer();
        }
    }, [otpData, clearTimer]);

    const generateOtp = async () => {
        setIsLoading(true);
        setError(null);
        setCopied(false);

        try {
            const response = await fetch(resident.telegram.generateOtp.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate code');
            }

            setOtpData({
                otp: data.otp,
                expires_at: data.expires_at,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate code');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!otpData?.otp) return;

        try {
            await navigator.clipboard.writeText(otpData.otp);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Failed to copy to clipboard');
        }
    };

    const openTelegram = () => {
        if (botUsername) {
            window.open(`https://t.me/${botUsername}`, '_blank');
        }
    };

    const handleUnlink = () => {
        setIsUnlinking(true);
        router.delete(resident.telegram.unlink.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setIsLinked(false);
                setIsUnlinking(false);
            },
            onError: () => {
                setError('Failed to unlink Telegram account');
                setIsUnlinking(false);
            },
        });
    };

    const openModal = () => {
        setShowModal(true);
        setOtpData(null);
        setError(null);
        setCopied(false);
        setTimeRemaining(null);
    };

    const closeModal = () => {
        setShowModal(false);
        clearTimer();
        setOtpData(null);
        setError(null);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className={`flex items-center justify-between rounded-xl border border-gray-200 p-4 ${className}`}>
                <div className="flex items-center gap-4">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isLinked ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-500'
                        }`}
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Telegram</h3>
                        <p className="text-sm text-gray-500">
                            {isLinked ? 'Connected - receive notifications via Telegram' : 'Get visitor alerts on Telegram'}
                        </p>
                    </div>
                </div>
                {isLinked ? (
                    <button
                        onClick={handleUnlink}
                        disabled={isUnlinking}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-50"
                    >
                        {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
                    </button>
                ) : (
                    <button
                        onClick={openModal}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-500"
                    >
                        Connect
                    </button>
                )}
            </div>

            {/* Link Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Connect Telegram</h2>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {!otpData ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                                            <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-600">
                                            Generate a one-time code and send it to our Telegram bot to link your account.
                                        </p>
                                    </div>
                                    {error && <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}
                                    <button
                                        onClick={generateOtp}
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            'Generate Code'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* OTP Display */}
                                    <div className="rounded-xl bg-gray-50 p-4">
                                        <p className="mb-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Your One-Time Code
                                        </p>
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">{otpData.otp}</span>
                                            <button
                                                onClick={copyToClipboard}
                                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {timeRemaining !== null && (
                                            <p className="mt-2 text-center text-xs text-gray-500">
                                                Expires in{' '}
                                                <span className={timeRemaining < 60 ? 'font-medium text-red-500' : ''}>
                                                    {formatTime(timeRemaining)}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Instructions */}
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                                1
                                            </span>
                                            <p className="text-sm text-gray-600">Copy the code above</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                                2
                                            </span>
                                            <p className="text-sm text-gray-600">Open the Telegram bot</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                                3
                                            </span>
                                            <p className="text-sm text-gray-600">Send the code to the bot</p>
                                        </div>
                                    </div>

                                    {error && <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={openTelegram}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
                                        >
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                                            </svg>
                                            Open Telegram Bot
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={generateOtp}
                                            disabled={isLoading}
                                            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                                        >
                                            {isLoading ? 'Generating...' : 'Generate New Code'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
