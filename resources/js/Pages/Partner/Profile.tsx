import {
    BanknotesIcon,
    BellIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    EnvelopeIcon,
    ExclamationCircleIcon,
    IdentificationIcon,
    KeyIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatCommission, formatCommissionLength } from '@/Utils/money';

interface Bank {
    name: string;
    code: string;
}

interface Banking {
    bank_name: string | null;
    bank_code: string | null;
    account_number: string | null;
    account_number_masked: string | null;
    account_name: string | null;
    account_verified_at: string | null;
    is_verified: boolean;
}

interface Props {
    tab: string;
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string | null;
    };
    partner: {
        name: string;
        status: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        commission_type: string | null;
        commission_rate: string | null;
        commission_length: number | null;
        created_at: string | null;
        banking: Banking;
    } | null;
    banks: Bank[];
    activity: Array<{
        id: number;
        title: string;
        status: string;
        status_label: string;
        at: string | null;
        at_human: string | null;
    }>;
    preferences: {
        email_product: boolean;
        email_settlements: boolean;
        email_pipeline: boolean;
    };
}

const TABS = [
    { key: 'account', label: 'Account', icon: UserIcon },
    { key: 'business', label: 'Business', icon: BuildingOfficeIcon },
    { key: 'banking', label: 'Banking', icon: BanknotesIcon },
    { key: 'commission', label: 'Commission', icon: IdentificationIcon },
    { key: 'security', label: 'Security', icon: ShieldCheckIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIcon },
    { key: 'activity', label: 'Activity', icon: ClockIcon },
] as const;

function StatusBadge({ status }: { status: string }) {
    const styles =
        status === 'active'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${styles}`}>
            {status}
        </span>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">{label}</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-stone-900 dark:text-white">{children}</dd>
        </div>
    );
}

function PrefToggle({ label, description, checked }: { label: string; description: string; checked: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
            <div>
                <p className="text-[13px] font-semibold text-stone-900 dark:text-white">{label}</p>
                <p className="text-[11px] text-stone-500">{description}</p>
            </div>
            <span
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-stone-300 dark:bg-slate-600'}`}
                role="switch"
                aria-checked={checked}
                aria-label={label}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-4' : 'left-0.5'}`}
                />
            </span>
        </div>
    );
}

