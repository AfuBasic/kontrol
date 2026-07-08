import {
    BuildingOffice2Icon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    HomeIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
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
    { key: 'estate', title: 'Estate info', icon: BuildingOffice2Icon },
    { key: 'details', title: 'Location & size', icon: HomeIcon },
    { key: 'chairman', title: 'Chairman', icon: UserIcon },
    { key: 'documents', title: 'Documents', icon: DocumentTextIcon },
    { key: 'review', title: 'Review', icon: CheckCircleIcon },
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

/**
 * Rough annual commission estimate for motivation only.
 * Assumes ₦50k average monthly dues per house and partner rate.
 */
function estimateAnnualCommission(
    houses: number,
    rate: string | null | undefined,
    type: string | null | undefined,
): number | null {
    if (!houses || houses < 1) return null;
    const annualRevenueKobo = houses * 50_000 * 12 * 100; // ₦50k/house/month in kobo

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
    return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function inputClass(hasError?: boolean): string {
    return `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-primary-100 dark:bg-slate-900 dark:text-white ${
        hasError
            ? 'border-red-300 focus:border-red-400'
            : 'border-slate-200 focus:border-primary-400 dark:border-slate-700'
    }`;
}

export default function PartnerEstate({ partner }: Props) {
    const draft = typeof window !== 'undefined' ? loadDraft() : null;
    const [step, setStep] = useState(0);
    const [docPlaceholder, setDocPlaceholder] = useState<string[]>([]);

    const { data, setData, post, processing, errors, clearErrors } = useForm<FormData>({
        ...emptyForm,
        ...draft,
    });

    useEffect(() => {
        const payload = JSON.stringify(data);
        localStorage.setItem(DRAFT_KEY, payload);
    }, [data]);

    const progress = ((step + 1) / STEPS.length) * 100;
    const houses = Number(data.number_of_houses) || 0;
    const estimate = useMemo(
        () => estimateAnnualCommission(houses, partner?.commission_rate, partner?.commission_type),
        [houses, partner?.commission_rate, partner?.commission_type],
    );

    function validateStep(current: number): boolean {
        clearErrors();

        if (current === 0) {
            if (!data.estate_name.trim()) {
                return false;
            }
        }

        if (current === 2) {
            if (!data.chairman_name.trim() || !data.chairman_phone.trim() || !data.chairman_email.trim()) {
                return false;
            }
        }

        return true;
    }

    function next() {
        if (!validateStep(step)) {
            // Soft block: still allow navigation only after required fields; use native HTML required on submit
            if (step === 0 && !data.estate_name.trim()) return;
            if (step === 2 && (!data.chairman_name.trim() || !data.chairman_phone.trim() || !data.chairman_email.trim())) {
                return;
            }
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

    function goToStep(index: number) {
        setStep(index);
    }

    return (
        <PartnerLayout>
            <Head title="Submit Estate – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Submit estate</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Refer a new estate{partner ? ` as ${partner.name}` : ''}. Drafts auto-save on this device.
                    </p>
                </div>

                {/* Progress */}
                <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>
                            Step {step + 1} of {STEPS.length}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <motion.div
                            className="h-full rounded-full bg-primary-600"
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                        />
                    </div>
                    <ol className="mt-4 flex flex-wrap gap-2">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;

                            return (
                                <li key={s.key}>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(i)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                                            active
                                                ? 'bg-primary-600 text-white'
                                                : done
                                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {s.title}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {step === 0 && (
                                <>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Estate information</h2>
                                    <div>
                                        <label htmlFor="estate_name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                        <label htmlFor="estate_address" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Estate address
                                        </label>
                                        <textarea
                                            id="estate_address"
                                            value={data.estate_address}
                                            onChange={(e) => setData('estate_address', e.target.value)}
                                            rows={3}
                                            className={inputClass()}
                                        />
                                    </div>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Location & size</h2>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="state" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                            <label htmlFor="lga" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                                                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                                                    <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                                        Potential annual commission
                                                    </p>
                                                    <p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-100">
                                                        ~{formatAmount(estimate)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                                                        Rough estimate using{' '}
                                                        {formatCommission(partner?.commission_rate ?? null, partner?.commission_type ?? null)}{' '}
                                                        and ₦50k avg monthly dues per house. Not a guarantee.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Chairman contact</h2>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="chairman_name"
                                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Chairman name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="chairman_name"
                                                type="text"
                                                required
                                                value={data.chairman_name}
                                                onChange={(e) => setData('chairman_name', e.target.value)}
                                                className={inputClass(!!errors.chairman_name)}
                                            />
                                            <FieldError message={errors.chairman_name} />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="chairman_phone"
                                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="chairman_phone"
                                                type="tel"
                                                required
                                                value={data.chairman_phone}
                                                onChange={(e) => setData('chairman_phone', e.target.value)}
                                                className={inputClass(!!errors.chairman_phone)}
                                            />
                                            <FieldError message={errors.chairman_phone} />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="chairman_email"
                                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="chairman_email"
                                                type="email"
                                                required
                                                value={data.chairman_email}
                                                onChange={(e) => setData('chairman_email', e.target.value)}
                                                className={inputClass(!!errors.chairman_email)}
                                            />
                                            <FieldError message={errors.chairman_email} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Supporting documents</h2>
                                    <p className="text-sm text-slate-500">
                                        File upload will be available soon. Optionally note which documents you can provide.
                                    </p>
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/40">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Document checklist (optional)</p>
                                        <div className="mt-3 space-y-2">
                                            {['Estate photos', 'Chairman ID', 'Gate pass / introduction letter'].map((label) => {
                                                const checked = docPlaceholder.includes(label);

                                                return (
                                                    <label key={label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() =>
                                                                setDocPlaceholder((prev) =>
                                                                    checked ? prev.filter((x) => x !== label) : [...prev, label],
                                                                )
                                                            }
                                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                        />
                                                        {label} available offline
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Notes for the review team
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={4}
                                            className={inputClass()}
                                            placeholder="Any additional context…"
                                        />
                                    </div>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Review & submit</h2>
                                    <p className="text-sm text-slate-500">Confirm everything looks right before sending to Kontrol.</p>
                                    <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                                        {[
                                            { label: 'Estate', value: data.estate_name, step: 0 },
                                            { label: 'Address', value: data.estate_address || '—', step: 0 },
                                            {
                                                label: 'Location',
                                                value: [data.lga, data.state].filter(Boolean).join(', ') || '—',
                                                step: 1,
                                            },
                                            { label: 'Houses', value: data.number_of_houses || '—', step: 1 },
                                            { label: 'Chairman', value: data.chairman_name, step: 2 },
                                            { label: 'Phone', value: data.chairman_phone, step: 2 },
                                            { label: 'Email', value: data.chairman_email, step: 2 },
                                            { label: 'Notes', value: data.notes || '—', step: 3 },
                                        ].map((row) => (
                                            <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                                                <div>
                                                    <dt className="text-xs font-medium text-slate-500 uppercase">{row.label}</dt>
                                                    <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{row.value}</dd>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goToStep(row.step)}
                                                    className="shrink-0 text-xs font-semibold text-primary-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ))}
                                    </dl>
                                    {estimate != null && (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                                            <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                                Estimated potential annual commission:{' '}
                                                <strong>~{formatAmount(estimate)}</strong>
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={back}
                            disabled={step === 0}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                            Back
                        </button>

                        {step < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={next}
                                className="inline-flex items-center gap-1 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
                            >
                                Continue
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-50"
                            >
                                {processing ? 'Submitting…' : 'Submit partner request'}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </PartnerLayout>
    );
}
