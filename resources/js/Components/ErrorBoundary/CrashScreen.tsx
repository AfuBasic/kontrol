import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    error: Error | null;
    resetError: () => void;
}

export default function CrashScreen({ error, resetError }: Props) {
    const [showDetails, setShowDetails] = useState(true);
    const [copied, setCopied] = useState(false);
    // Show technical details and stack traces when error is present.
    const showTechnicalDetails = error != null;

    const handleReload = () => {
        window.location.reload();
    };

    const handleHome = () => {
        window.location.href = '/';
    };

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    const handleCopy = () => {
        if (!error) return;
        const text = `${error.name}: ${error.message}\n\nStack Trace:\n${error.stack}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100"
            >
                {/* Header/Icon */}
                <div className="relative flex flex-col items-center px-8 pt-12 pb-8 text-center">
                    <motion.div
                        animate={{
                            rotate: [0, -10, 10, -10, 10, 0],
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.2,
                            repeat: Infinity,
                            repeatDelay: 5,
                        }}
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600"
                    >
                        <AlertTriangle className="h-10 w-10" />
                    </motion.div>

                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Oops! Something snapped.</h1>
                    <p className="mt-3 leading-relaxed text-slate-500">
                        The application encountered an unexpected error. Don't worry, your data is safe. Let's get you back on track.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 px-8 pb-8">
                    <button
                        onClick={resetError}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try Again
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleReload}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-[0.98]"
                        >
                            Reload App
                        </button>
                        <button
                            onClick={handleHome}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-[0.98]"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </button>
                    </div>
                </div>

                {/* Technical Details - local/dev only */}
                {showTechnicalDetails && (
                    <div className="border-t border-slate-50 bg-slate-50/50 px-8 py-4">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex w-full items-center justify-between text-xs font-bold tracking-wider text-slate-400 uppercase transition-colors hover:text-slate-600"
                        >
                            Technical Details
                            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {showDetails && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 overflow-hidden">
                                <div className="group relative">
                                    <button
                                        onClick={handleCopy}
                                        className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur-xs transition-all hover:bg-slate-700 hover:text-white"
                                    >
                                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                        {copied ? 'Copied' : 'Copy Error'}
                                    </button>
                                    <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-900 p-4 pr-24 font-mono text-[10px] leading-relaxed text-rose-300/80 shadow-inner">
                                        <p className="mb-2 font-bold text-rose-400">
                                            {error.name}: {error.message}
                                        </p>
                                        <p className="whitespace-pre-wrap opacity-60">{error.stack}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
