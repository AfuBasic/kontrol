import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, Eye, EyeOff, Loader2, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
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
    shares_account_name: boolean;
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
    if (parts.length === 0) {
        return 'A';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function Profile({ user, account, estate_context }: Props) {
    const { data, setData, put, processing, errors, reset, isDirty } = useForm({
        name: user.name,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        put(update.url(), {
            preserveScroll: true,
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    }

    function handleCancel() {
        reset();
        setData('name', user.name);
    }

    return (
        <>
            <Head title="Account" />

            <div className="space-y-10">
                <header className="max-w-3xl">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Kontrol account</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Account</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Manage the person signed in to Kontrol, and review the estate context they are operating inside.
                    </p>
                </header>

                <section className="border-y border-slate-200 py-8">
                    <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0A3D91] text-base font-semibold tracking-wide text-white shadow-sm shadow-[#0A3D91]/20"
                                    aria-hidden="true"
                                >
                                    {initials(account.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <UserRound className="h-4 w-4 text-[#0A3D91]" aria-hidden="true" />
                                        <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">Person</p>
                                    </div>
                                    <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">{account.name}</h2>
                                    <p className="mt-1 truncate text-sm text-slate-500">{account.email}</p>
                                    <p className="mt-4 text-sm font-medium text-slate-700">{account.role_label}</p>
                                    <p className="mt-1 text-xs text-slate-400">This is the administrator account you edit on this page.</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden items-center px-1 lg:flex">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </div>
                        </div>

                        {estate_context && (
                            <div className="rounded-2xl bg-slate-900 p-5 text-white">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
                                        aria-hidden="true"
                                    >
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold tracking-[0.16em] text-white/45 uppercase">Operating estate</p>
                                        <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-white">{estate_context.name}</h2>
                                        <p className="mt-1 text-sm text-white/60">Current estate management context</p>
                                        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="text-[11px] font-bold tracking-[0.14em] text-white/35 uppercase">Access</dt>
                                                <dd className="mt-1 text-white/85">{estate_context.access_label}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[11px] font-bold tracking-[0.14em] text-white/35 uppercase">Scope</dt>
                                                <dd className="mt-1 text-white/85">{estate_context.scope_label}</dd>
                                            </div>
                                        </dl>
                                        {estate_context.shares_account_name && (
                                            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs leading-5 text-white/70">
                                                This estate record currently shares the same display name as your account. It is still a separate
                                                operating context.
                                            </p>
                                        )}
                                        {estate_context.can_switch && (
                                            <Link
                                                href={ContextController.index.url()}
                                                className="mt-4 inline-flex text-sm font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                            >
                                                Switch estate
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!estate_context && (
                            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                                <div
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200"
                                    aria-hidden="true"
                                >
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <p className="mt-4 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">Operating estate</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">No active estate context</h2>
                                <p className="mt-1 text-sm text-slate-500">Select an estate context to manage estate operations.</p>
                            </div>
                        )}
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid gap-12 lg:grid-cols-12">
                        <section className="lg:col-span-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
                                <p className="mt-1 text-sm text-slate-500">Your name and login details.</p>
                            </div>

                            <div className="max-w-lg space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                                        Full name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition outline-none focus:border-[#0A3D91] focus:ring-4 focus:ring-[#0A3D91]/10"
                                    />
                                    {errors.name && (
                                        <p className="mt-1.5 text-sm text-rose-600" role="alert">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={user.email}
                                        readOnly
                                        aria-describedby="email-help"
                                        autoComplete="email"
                                        className="mt-2 block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none focus:ring-4 focus:ring-slate-200"
                                    />
                                    <p id="email-help" className="mt-1.5 text-xs text-slate-400">
                                        Login email. Cannot be changed here.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="border-t border-slate-200 pt-12 lg:col-span-6 lg:border-t-0 lg:pt-0">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                                <p className="mt-1 text-sm text-slate-500">Keep your account secure.</p>
                            </div>

                            <div className="max-w-lg space-y-5">
                                <div className="border-l-2 border-slate-200 pl-4">
                                    <h3 className="text-sm font-semibold text-slate-900">Password</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        Leave these fields empty unless you want to change your account password.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                                        New password
                                    </label>
                                    <div className="relative mt-2">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Leave blank to keep current"
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 transition outline-none focus:border-[#0A3D91] focus:ring-4 focus:ring-[#0A3D91]/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 outline-none hover:text-slate-700 focus-visible:text-slate-700"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1.5 text-sm text-rose-600" role="alert">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="block text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase"
                                    >
                                        Confirm password
                                    </label>
                                    <div className="relative mt-2">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm new password"
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 transition outline-none focus:border-[#0A3D91] focus:ring-4 focus:ring-[#0A3D91]/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 outline-none hover:text-slate-700 focus-visible:text-slate-700"
                                            aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-400">Changes apply only to your Kontrol account.</p>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isDirty}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save changes'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

Profile.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Account" />;
