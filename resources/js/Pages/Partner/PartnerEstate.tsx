import {
    BuildingOffice2Icon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    DocumentTextIcon,
    HomeIcon,
    LightBulbIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission } from '@/Utils/money';
import { NIGERIA_STATES } from '@/Utils/nigeria-states';

interface Props {
    partner?: {
        id: number;
        name: string;
        commission_rate: string | null;
        commission_type: string | null;
    } | null;
}

const STEPS = [
    {
        key: 'estate',
        title: 'Estate info',
        icon: BuildingOffice2Icon,
        minutes: 1,
        tip: 'Use the official estate name residents will recognize.',
    },
    {
        key: 'details',
        title: 'Location & size',
        icon: HomeIcon,
        minutes: 1,
        tip: 'House count powers your commission estimate — rough numbers are fine.',
    },
    {
        key: 'contact',
        title: 'Contact person',
        icon: UserIcon,
        minutes: 1,
        tip: 'We contact this person after review — accuracy speeds approval.',
    },
    {
        key: 'documents',
        title: 'Documents',
        icon: DocumentTextIcon,
        minutes: 1,
        tip: 'Uploads are coming soon; note what you can provide offline.',
    },
    {
        key: 'review',
        title: 'Review',
        icon: CheckCircleIcon,
        minutes: 1,
        tip: 'Double-check contacts before submitting — edits after review need support.',
    },
] as const;

const DRAFT_KEY = 'partner-estate-draft-v1';

type FormData = {
    estate_name: string;
    estate_address: string;
    chairman_name: string;
    chairman_phone: string;
    chairman_email: string;
    number_of_houses: string;
    state: string;
    lga: string;
    notes: string;
};

const emptyForm: FormData = {
    estate_name: '',
    estate_address: '',
    chairman_name: '',
    chairman_phone: '',
    chairman_email: '',
    number_of_houses: '',
    state: '',
    lga: '',
    notes: '',
};

function loadDraft(): Partial<FormData> | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as Partial<FormData>;
    } catch {
        return null;
    }
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

function estimateAnnualCommission(
    houses: number,
    rate: string | null | undefined,
    type: string | null | undefined,
): number | null {
    if (!houses || houses < 1) return null;
    const annualRevenueKobo = houses * 50_000 * 12 * 100;

    if (type === 'fixed' && rate) {
        return Math.round(Number(rate) * houses * 12);
    }

    if (rate) {
        return Math.round(annualRevenueKobo * (Number(rate) / 100));
    }

    return Math.round(annualRevenueKobo * 0.1);
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-[12px] text-red-600">{message}</p>;
}

function inputClass(hasError?: boolean): string {
    return `w-full rounded-lg border px-3 py-2 text-[13px] text-stone-900 shadow-sm outline-none transition focus:ring-2 focus:ring-primary-100 dark:bg-slate-900 dark:text-white ${
        hasError
            ? 'border-red-300 focus:border-red-400'
            : 'border-stone-200 focus:border-primary-400 dark:border-slate-700'
    }`;
}

