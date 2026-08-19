import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, Loader2, Shield, User, LayoutDashboard, Key, Mail, Building, MapPin, BadgeCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import * as TrustedDeviceController from '@/actions/App/Http/Controllers/Account/TrustedDeviceController';
import * as AdministrativeAssignmentController from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import * as ContextController from '@/actions/App/Http/Controllers/Auth/ContextController';
import { update } from '@/actions/App/Http/Controllers/Admin/ProfileController';
import AdminLayout from '@/Layouts/AdminLayout';

type Account = {
    name: string;
    email: string;
    role_label: string;
};

type EstateContext = {
    name: string;
    access_label: string;
    scope_label: string;
    can_switch: boolean;
    can_view_authority: boolean;
};

type Props = {
    user: {
        name: string;
        email: string;
    };
    account: Account;
    estate_context: EstateContext | null;
};

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Profile({ user, account, estate_context }: Props) {
    const { data, setData, put, processing, errors, reset, setDefaults, isDirty } = useForm({
        name: user.name,
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        put(update.url(), {
            preserveScroll: true,
            onSuccess: () => setDefaults('name', data.name),
        });
    }

    return (
        <>
            <Head title="Admin Profile" />

            <div className="mx-auto max-w-6xl space-y-8 pb-12">
                {/* 1. HERO HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-xl lg:p-12"
                >
                    {/* Background abstract elements */}
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />

                    <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                        <div className="relative">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-3xl font-black tracking-widest text-white shadow-lg ring-4 shadow-indigo-500/30 ring-white/10 backdrop-blur-md">
                                {initials(account.name)}
                            </div>
                            <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-4 ring-slate-950">
                                <Shield className="h-4 w-4" strokeWidth={3} />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">{account.name}</h1>
                                {estate_context && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200 ring-1 ring-indigo-500/30 backdrop-blur-sm ring-inset">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        Verified Admin
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-base text-slate-300 sm:text-lg">Manage your personal identity and estate context access.</p>
                        </div>
                    </div>
                </motion.div>

                {/* 2. DUAL CARD LAYOUT */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* LEFT COLUMN - Personal Identity */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="lg:col-span-7"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xs"
                        >
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">Personal Identity</h2>
                                        <p className="text-sm font-medium text-slate-500">Your core account details across Kontrol.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 p-8">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            autoComplete="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 focus:outline-hidden"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600" role="alert">
                                            <span className="inline-block h-1 w-1 rounded-full bg-rose-600" />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={user.email}
                                            readOnly
                                            className="block w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-100/70 px-4 py-3 text-sm font-semibold text-slate-500 focus:outline-hidden"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                            <Shield className="h-4 w-4 text-slate-300" />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-slate-400">
                                        Your primary login identifier. Contact support to change.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 bg-slate-50/50 p-6 px-8">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => reset()}
                                        disabled={processing || !isDirty}
                                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !isDirty}
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>

                    {/* RIGHT COLUMN - Estate Context */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="lg:col-span-5"
                    >
                        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xs">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">Estate Context</h2>
                                        <p className="text-sm font-medium text-slate-500">Your current operational workspace.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-8">
                                {estate_context ? (
                                    <div className="space-y-6">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                            <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Estate</div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                                                    <Building className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div className="font-bold text-slate-900">{estate_context.name}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-slate-100 p-4">
                                                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    <Key className="h-3 w-3" />
                                                    Role Level
                                                </div>
                                                <div className="font-bold text-slate-900">{estate_context.access_label}</div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-100 p-4">
                                                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    <MapPin className="h-3 w-3" />
                                                    Access Scope
                                                </div>
                                                <div className="font-bold text-slate-900">{estate_context.scope_label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900">No Active Estate</h3>
                                        <p className="mt-1 text-sm font-medium text-slate-500">You are currently outside of any estate context.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-6">
                                <Link
                                    href={TrustedDeviceController.index.url()}
                                    className="group flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-indigo-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">Trusted devices</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                                </Link>
                            </div>
                            {estate_context && (
                                <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-6">
                                    {estate_context.can_view_authority && (
                                        <Link
                                            href={AdministrativeAssignmentController.index.url()}
                                            className="group flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-indigo-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm font-bold text-slate-900">View Authority</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                                        </Link>
                                    )}

                                    {estate_context.can_switch && (
                                        <Link
                                            href={ContextController.index.url()}
                                            className="group flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-emerald-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                                                    <LayoutDashboard className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm font-bold text-slate-900">Switch Estate Context</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

Profile.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Admin Profile" />;