function BankingPanel({ banking, banks }: { banking: Banking; banks: Bank[] }) {
    const { data, setData, put, processing, errors, recentlySuccessful, clearErrors } = useForm({
        bank_name: banking.bank_name || '',
        bank_code: banking.bank_code || '',
        account_number: banking.account_number || '',
        account_name: banking.account_name || '',
    });

    const [bankQuery, setBankQuery] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [matchAccepted, setMatchAccepted] = useState(banking.is_verified);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [editing, setEditing] = useState(!banking.is_verified);

    const filteredBanks =
        bankQuery === '' ? banks : banks.filter((bank) => bank.name.toLowerCase().includes(bankQuery.toLowerCase()));

    useEffect(() => {
        if (data.account_number !== banking.account_number || data.bank_code !== banking.bank_code) {
            setMatchAccepted(false);
            setMatchScore(null);
            setData('account_name', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.account_number, data.bank_code]);

    async function resolveAccount() {
        if (data.account_number.length !== 10 || !data.bank_code) {
            return;
        }

        setResolving(true);
        setResolveError(null);
        clearErrors();

        try {
            const response = await axios.post('/partner/banking/resolve', {
                account_number: data.account_number,
                bank_code: data.bank_code,
            });

            if (response.data.success) {
                setData('account_name', response.data.account_name);
                setMatchAccepted(!!response.data.match?.accepted);
                setMatchScore(typeof response.data.match?.score === 'number' ? response.data.match.score : null);

                if (!response.data.match?.accepted) {
                    setResolveError(
                        `Account name "${response.data.account_name}" does not match your partner or contact name closely enough.`,
                    );
                }
            }
        } catch (error: unknown) {
            const message =
                axios.isAxiosError(error) && error.response?.data?.message
                    ? error.response.data.message
                    : 'Could not verify account. Please check the details.';
            setResolveError(message);
            setData('account_name', '');
            setMatchAccepted(false);
            setMatchScore(null);
        } finally {
            setResolving(false);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/partner/banking', {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    }

    if (!editing && banking.is_verified) {
        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Payout bank account</h2>
                        <p className="mt-0.5 text-[12px] text-stone-500">Verified account for partner commission settlements.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Update
                    </button>
                </div>

                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-[12px] font-semibold">Verified payout account</span>
                    </div>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Field label="Bank">{banking.bank_name || '—'}</Field>
                        <Field label="Account name">{banking.account_name || '—'}</Field>
                        <Field label="Account number">{banking.account_number_masked || '—'}</Field>
                        <Field label="Verified">
                            {banking.account_verified_at
                                ? new Date(banking.account_verified_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                                : '—'}
                        </Field>
                    </dl>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">
                    {banking.is_verified ? 'Update payout account' : 'Add payout bank account'}
                </h2>
                <p className="mt-0.5 text-[12px] text-stone-500">
                    We verify the account with Paystack. The name must match your partner or contact name (order and middle names are fine).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {(errors as { message?: string }).message && (
                    <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                        <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                        {(errors as { message?: string }).message}
                    </div>
                )}

                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase">Bank</label>
                    <Combobox
                        value={banks.find((b) => b.code === data.bank_code) || null}
                        onChange={(bank: Bank | null) => {
                            setData((d) => ({
                                ...d,
                                bank_code: bank?.code || '',
                                bank_name: bank?.name || '',
                                account_name: '',
                            }));
                            setMatchAccepted(false);
                            setMatchScore(null);
                            setResolveError(null);
                        }}
                    >
                        <div className="relative">
                            <ComboboxInput
                                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                displayValue={(bank: Bank | null) => bank?.name || ''}
                                onChange={(event) => setBankQuery(event.target.value)}
                                placeholder="Search for a bank…"
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-[11px] text-stone-400">▼</span>
                            </ComboboxButton>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setBankQuery('')}>
                                <ComboboxOptions className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                    {filteredBanks.length === 0 ? (
                                        <div className="px-3 py-2 text-[12px] text-stone-500">No banks found.</div>
                                    ) : (
                                        filteredBanks.map((bank) => (
                                            <ComboboxOption
                                                key={bank.code}
                                                value={bank}
                                                className="cursor-pointer px-3 py-2 text-[13px] text-stone-800 data-focus:bg-primary-50 data-focus:text-primary-800 dark:text-slate-200 dark:data-focus:bg-primary-950/40"
                                            >
                                                {bank.name}
                                            </ComboboxOption>
                                        ))
                                    )}
                                </ComboboxOptions>
                            </Transition>
                        </div>
                    </Combobox>
                    {errors.bank_code && <p className="mt-1 text-[12px] text-rose-600">{errors.bank_code}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
                        Account number
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit NUBAN"
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[13px] font-medium tabular-nums outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={resolveAccount}
                            disabled={resolving || data.account_number.length !== 10 || !data.bank_code}
                            className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-white dark:text-stone-900"
                        >
                            {resolving ? 'Checking…' : 'Verify'}
                        </button>
                    </div>
                    {errors.account_number && <p className="mt-1 text-[12px] text-rose-600">{errors.account_number}</p>}
                    {resolveError && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400">
                            <ExclamationCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {resolveError}
                        </p>
                    )}
                </div>

                {data.account_name && (
                    <div
                        className={`rounded-xl border px-3 py-3 ${
                            matchAccepted
                                ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/25'
                                : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/25'
                        }`}
                    >
                        <p className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">Resolved account name</p>
                        <p className="mt-0.5 text-[14px] font-semibold text-stone-900 dark:text-white">{data.account_name}</p>
                        {matchAccepted ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Name matches your partner identity
                                {matchScore != null && ` (${Math.round(matchScore * 100)}%)`}
                            </p>
                        ) : (
                            <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                Name does not match closely enough — use an account in your business or contact name.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={processing || !matchAccepted || !data.account_name}
                        className="rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-40"
                    >
                        {processing ? 'Saving…' : 'Save payout account'}
                    </button>
                    {banking.is_verified && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(false);
                                setData({
                                    bank_name: banking.bank_name || '',
                                    bank_code: banking.bank_code || '',
                                    account_number: banking.account_number || '',
                                    account_name: banking.account_name || '',
                                });
                                setResolveError(null);
                                setMatchAccepted(true);
                            }}
                            className="rounded-xl border border-stone-200 px-4 py-2.5 text-[12px] font-semibold text-stone-600 dark:border-slate-700 dark:text-slate-300"
                        >
                            Cancel
                        </button>
                    )}
                    {recentlySuccessful && (
                        <span className="self-center text-[12px] font-medium text-emerald-600">Saved</span>
                    )}
                </div>
            </form>
        </div>
    );
}

export default function PartnerProfile({ tab, user, partner, banks = [], activity, preferences }: Props) {
    const active = TABS.some((t) => t.key === tab) ? tab : 'account';
    const initials = user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    function setTab(key: string) {
        router.get('/partner/profile', { tab: key }, { preserveState: true, preserveScroll: true, replace: true });
    }

    return (
        <PartnerLayout>
            <Head title="Account" />

            <div className="space-y-4">
                <PageHeader title="Account center" description="Manage identity, business details, banking, and security." />

                {/* Identity strip */}
                <Surface padding="sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold text-stone-900 dark:text-white">{user.name}</p>
                            <p className="text-[12px] text-stone-500">{user.email}</p>
                        </div>
                        {partner && <StatusBadge status={partner.status} />}
                    </div>
                </Surface>

                <div className="flex flex-col gap-3 lg:flex-row">
                    {/* Tabs nav */}
                    <nav
                        className="flex gap-1 overflow-x-auto lg:w-44 lg:shrink-0 lg:flex-col lg:overflow-visible"
                        aria-label="Account sections"
                    >
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            const isActive = active === t.key;

                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition ${
                                        isActive
                                            ? 'bg-stone-900 text-white shadow-sm dark:bg-white dark:text-stone-900'
                                            : 'text-stone-600 hover:bg-stone-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </nav>

                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="min-w-0 flex-1"
                    >
                        <Surface padding="md">
                            {active === 'account' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Account</h2>
                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        <Field label="Full name">{user.name}</Field>
                                        <Field label="Email">
                                            <span className="inline-flex items-center gap-1.5">
                                                <EnvelopeIcon className="h-3.5 w-3.5 text-stone-400" />
                                                {user.email}
                                            </span>
                                        </Field>
                                        <Field label="Member since">{user.created_at ?? '—'}</Field>
                                    </dl>
                                    <p className="text-[12px] text-stone-500">
                                        To update your name or email, contact support so we can verify the change.
                                    </p>
                                    <Link href="/partner/support" className="text-[12px] font-semibold text-primary-600 hover:underline">
                                        Contact support →
                                    </Link>
                                </div>
                            )}

                            {active === 'business' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Business</h2>
                                        {partner && <StatusBadge status={partner.status} />}
                                    </div>
                                    {partner ? (
                                        <dl className="grid gap-3 sm:grid-cols-2">
                                            <Field label="Organization">{partner.name}</Field>
                                            <Field label="Contact person">{partner.contact_person || '—'}</Field>
                                            <Field label="Website">
                                                {partner.website ? (
                                                    <a href={partner.website} className="text-primary-600 hover:underline" target="_blank" rel="noreferrer">
                                                        {partner.website}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </Field>
                                            <Field label="Partner since">{partner.created_at ?? '—'}</Field>
                                            {partner.description && (
                                                <div className="sm:col-span-2">
                                                    <Field label="Description">{partner.description}</Field>
                                                </div>
                                            )}
                                        </dl>
                                    ) : (
                                        <p className="text-[13px] text-stone-500">No partner organization linked.</p>
                                    )}
                                </div>
                            )}

                            {active === 'banking' && (
                                partner?.banking ? (
                                    <BankingPanel banking={partner.banking} banks={banks} />
                                ) : (
                                    <p className="text-[13px] text-stone-500">No partner organization linked.</p>
                                )
                            )}

                            {active === 'commission' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Commission plan</h2>
                                    {partner ? (
                                        <>
                                            <div className="grid gap-2.5 sm:grid-cols-3">
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Rate</p>
                                                    <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">
                                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Duration</p>
                                                    <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">
                                                        {formatCommissionLength(partner.commission_length)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Type</p>
                                                    <p className="mt-1 text-[13px] font-semibold capitalize text-stone-900 dark:text-white">
                                                        {partner.commission_type ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-stone-500">
                                                Plan history and amendments are managed by Kontrol. Reach out if you need a review.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setTab('banking')}
                                                className="text-[12px] font-semibold text-primary-600 hover:underline"
                                            >
                                                Manage payout bank account →
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-[13px] text-stone-500">Commission plan unavailable.</p>
                                    )}
                                </div>
                            )}

                            {active === 'security' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Security</h2>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <div className="flex items-center gap-2.5">
                                                <KeyIcon className="h-4 w-4 text-stone-400" />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Password</p>
                                                    <p className="text-[11px] text-stone-500">Use a unique password for this account</p>
                                                </div>
                                            </div>
                                            <Link
                                                href="/forgot-password"
                                                className="text-[12px] font-semibold text-primary-600 hover:underline"
                                            >
                                                Reset
                                            </Link>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <div className="flex items-center gap-2.5">
                                                <ShieldCheckIcon className="h-4 w-4 text-stone-400" />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        Two-factor authentication
                                                    </p>
                                                    <p className="text-[11px] text-stone-500">Coming soon — extra protection for your account</p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-slate-800">
                                                Soon
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Active sessions</p>
                                            <p className="mt-0.5 text-[11px] text-stone-500">
                                                Session management will list devices signed into this portal. Contact support to revoke access.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {active === 'notifications' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                            Notification preferences
                                        </h2>
                                        <Link href="/partner/notifications" className="text-[12px] font-semibold text-primary-600 hover:underline">
                                            Inbox →
                                        </Link>
                                    </div>
                                    <div className="space-y-2">
                                        <PrefToggle
                                            label="Product updates"
                                            description="New features and announcements from Kontrol"
                                            checked={preferences.email_product}
                                        />
                                        <PrefToggle
                                            label="Settlements"
                                            description="When commissions settle and statements are ready"
                                            checked={preferences.email_settlements}
                                        />
                                        <PrefToggle
                                            label="My Estates"
                                            description="Estate approvals, info requests, and rejections"
                                            checked={preferences.email_pipeline}
                                        />
                                    </div>
                                    <p className="text-[11px] text-stone-400">
                                        Preference saves will ship with the notification settings backend. In-app alerts are already live.
                                    </p>
                                </div>
                            )}

                            {active === 'activity' && (
                                <div className="space-y-3">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Recent activity</h2>
                                    {activity.length === 0 ? (
                                        <p className="py-8 text-center text-[12px] text-stone-500">No estate activity yet.</p>
                                    ) : (
                                        <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                                            {activity.map((item) => (
                                                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[11px] text-stone-500">{item.status_label}</p>
                                                    </div>
                                                    <span className="shrink-0 text-[11px] text-stone-400">{item.at_human}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                        </Surface>
                    </motion.div>
                </div>
            </div>
        </PartnerLayout>
    );
}