export default function PartnerEstate({ partner }: Props) {
    const draft = typeof window !== 'undefined' ? loadDraft() : null;
    const [step, setStep] = useState(0);
    const [docPlaceholder, setDocPlaceholder] = useState<string[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const { data, setData, post, processing, errors } = useForm<FormData>({
        ...emptyForm,
        ...draft,
    });

    useEffect(() => {
        setSaveStatus('saving');
        const timer = window.setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            setSaveStatus('saved');
        }, 400);

        return () => window.clearTimeout(timer);
    }, [data]);

    const progress = ((step + 1) / STEPS.length) * 100;
    const remainingMinutes = STEPS.slice(step).reduce((sum, s) => sum + s.minutes, 0);
    const houses = Number(data.number_of_houses) || 0;
    const estimate = useMemo(
        () => estimateAnnualCommission(houses, partner?.commission_rate, partner?.commission_type),
        [houses, partner?.commission_rate, partner?.commission_type],
    );

    function next() {
        if (step === 0 && !data.estate_name.trim()) return;
        if (step === 2 && (!data.chairman_name.trim() || !data.chairman_phone.trim() || !data.chairman_email.trim())) {
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }

    function back() {
        setStep((s) => Math.max(s - 1, 0));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/partner/partner-requests', {
            onSuccess: () => clearDraft(),
        });
    }

    const current = STEPS[step];

    return (
        <PartnerLayout>
            <Head title="Submit estate" />

            <div className="mx-auto max-w-2xl space-y-4">
                <PageHeader
                    title="Submit estate"
                    description={
                        partner
                            ? `Guided referral for ${partner.name} — about ${remainingMinutes} min remaining.`
                            : `Guided onboarding — about ${remainingMinutes} min remaining.`
                    }
                    actions={
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-slate-400">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {saveStatus === 'saving' && <span>Saving draft…</span>}
                            {saveStatus === 'saved' && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                    Draft saved
                                </span>
                            )}
                            {saveStatus === 'idle' && <span>Auto-save on</span>}
                        </div>
                    }
                />

                <Surface padding="sm">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-stone-500">
                        <span>
                            Step {step + 1} of {STEPS.length} · {current.title}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div
                        className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <motion.div
                            className="h-full rounded-full bg-primary-600"
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    </div>
                    <ol className="mt-3 flex flex-wrap gap-1.5">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;

                            return (
                                <li key={s.key}>
                                    <button
                                        type="button"
                                        onClick={() => setStep(i)}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                                            active
                                                ? 'bg-primary-600 text-white'
                                                : done
                                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                                  : 'bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {s.title}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </Surface>

                <div className="flex gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <LightBulbIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-[12px] text-amber-900/90 dark:text-amber-100/90">
                        <span className="font-semibold">Tip: </span>
                        {current.tip}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Surface padding="md">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                className="space-y-4"
                            >
                                {step === 0 && (
                                    <>
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Estate information</h2>
                                        <div>
                                            <label htmlFor="estate_name" className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300">
                                                Estate name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="estate_name"
                                                type="text"
                                                required
                                                value={data.estate_name}
                                                onChange={(e) => setData('estate_name', e.target.value)}
                                                className={inputClass(!!errors.estate_name)}
                                                autoFocus
                                            />
                                            <FieldError message={errors.estate_name} />
                                        </div>
                                        <div>
                                            <label htmlFor="estate_address" className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300">
                                                Estate address
                                            </label>
                                            <textarea
                                                id="estate_address"
                                                value={data.estate_address}
                                                onChange={(e) => setData('estate_address', e.target.value)}
                                                rows={2}
                                                className={inputClass()}
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 1 && (
                                    <>
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Location & size</h2>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="state" className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300">
                                                    State
                                                </label>
                                                <select
                                                    id="state"
                                                    value={data.state}
                                                    onChange={(e) => setData('state', e.target.value)}
                                                    className={inputClass()}
                                                >
                                                    <option value="">Select state</option>
                                                    {NIGERIA_STATES.map((state) => (
                                                        <option key={state} value={state}>
                                                            {state}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="lga" className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300">
                                                    LGA
                                                </label>
                                                <input
                                                    id="lga"
                                                    type="text"
                                                    value={data.lga}
                                                    onChange={(e) => setData('lga', e.target.value)}
                                                    className={inputClass()}
                                                    placeholder="e.g. Ikeja"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="number_of_houses"
                                                    className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300"
                                                >
                                                    Number of houses
                                                </label>
                                                <input
                                                    id="number_of_houses"
                                                    type="number"
                                                    min={1}
                                                    value={data.number_of_houses}
                                                    onChange={(e) => setData('number_of_houses', e.target.value)}
                                                    className={inputClass()}
                                                />
                                                {estimate != null && (
                                                    <div className="mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/25">
                                                        <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                                            Potential annual commission
                                                        </p>
                                                        <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                                                            ~{formatAmount(estimate)}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                                                            Estimate at{' '}
                                                            {formatCommission(
                                                                partner?.commission_rate ?? null,
                                                                partner?.commission_type ?? null,
                                                            )}{' '}
                                                            · ₦50k avg dues/house/mo. Not a guarantee.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Contact person</h2>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="chairman_name"
                                                    className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300"
                                                >
                                                    Contact person name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="chairman_name"
                                                    type="text"
                                                    required
                                                    value={data.chairman_name}
                                                    onChange={(e) => setData('chairman_name', e.target.value)}
                                                    className={inputClass(!!errors.chairman_name)}
                                                    autoComplete="name"
                                                />
                                                <FieldError message={errors.chairman_name} />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="chairman_phone"
                                                    className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300"
                                                >
                                                    Contact person phone <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="chairman_phone"
                                                    type="tel"
                                                    required
                                                    value={data.chairman_phone}
                                                    onChange={(e) => setData('chairman_phone', e.target.value)}
                                                    className={inputClass(!!errors.chairman_phone)}
                                                    autoComplete="tel"
                                                />
                                                <FieldError message={errors.chairman_phone} />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="chairman_email"
                                                    className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300"
                                                >
                                                    Contact person email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="chairman_email"
                                                    type="email"
                                                    required
                                                    value={data.chairman_email}
                                                    onChange={(e) => setData('chairman_email', e.target.value)}
                                                    className={inputClass(!!errors.chairman_email)}
                                                    autoComplete="email"
                                                />
                                                <FieldError message={errors.chairman_email} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Supporting documents</h2>
                                        <p className="text-[12px] text-stone-500">
                                            File upload ships soon. Note what you can share offline for now.
                                        </p>
                                        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                                            <div className="space-y-1.5">
                                                {['Estate photos', 'Contact person ID', 'Gate pass / introduction letter'].map((label) => {
                                                    const checked = docPlaceholder.includes(label);

                                                    return (
                                                        <label
                                                            key={label}
                                                            className="flex items-center gap-2 text-[12px] text-stone-600 dark:text-slate-300"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setDocPlaceholder((prev) =>
                                                                        checked ? prev.filter((x) => x !== label) : [...prev, label],
                                                                    )
                                                                }
                                                                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            {label} available offline
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="notes" className="mb-1.5 block text-[12px] font-medium text-stone-700 dark:text-slate-300">
                                                Notes for the review team
                                            </label>
                                            <textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                rows={3}
                                                className={inputClass()}
                                                placeholder="Any additional context…"
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 4 && (
                                    <>
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Review & submit</h2>
                                        <dl className="divide-y divide-stone-100 rounded-lg border border-stone-200 dark:divide-slate-800 dark:border-slate-700">
                                            {[
                                                { label: 'Estate', value: data.estate_name, step: 0 },
                                                { label: 'Address', value: data.estate_address || '—', step: 0 },
                                                {
                                                    label: 'Location',
                                                    value: [data.lga, data.state].filter(Boolean).join(', ') || '—',
                                                    step: 1,
                                                },
                                                { label: 'Houses', value: data.number_of_houses || '—', step: 1 },
                                                { label: 'Contact person', value: data.chairman_name, step: 2 },
                                                { label: 'Contact phone', value: data.chairman_phone, step: 2 },
                                                { label: 'Contact email', value: data.chairman_email, step: 2 },
                                                { label: 'Notes', value: data.notes || '—', step: 3 },
                                            ].map((row) => (
                                                <div key={row.label} className="flex items-start justify-between gap-3 px-3 py-2">
                                                    <div>
                                                        <dt className="text-[10px] font-medium text-stone-400 uppercase">{row.label}</dt>
                                                        <dd className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {row.value}
                                                        </dd>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(row.step)}
                                                        className="text-[11px] font-semibold text-primary-600 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            ))}
                                        </dl>
                                        {estimate != null && (
                                            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
                                                Estimated potential annual commission: <strong>~{formatAmount(estimate)}</strong>
                                            </p>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-5 flex items-center justify-between gap-2 border-t border-stone-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={back}
                                disabled={step === 0}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                            >
                                <ChevronLeftIcon className="h-3.5 w-3.5" />
                                Back
                            </button>
                            {step < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-primary-500 active:scale-[0.98]"
                                >
                                    Continue
                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-lg bg-primary-600 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {processing ? 'Submitting…' : 'Submit request'}
                                </button>
                            )}
                        </div>
                    </Surface>
                </form>
            </div>
        </PartnerLayout>
    );
}
