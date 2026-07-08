import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function Login2FA() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/login/2fa');
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0A0B10] px-4 text-[#F2F3F6] overflow-hidden">
            {/* Decorative Glow */}
            <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-gradient-to-br from-[#6C5DFD]/10 to-[#A78BFA]/10 blur-[100px] animate-pulse" />

            <Head title="Zeus Console Two-Factor Verification" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md space-y-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl z-10"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="rounded-2xl bg-[#6C5DFD]/15 p-3 text-[#6C5DFD] shadow-[0_0_15px_rgba(108,93,253,0.2)]">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#F2F3F6]">
                            Two-Factor <span className="font-light text-[#9297A8]">Verification</span>
                        </h1>
                        <p className="mt-1.5 text-xs text-[#9297A8] max-w-xs leading-relaxed">
                            Enter the 6-digit verification code from your authenticator app to complete access to the Zeus Console.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-center text-xs font-semibold text-[#9297A8] uppercase tracking-wider">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            placeholder="000000"
                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3.5 text-center font-mono text-2xl tracking-[0.4em] pl-[0.4em] text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                            autoFocus
                            required
                        />
                        {errors.code && (
                            <p className="mt-1.5 text-center text-xs font-semibold text-rose-500">{errors.code}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6C5DFD] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#6C5DFD]/90 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                        Verify & Login
                    </button>
                </form>

                <div className="flex justify-center border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <a
                        href="/zeus"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9297A8] hover:text-[#F2F3F6] transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to standard login
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
