import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { AccessCode } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';

type Props = {
    accessCode: AccessCode;
};

export default function CodeSuccess({ accessCode }: Props) {
    const [copied, setCopied] = useState(false);

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(accessCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = accessCode.code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    }

    function shareCode() {
        if (navigator.share) {
            navigator.share({
                title: 'Access Code',
                text: `Your access code is: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. Valid for ${accessCode.time_remaining}.`,
            });
        }
    }

    return (
        <ResidentLayout hideNav>
            <Head title="Code Created" />

            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                        <motion.svg
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="h-10 w-10 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <motion.path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </motion.svg>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mb-2 text-2xl font-semibold text-gray-900"
                >
                    Code Created!
                </motion.h1>

                {/* Subtitle */}
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="mb-8 text-gray-500">
                    Share this code with your visitor
                </motion.p>

                {/* Code Display */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-6 w-full max-w-xs"
                >
                    <div className="rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-lg">
                        <p className="font-mono text-5xl font-bold tracking-[0.2em] text-gray-900">{accessCode.code}</p>
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="mb-8 space-y-1 text-sm text-gray-500"
                >
                    {accessCode.visitor_name && (
                        <p>
                            For: <span className="font-medium text-gray-900">{accessCode.visitor_name}</span>
                        </p>
                    )}
                    <p>
                        Expires: <span className="font-medium text-amber-600">{accessCode.time_remaining}</span>
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="flex w-full max-w-xs gap-3">
                    <button
                        onClick={copyCode}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                            copied ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {copied ? (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                    />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                    <button
                        onClick={shareCode}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                            />
                        </svg>
                        Share
                    </button>
                </motion.div>

                {/* Done Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }} className="mt-6 w-full max-w-xs">
                    <Link
                        href="/resident/home"
                        className="block w-full rounded-xl bg-indigo-600 py-4 text-center text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                    >
                        Done
                    </Link>
                </motion.div>

                {/* Create Another Link */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-4">
                    <Link href="/resident/visitors/create" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        Create another code
                    </Link>
                </motion.div>
            </div>
        </ResidentLayout>
    );
}
