import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Key, Copy, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Props {
    isEnabled: boolean;
    qrCodeUrl: string | null;
    secret: string;
}

export default function SettingsIndex({ isEnabled, qrCodeUrl, secret }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    const [copied, setCopied] = useState(false);

    function copySecret() {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleToggle2FA(e: React.FormEvent) {
        e.preventDefault();
        if (isEnabled) {
            post('/zeus/settings/2fa/disable', {
                onSuccess: () => reset(),
            });
        } else {
            post('/zeus/settings/2fa/enable', {
                onSuccess: () => reset(),
            });
        }
    }

    return (
        <ZeusLayout>
            <Head title="Zeus Settings – Two-Factor Authentication" />

            <div className="relative mx-auto min-h-screen max-w-3xl space-y-6 bg-[#0A0B10] px-4 py-8 text-[#F2F3F6]">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[100px] duration-[8000ms]" />

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">ZEUS CONSOLE SECURITY</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-[#F2F3F6]">
                        Console <span className="font-light text-[#9297A8]">Settings</span>
                    </h1>
                    <p className="mt-1 text-xs text-[#9297A8]">Configure multi-factor authentication and console access controls.</p>
                </motion.div>

                {/* Two-Factor Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className={`flex items-start gap-4 rounded-3xl border p-6 shadow-2xl ${
                        isEnabled ? 'border-[#34D399]/20 bg-[#34D399]/5' : 'border-rose-500/20 bg-rose-500/5'
                    }`}
                >
                    <div className={`shrink-0 rounded-xl p-3 ${isEnabled ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 space-y-1">
                        <h2 className="text-base font-bold text-[#F2F3F6]">Two-Factor Authentication is {isEnabled ? 'Enabled' : 'Disabled'}</h2>
                        <p className="text-xs leading-relaxed text-[#9297A8]">
                            {isEnabled
                                ? 'Your administrator account is protected with a time-based authenticator. Logins will require verification.'
                                : 'Protect your Zeus console access from unauthorized entry. Secure your account using a time-based authenticator app (such as Google Authenticator, 1Password, or Authy).'}
                        </p>
                    </div>
                </motion.div>

                {/* Configuration Area */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="space-y-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl"
                >
                    {!isEnabled ? (
                        /* Enable 2FA Form Step-by-Step */
                        <form onSubmit={handleToggle2FA} className="space-y-6">
                            <div className="space-y-6">
                                <h3 className="border-b border-[rgba(255,255,255,0.06)] pb-2 text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                    Set Up Authenticator
                                </h3>

                                <div className="grid items-center gap-8 md:grid-cols-2">
                                    {/* QR Code Container */}
                                    <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0B10]/50 p-6">
                                        {qrCodeUrl ? (
                                            <div className="rounded-xl bg-white p-2.5">
                                                <img src={qrCodeUrl} alt="2FA QR Code" className="h-44 w-44" />
                                            </div>
                                        ) : (
                                            <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-dashed border-gray-700">
                                                <QrCode className="h-10 w-10 animate-pulse text-gray-600" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">
                                            Scan with your authenticator
                                        </span>
                                    </div>

                                    {/* Manual Details Entry */}
                                    <div className="space-y-4">
                                        <div>
                                            <span className="mb-1 block text-[10px] font-black tracking-widest text-[#6C5DFD] uppercase">Step 1</span>
                                            <h4 className="text-sm font-bold text-[#F2F3F6]">Scan QR or Enter Key</h4>
                                            <p className="mt-1 text-xs text-[#9297A8]">
                                                If you cannot scan the QR code, type this secret key manually into your app:
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3.5 py-3.5">
                                            <Key className="h-4.5 w-4.5 text-[#9297A8]" />
                                            <span className="flex-1 font-mono text-sm tracking-widest text-[#F2F3F6] select-all">{secret}</span>
                                            <button
                                                type="button"
                                                onClick={copySecret}
                                                className="cursor-pointer text-[#9297A8] transition-colors hover:text-white"
                                            >
                                                {copied ? <Check className="h-4.5 w-4.5 text-[#34D399]" /> : <Copy className="h-4.5 w-4.5" />}
                                            </button>
                                        </div>

                                        <div className="pt-2">
                                            <span className="mb-1 block text-[10px] font-black tracking-widest text-[#6C5DFD] uppercase">Step 2</span>
                                            <h4 className="text-sm font-bold text-[#F2F3F6]">Verify Verification Code</h4>
                                            <p className="mt-1 text-xs text-[#9297A8]">
                                                Enter the 6-digit code displayed in your authenticator app below to confirm.
                                            </p>
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                                                maxLength={6}
                                                placeholder="000000"
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 pl-[0.4em] text-center font-mono text-xl tracking-[0.4em] text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                                required
                                            />
                                            {errors.code && <p className="mt-1.5 text-xs text-rose-500">{errors.code}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-[rgba(255,255,255,0.06)] pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6C5DFD] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#6C5DFD]/90 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                                >
                                    <Shield className="h-4.5 w-4.5" />
                                    {processing ? 'Enabling...' : 'Enable Two-Factor Authentication'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Disable 2FA Form */
                        <form onSubmit={handleToggle2FA} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="mb-2 border-b border-rose-500/20 pb-2 text-xs font-bold tracking-wider text-rose-500 uppercase">
                                    Disable Two-Factor Authentication
                                </h3>
                                <p className="text-xs leading-relaxed text-[#9297A8]">
                                    Disabling two-factor authentication removes this layer of protection. You will only need your username and
                                    password to log in. Enter the current authenticator code to confirm.
                                </p>

                                <div className="max-w-xs">
                                    <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Current Authenticator Code</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        placeholder="000000"
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 pl-[0.4em] text-center font-mono text-xl tracking-[0.4em] text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                        required
                                    />
                                    {errors.code && <p className="mt-1.5 text-xs text-rose-500">{errors.code}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-[rgba(255,255,255,0.06)] pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="hover:bg-rose-550 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                                >
                                    <ShieldAlert className="h-4.5 w-4.5" />
                                    {processing ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </ZeusLayout>
    );
}
