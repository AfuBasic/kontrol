import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
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
    if (parts.length === 0) {
        return 'A';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

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

    function handleCancel() {
        reset();
    }

    return (
        <>
            <Head title="Profile" />

            <div className="max-w-5xl space-y-10">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Profile</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Manage your personal information and view your estate access.</p>
                </header>

                <section className="border-y border-slate-200 py-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#0A3D91] text-lg font-semibold tracking-wide text-white shadow-sm shadow-[#0A3D91]/20"
                            aria-hidden="true"
                        >
                            {initials(account.name)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-semibold text-slate-950">{account.name}</h2>
                            <p className="mt-1 truncate text-sm text-slate-500">{account.email}</p>
                            {estate_context && (
                                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                                    <span className="font-medium text-slate-800">{estate_context.access_label}</span>
                                    <span className="text-slate-300" aria-hidden="true">
                                        ·
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                        {estate_context.name}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <form onSubmit={handleSubmit}>
                    <section className="max-w-2xl">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">Personal information</h2>
                            <p className="mt-1 text-sm text-slate-500">Your personal details used across Kontrol.</p>
                        </div>

                        <div className="mt-7 space-y-5">
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
                                    onChange={(event) => setData('name', event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition outline-none focus:border-[#0A3D91] focus:ring-4 focus:ring-[#0A3D91]/10"
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
                                    className="mt-2 block w-full rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none focus:ring-4 focus:ring-slate-200"
                                />
                                <p id="email-help" className="mt-1.5 text-xs text-slate-400">
                                    Login email. Cannot be changed here.
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isDirty}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save changes'
                                )}
                            </button>
                        </div>
                    </section>
                </form>

                <section className="border-t border-slate-200 pt-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">Your estate</p>
                            {estate_context ? (
                                <>
                                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{estate_context.name}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{estate_context.access_label}</p>
                                    <p className="mt-1 text-sm text-slate-500">{estate_context.scope_label}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="mt-2 text-lg font-semibold text-slate-950">No active estate</h2>
                                    <p className="mt-1 text-sm text-slate-500">Select an estate to manage its operations.</p>
                                </>
                            )}
                        </div>

                        {estate_context && (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium">
                                {estate_context.can_view_authority && (
                                    <Link
                                        href={AdministrativeAssignmentController.index.url()}
                                        className="inline-flex items-center gap-1 text-[#0A3D91] transition hover:text-[#082f70] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A3D91]"
                                    >
                                        View authority
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                )}
                                {estate_context.can_switch && (
                                    <Link
                                        href={ContextController.index.url()}
                                        className="text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-500"
                                    >
                                        Switch estate
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

Profile.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Profile" />;
