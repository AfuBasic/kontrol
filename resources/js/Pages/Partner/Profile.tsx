import {
    ArrowRightIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission, formatCommissionLength } from '@/Utils/money';

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
        created_at_label?: string | null;
    };
    partner: {
        id: number;
        partner_code: string;
        name: string;
        status: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        commission_type: string | null;
        commission_rate: string | null;
        commission_length: number | null;
        created_at: string | null;
        created_at_label?: string | null;
        banking: Banking;
    } | null;
    finance?: {
        total_earned: number;
        pending_commissions: number;
        next_settlement_date: string;
    };
    banks: Bank[];
    activity: Array<{
        id: number;
        title: string;
        status: string;
        status_label: string;
        at: string | null;
        at_human: string | null;
    }>;
}

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'business', label: 'Business' },
    { key: 'banking', label: 'Banking' },
    { key: 'commission', label: 'Commission' },
    { key: 'security', label: 'Security' },
    { key: 'activity', label: 'Activity' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-3 last:border-0 dark:border-white/[0.05]">
            <dt className="shrink-0 text-[12px] text-stone-400">{label}</dt>
            <dd className="text-right text-[13px] font-medium text-stone-900 dark:text-white">{value ?? '—'}</dd>
        </div>
    );
}

function SectionCard({
    title,
    action,
    children,
    className = '',
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06] sm:p-6 ${className}`}
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">{title}</h2>
                {action}
            </div>
            {children}
        </motion.section>
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
            <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <BanknotesIcon className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                {banking.bank_name || 'Payout account'}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Verified
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                    >
                        Update
                    </button>
                </div>

                <dl>
                    <InfoRow label="Account name" value={banking.account_name || '—'} />
                    <InfoRow label="Account number" value={banking.account_number_masked || '—'} />
                    <InfoRow
                        label="Verified"
                        value={
                            banking.account_verified_at
                                ? new Date(banking.account_verified_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                                : '—'
                        }
                    />
                </dl>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {!banking.is_verified && (
                <div className="rounded-2xl bg-linear-to-br from-primary-50 to-sky-50 px-4 py-5 ring-1 ring-primary-500/10 dark:from-primary-500/10 dark:to-sky-500/5 dark:ring-primary-400/15">
                    <p className="text-[14px] font-semibold text-stone-900 dark:text-white">Add payout bank</p>
                    <p className="mt-1 text-[12px] text-stone-600 dark:text-slate-300">
                        Verified with Paystack. Account name must match your business or contact person.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {(errors as { message?: string }).message && (
                    <div className="flex gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                        {(errors as { message?: string }).message}
                    </div>
                )}

                <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-stone-600 dark:text-slate-300">Bank</label>
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
                                className="w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[13px] font-medium text-stone-900 outline-none ring-1 ring-stone-900/[0.06] focus:ring-2 focus:ring-primary-200 dark:bg-white/5 dark:text-white dark:ring-white/10"
                                displayValue={(bank: Bank | null) => bank?.name || ''}
                                onChange={(event) => setBankQuery(event.target.value)}
                                placeholder="Search for a bank…"
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-[11px] text-stone-400">▼</span>
                            </ComboboxButton>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setBankQuery('')}
                            >
                                <ComboboxOptions className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-stone-900/10 dark:bg-slate-900 dark:ring-white/10">
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
                    <label className="mb-1.5 block text-[12px] font-medium text-stone-600 dark:text-slate-300">
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
                            className="w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[13px] font-medium tabular-nums outline-none ring-1 ring-stone-900/[0.06] focus:ring-2 focus:ring-primary-200 dark:bg-white/5 dark:text-white dark:ring-white/10"
                        />
                        <button
                            type="button"
                            onClick={resolveAccount}
                            disabled={resolving || data.account_number.length !== 10 || !data.bank_code}
                            className="shrink-0 rounded-xl bg-stone-900 px-4 py-3 text-[12px] font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-stone-900"
                        >
                            {resolving ? 'Checking…' : 'Verify'}
                        </button>
                    </div>
                    {errors.account_number && <p className="mt-1 text-[12px] text-rose-600">{errors.account_number}</p>}
                    {resolveError && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
                            <ExclamationCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {resolveError}
                        </p>
                    )}
                </div>

                {data.account_name && (
                    <div
                        className={`rounded-2xl px-4 py-3 ring-1 ${
                            matchAccepted
                                ? 'bg-emerald-50 ring-emerald-500/15 dark:bg-emerald-500/10'
                                : 'bg-amber-50 ring-amber-500/15 dark:bg-amber-500/10'
                        }`}
                    >
                        <p className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">Resolved name</p>
                        <p className="mt-0.5 text-[14px] font-semibold text-stone-900 dark:text-white">{data.account_name}</p>
                        {matchAccepted ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Matches partner identity
                                {matchScore != null && ` (${Math.round(matchScore * 100)}%)`}
                            </p>
                        ) : (
                            <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                Name does not match closely enough.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={processing || !matchAccepted || !data.account_name}
                        className="rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-40"
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
                            className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-stone-600 ring-1 ring-stone-200 dark:text-slate-300 dark:ring-white/10"
                        >
                            Cancel
                        </button>
                    )}
                    {recentlySuccessful && <span className="self-center text-[12px] font-medium text-emerald-600">Saved</span>}
                </div>
            </form>
        </div>
    );
}

export default function PartnerProfile({
    tab,
    user,
    partner,
    finance = { total_earned: 0, pending_commissions: 0, next_settlement_date: '—' },
    banks = [],
    activity,
}: Props) {
    const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : 'overview';
    const businessName = partner?.name ?? user.name;
    const initials = businessName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const isVerified = partner?.status === 'active';
    const memberSince = partner?.created_at_label ?? user.created_at_label ?? partner?.created_at ?? user.created_at ?? '—';
    const partnerCode = partner?.partner_code ?? '—';
    const securityScore = partner?.banking.is_verified ? 92 : 68;

    function setTab(key: string) {
        router.get('/partner/profile', { tab: key }, { preserveState: true, preserveScroll: true, replace: true });
    }

    return (
        <PartnerLayout>
            <Head title="Account Center" />

            <div className="mx-auto max-w-5xl space-y-6 pb-8">
                {/* ═══ HERO ═══ */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-[1.75rem] bg-[#061230] text-white shadow-[0_28px_64px_-32px_rgba(10,61,145,0.55)]"
                >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.42),transparent_58%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1),transparent_48%)]" />
                        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-sky-200/20 to-transparent" />
                    </div>

                    <div className="relative px-5 py-7 sm:px-8 sm:py-9">
                        <div className="flex flex-wrap items-start gap-5">
                            <div className="relative">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-lg font-bold shadow-lg shadow-blue-900/40 ring-2 ring-white/15 sm:h-20 sm:w-20 sm:text-xl">
                                    {initials}
                                </div>
                                {isVerified && (
                                    <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 ring-2 ring-[#061230]">
                                        <CheckCircleIcon className="h-4 w-4" />
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.85rem]">{businessName}</h1>
                                    {isVerified && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-[13px] text-white/50">
                                    Commercial partner
                                    {memberSince !== '—' && ` · Member since ${memberSince}`}
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <div className="rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10">
                                        <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">
                                            Commission
                                        </p>
                                        <p className="text-[13px] font-semibold">
                                            {formatCommission(partner?.commission_rate ?? null, partner?.commission_type ?? null)}
                                            <span className="ml-1 text-[11px] font-medium text-white/45">
                                                · {formatCommissionLength(partner?.commission_length ?? null)}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10">
                                        <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">
                                            Partner ID
                                        </p>
                                        <p className="font-mono text-[13px] font-semibold tracking-wide">{partnerCode}</p>
                                    </div>
                                    <div className="rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10">
                                        <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">Status</p>
                                        <p className="text-[13px] font-semibold capitalize">{partner?.status ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setTab('business')}
                                className="rounded-xl bg-white px-4 py-2.5 text-[12px] font-semibold text-stone-900 transition hover:bg-white/95"
                            >
                                Edit business
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('banking')}
                                className="rounded-xl bg-white/10 px-4 py-2.5 text-[12px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
                            >
                                {partner?.banking.is_verified ? 'Manage banking' : 'Add bank'}
                            </button>
                            <Link
                                href="/partner/support"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white/70 transition hover:text-white"
                            >
                                Support
                            </Link>
                        </div>
                    </div>
                </motion.section>

                {/* ═══ HORIZONTAL TABS ═══ */}
                <nav
                    className="sticky top-14 z-20 -mx-1 overflow-x-auto px-1 sm:top-16"
                    aria-label="Account sections"
                >
                    <div className="inline-flex min-w-full gap-0.5 rounded-2xl bg-white/90 p-1 shadow-sm ring-1 ring-stone-900/[0.05] backdrop-blur-xl dark:bg-slate-950/90 dark:ring-white/10 sm:min-w-0">
                        {TABS.map((t) => {
                            const isActive = active === t.key;

                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`relative shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition sm:px-3.5 ${
                                        isActive
                                            ? 'text-stone-900 dark:text-white'
                                            : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="accountTab"
                                            className="absolute inset-0 rounded-xl bg-stone-100 dark:bg-white/10"
                                            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                        />
                                    )}
                                    <span className="relative z-10">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ═══ TAB CONTENT ═══ */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-4"
                    >
                        {active === 'overview' && (
                            <div className="grid gap-4 lg:grid-cols-2">
                                <SectionCard
                                    title="Identity"
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => setTab('business')}
                                            className="text-[12px] font-semibold text-primary-600"
                                        >
                                            Edit
                                        </button>
                                    }
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-sm font-bold text-primary-700 dark:text-primary-300">
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                                {businessName}
                                            </p>
                                            <p className="text-[12px] text-stone-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <dl>
                                        <InfoRow label="Partner ID" value={<span className="font-mono">{partnerCode}</span>} />
                                        <InfoRow
                                            label="Verification"
                                            value={
                                                isVerified ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">Verified</span>
                                                ) : (
                                                    <span className="capitalize">{partner?.status ?? '—'}</span>
                                                )
                                            }
                                        />
                                        <InfoRow label="Member since" value={memberSince} />
                                    </dl>
                                </SectionCard>

                                <SectionCard
                                    title="Banking"
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => setTab('banking')}
                                            className="text-[12px] font-semibold text-primary-600"
                                        >
                                            {partner?.banking.is_verified ? 'Manage' : 'Add'}
                                        </button>
                                    }
                                >
                                    {partner?.banking.is_verified ? (
                                        <dl>
                                            <InfoRow label="Bank" value={partner.banking.bank_name} />
                                            <InfoRow label="Account" value={partner.banking.account_number_masked} />
                                            <InfoRow
                                                label="Status"
                                                value={<span className="text-emerald-600 dark:text-emerald-400">Verified</span>}
                                            />
                                        </dl>
                                    ) : (
                                        <div className="rounded-xl bg-stone-50 px-4 py-5 text-center dark:bg-white/[0.03]">
                                            <BanknotesIcon className="mx-auto h-8 w-8 text-stone-300" />
                                            <p className="mt-2 text-[13px] font-semibold text-stone-800 dark:text-white">
                                                No payout account
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setTab('banking')}
                                                className="mt-3 text-[12px] font-semibold text-primary-600"
                                            >
                                                Add bank →
                                            </button>
                                        </div>
                                    )}
                                </SectionCard>

                                <SectionCard
                                    title="Commission"
                                    action={
                                        <Link href="/partner/earnings" className="text-[12px] font-semibold text-primary-600">
                                            Earnings
                                        </Link>
                                    }
                                >
                                    <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                        {formatCommission(partner?.commission_rate ?? null, partner?.commission_type ?? null)}
                                    </p>
                                    <p className="mt-1 text-[12px] text-stone-500">
                                        {formatCommissionLength(partner?.commission_length ?? null)} · Monthly settlement
                                    </p>
                                    <dl className="mt-4">
                                        <InfoRow label="Settled" value={formatAmount(finance.total_earned)} />
                                        <InfoRow label="Pending" value={formatAmount(finance.pending_commissions)} />
                                        <InfoRow label="Next settlement" value={finance.next_settlement_date} />
                                    </dl>
                                </SectionCard>

                                <SectionCard title="Security">
                                    <div className="mb-3 flex items-end justify-between">
                                        <div>
                                            <p className="text-[11px] text-stone-400">Security score</p>
                                            <p className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {securityScore}
                                                <span className="text-sm font-medium text-stone-400">%</span>
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[12px] font-semibold ${
                                                securityScore >= 85
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                            }`}
                                        >
                                            {securityScore >= 85 ? 'Healthy' : 'Improve'}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                                        <motion.div
                                            className="h-full rounded-full bg-linear-to-r from-sky-400 to-primary-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${securityScore}%` }}
                                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTab('security')}
                                        className="mt-4 text-[12px] font-semibold text-primary-600"
                                    >
                                        Review security →
                                    </button>
                                </SectionCard>

                                <SectionCard
                                    title="Activity"
                                    className="lg:col-span-2"
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => setTab('activity')}
                                            className="text-[12px] font-semibold text-primary-600"
                                        >
                                            View all
                                        </button>
                                    }
                                >
                                    {activity.length === 0 ? (
                                        <p className="text-[13px] text-stone-500">No estate activity yet.</p>
                                    ) : (
                                        <ul className="divide-y divide-stone-100 dark:divide-white/[0.05]">
                                            {activity.slice(0, 4).map((item) => (
                                                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[11px] text-stone-500">{item.status_label}</p>
                                                    </div>
                                                    <span className="shrink-0 text-[11px] text-stone-400">{item.at_human}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </SectionCard>
                            </div>
                        )}

                        {active === 'business' && (
                            <SectionCard title="Business profile">
                                {partner ? (
                                    <dl>
                                        <InfoRow label="Organization" value={partner.name} />
                                        <InfoRow label="Contact person" value={partner.contact_person || '—'} />
                                        <InfoRow
                                            label="Website"
                                            value={
                                                partner.website ? (
                                                    <a
                                                        href={partner.website}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-primary-600"
                                                    >
                                                        <GlobeAltIcon className="h-3.5 w-3.5" />
                                                        {partner.website}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )
                                            }
                                        />
                                        <InfoRow label="Status" value={<span className="capitalize">{partner.status}</span>} />
                                        <InfoRow label="Partner since" value={memberSince} />
                                        {partner.description && (
                                            <div className="pt-3">
                                                <p className="text-[12px] text-stone-400">Description</p>
                                                <p className="mt-1 text-[13px] leading-relaxed text-stone-700 dark:text-slate-300">
                                                    {partner.description}
                                                </p>
                                            </div>
                                        )}
                                        <p className="pt-4 text-[12px] text-stone-500">
                                            To update registered business details,{' '}
                                            <Link href="/partner/support" className="font-semibold text-primary-600">
                                                contact support
                                            </Link>
                                            .
                                        </p>
                                    </dl>
                                ) : (
                                    <p className="text-[13px] text-stone-500">No partner organization linked.</p>
                                )}
                            </SectionCard>
                        )}

                        {active === 'banking' && (
                            <SectionCard title="Payout banking">
                                {partner?.banking ? (
                                    <BankingPanel banking={partner.banking} banks={banks} />
                                ) : (
                                    <p className="text-[13px] text-stone-500">No partner organization linked.</p>
                                )}
                            </SectionCard>
                        )}

                        {active === 'commission' && (
                            <div className="grid gap-4 lg:grid-cols-5">
                                <SectionCard title="Plan" className="lg:col-span-2">
                                    {partner ? (
                                        <>
                                            <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                                Growth
                                            </p>
                                            <p className="mt-1 text-4xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {formatCommission(partner.commission_rate, partner.commission_type)}
                                            </p>
                                            <p className="mt-2 text-[13px] text-stone-500">
                                                {formatCommissionLength(partner.commission_length)}
                                            </p>
                                            <p className="mt-1 text-[12px] capitalize text-stone-400">
                                                {partner.commission_type ?? 'percentage'} plan
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-[13px] text-stone-500">Unavailable</p>
                                    )}
                                </SectionCard>
                                <SectionCard title="Settlements" className="lg:col-span-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-stone-50 px-3.5 py-3 dark:bg-white/[0.04]">
                                            <p className="text-[10px] text-stone-400">Total settled</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {formatAmount(finance.total_earned)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-stone-50 px-3.5 py-3 dark:bg-white/[0.04]">
                                            <p className="text-[10px] text-stone-400">Pending</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-primary-700 dark:text-primary-300">
                                                {formatAmount(finance.pending_commissions)}
                                            </p>
                                        </div>
                                    </div>
                                    <dl className="mt-2">
                                        <InfoRow label="Schedule" value="Monthly" />
                                        <InfoRow label="Next settlement" value={finance.next_settlement_date} />
                                    </dl>
                                    <Link
                                        href="/partner/earnings"
                                        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600"
                                    >
                                        Open earnings
                                        <ArrowRightIcon className="h-3.5 w-3.5" />
                                    </Link>
                                </SectionCard>
                            </div>
                        )}

                        {active === 'security' && (
                            <div className="grid gap-4 lg:grid-cols-2">
                                <SectionCard title="Security score">
                                    <p className="text-4xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                        {securityScore}
                                        <span className="text-lg text-stone-400">%</span>
                                    </p>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                                        <motion.div
                                            className="h-full rounded-full bg-linear-to-r from-sky-400 to-primary-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${securityScore}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                    <p className="mt-2 text-[12px] text-stone-500">
                                        {partner?.banking.is_verified
                                            ? 'Bank verified · Account protected'
                                            : 'Add a verified bank account to improve your score'}
                                    </p>
                                </SectionCard>

                                <SectionCard title="Sessions">
                                    <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-4 py-3.5 dark:bg-white/[0.04]">
                                        <UserCircleIcon className="mt-0.5 h-5 w-5 text-stone-400" />
                                        <div>
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                This device
                                            </p>
                                            <p className="mt-0.5 text-[12px] text-stone-500">
                                                Active session · Device management coming soon
                                            </p>
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard title="Login email" className="lg:col-span-2">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-stone-500">
                                                If you have an issue with your login email, contact support so we can
                                                verify the change securely.
                                            </p>
                                        </div>
                                        <Link
                                            href="/partner/support"
                                            className="shrink-0 rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                                        >
                                            Contact support
                                        </Link>
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {active === 'activity' && (
                            <SectionCard title="Recent activity">
                                {activity.length === 0 ? (
                                    <div className="flex items-center gap-3 py-4">
                                        <ClockIcon className="h-8 w-8 text-stone-300" />
                                        <div>
                                            <p className="text-[13px] font-semibold text-stone-800 dark:text-white">
                                                No activity yet
                                            </p>
                                            <p className="text-[12px] text-stone-500">Estate events will appear here.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <ol className="relative ml-2 space-y-0 border-l border-stone-200 pl-5 dark:border-slate-700">
                                        {activity.map((item, i) => (
                                            <motion.li
                                                key={item.id}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.03 * i }}
                                                className="relative pb-5 last:pb-0"
                                            >
                                                <span className="absolute top-1.5 -left-[1.4rem] h-2.5 w-2.5 rounded-full bg-primary-500 ring-4 ring-white dark:ring-slate-950" />
                                                <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 text-[12px] text-stone-500">
                                                    {item.status_label}
                                                    <span className="text-stone-300"> · </span>
                                                    {item.at_human}
                                                </p>
                                            </motion.li>
                                        ))}
                                    </ol>
                                )}
                            </SectionCard>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </PartnerLayout>
    );
}
