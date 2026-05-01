import { Capacitor } from '@capacitor/core';
import { Head, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, ChevronRight, Eye, EyeOff, KeyRound, LogOut, Mail, Pencil, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import ProfileController from '@/actions/App/Http/Controllers/Security/ProfileController';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
    estateName: string;
}

const PERMISSIONS = [
    'Validate visitor access codes',
    'Acknowledge & dismiss alerts',
    'Read estate announcements',
];

export default function ProfilePage({ user, estateName }: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                await FirebaseAuthentication.signOut().catch(() => {});
            }
            router.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
            setLoggingOut(false);
            window.location.href = '/login';
        }
    };

    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title="Profile · Security" />

            <header className="mb-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Profile</p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Identity & access</h1>
            </header>

            {/* Identity card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3 px-4 py-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold tracking-wide text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-700 uppercase ring-1 ring-inset ring-emerald-200">
                        <ShieldCheck className="h-3 w-3" strokeWidth={2.4} />
                        Security
                    </span>
                </div>

                <dl className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <Field icon={<Mail className="h-4 w-4" strokeWidth={2.2} />} label="Email" value={user.email} muted />
                    <Field icon={<Building2 className="h-4 w-4" strokeWidth={2.2} />} label="Estate" value={estateName} />
                </dl>
            </section>

            {/* Permissions */}
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <header className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Permissions</p>
                    <p className="text-[11px] text-slate-500">What your role can do at this estate</p>
                </header>
                <ul className="divide-y divide-slate-100">
                    {PERMISSIONS.map((p) => (
                        <li key={p} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <Check className="h-3 w-3" strokeWidth={2.6} />
                            </span>
                            <span className="text-xs text-slate-700">{p}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Action rows */}
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <ActionRow
                    icon={<Pencil className="h-4 w-4" strokeWidth={2.2} />}
                    label="Edit profile"
                    sub="Name and security details"
                    onClick={() => setEditOpen(true)}
                />
                <ActionRow
                    icon={<KeyRound className="h-4 w-4" strokeWidth={2.2} />}
                    label="Change password"
                    sub="Update your sign-in password"
                    onClick={() => setEditOpen(true)}
                />
            </section>

            {/* Logout */}
            <section className="mt-4">
                {!logoutConfirm ? (
                    <button
                        onClick={() => setLogoutConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50/50 active:scale-[0.99]"
                    >
                        <LogOut className="h-4 w-4" strokeWidth={2.4} />
                        Log out
                    </button>
                ) : (
                    <div className="rounded-2xl border border-rose-200/70 bg-rose-50/60 p-3">
                        <p className="px-1 text-xs text-rose-800">End your security session on this device?</p>
                        <div className="mt-2.5 flex gap-2">
                            <button
                                onClick={() => !loggingOut && setLogoutConfirm(false)}
                                disabled={loggingOut}
                                className="flex-1 rounded-full border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-70"
                            >
                                {loggingOut && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                {loggingOut ? 'Logging out...' : 'Log out'}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <EditSheet open={editOpen} onClose={() => setEditOpen(false)} user={user} />
        </>
    );
}

function Field({
    icon,
    label,
    value,
    muted,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-slate-500">{icon}</span>
            <div className="min-w-0 flex-1">
                <dt className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">{label}</dt>
                <dd className={`truncate text-sm ${muted ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{value}</dd>
            </div>
        </div>
    );
}

function ActionRow({
    icon,
    label,
    sub,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50/70 active:bg-slate-100/60"
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">{icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
        </button>
    );
}

function EditSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: Props['user'] }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        name: user.name,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!open) {
            reset('password', 'password_confirmation');
            setShowPassword(false);
            setShowConfirm(false);
        }
    }, [open, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(ProfileController.update.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset('password', 'password_confirmation');
                setTimeout(onClose, 600);
            },
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                        className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />
                        <header className="flex items-center justify-between px-5 pt-3 pb-2">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Edit</p>
                                <h2 className="text-base font-semibold tracking-tight text-slate-900">Update profile</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" strokeWidth={2.4} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-4 px-5 pt-2 pb-6">
                            <FormField label="Name" error={errors.name}>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300/40 focus:outline-none"
                                />
                            </FormField>

                            <FormField label="New password" error={errors.password}>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Leave blank to keep current"
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300/40 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </FormField>

                            {data.password && (
                                <FormField label="Confirm password" error={errors.password_confirmation as string | undefined}>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300/40 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormField>
                            )}

                            {recentlySuccessful && (
                                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                                    Profile updated
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {processing ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</span>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </label>
    );
}
