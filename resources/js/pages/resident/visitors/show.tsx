import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { AccessCode } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';

type Props = {
    accessCode: AccessCode;
};

export default function CodeShow({ accessCode }: Props) {
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
    function revokeCode() {
        if (confirm('Are you sure you want to revoke this code? It will no longer be valid.')) {
            router.delete(resident.visitors.destroy.url(accessCode.id));
        }
    }

    return (
        <ResidentLayout>
            <Head title="Access Code Details" />

            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-2 text-2xl font-semibold text-gray-900"
                >
                    Access Code
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-8 text-gray-500"
                >
                    Share this code with your visitor
                </motion.p>

                {/* Code Display */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mb-6 w-full max-w-xs"
                >
                    <div
                        className={`rounded-3xl border-2 bg-white p-8 shadow-lg ${accessCode.status === 'active' ? 'border-gray-100' : 'border-red-100 bg-red-50'}`}
                    >
                        <p
                            className={`font-mono text-5xl font-bold tracking-[0.2em] ${accessCode.status === 'active' ? 'text-gray-900' : 'text-red-400 line-through'}`}
                        >
                            {accessCode.code}
                        </p>
                        {accessCode.status !== 'active' && (
                            <p className="mt-2 text-sm font-medium tracking-widest text-red-500 uppercase">{accessCode.status}</p>
                        )}
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-8 space-y-2 text-sm text-gray-500"
                >
                    {accessCode.visitor_name && (
                        <p>
                            For: <span className="font-medium text-gray-900">{accessCode.visitor_name}</span>
                        </p>
                    )}
                    <p>
                        Type: <span className="font-medium text-gray-900">{accessCode.type === 'long_lived' ? 'Long-lived' : 'Single Use'}</span>
                    </p>
                    <p>
                        {accessCode.status === 'active' ? (
                            <>
                                Expires: <span className="font-medium text-amber-600">{accessCode.time_remaining}</span>
                            </>
                        ) : accessCode.status === 'used' ? (
                            <>
                                Arrived: <span className="font-medium text-blue-600">{new Date(accessCode.used_at!).toLocaleString()}</span>
                            </>
                        ) : accessCode.status === 'revoked' ? (
                            <>
                                Revoked: <span className="font-medium text-red-600">{new Date(accessCode.revoked_at!).toLocaleString()}</span>
                            </>
                        ) : (
                            <span>Expired: {new Date(accessCode.expires_at).toLocaleDateString()}</span>
                        )}
                    </p>
                    {accessCode.status !== 'active' && (
                        <p className="text-xs text-gray-400">Created: {new Date(accessCode.created_at).toLocaleDateString()}</p>
                    )}
                </motion.div>

                {/* Action Buttons */}
                {accessCode.status === 'active' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex w-full max-w-xs flex-col gap-3"
                    >
                        <div className="flex w-full gap-3">
                            <button
                                onClick={copyCode}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                                    copied
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={shareCode}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
                            >
                                Share
                            </button>
                        </div>

                        <button
                            onClick={revokeCode}
                            className="w-full rounded-xl py-3 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                            Revoke Code
                        </button>
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-8">
                    <Link href="/resident/home" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        </ResidentLayout>
    );
}
