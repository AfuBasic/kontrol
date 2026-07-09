import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BuildingOffice2Icon,
    CheckIcon,
    InformationCircleIcon,
    MapPinIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
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
        title: 'Estate Identity',
        guidance: 'Official name and address of the estate.',
        icon: BuildingOffice2Icon,
    },
    {
        key: 'details',
        title: 'Location',
        guidance: 'Where it is and how large it is.',
        icon: MapPinIcon,
    },
    {
        key: 'contact',
        title: 'Contact',
        guidance: 'Who we should reach after review.',
        icon: UserCircleIcon,
    },
    {
        key: 'review',
        title: 'Review',
        guidance: 'Confirm details before submitting.',
        icon: SparklesIcon,
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
        if (!raw) {
            return null;
        }

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
    if (!houses || houses < 1) {
        return null;
    }

    const annualRevenueKobo = houses * 50_000 * 12 * 100;

    if (type === 'fixed' && rate) {
        return Math.round(Number(rate) * houses * 12);
    }

    if (rate) {
        return Math.round(annualRevenueKobo * (Number(rate) / 100));
    }

    return Math.round(annualRevenueKobo * 0.1);
}

/** Optional help — revealed on demand only. */
function HelpTip({ text }: { text: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const tipId = useId();

    useEffect(() => {
        if (!open) {
            return;
        }

        function onDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onDown);

        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    return (
        <div className="relative inline-flex" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={tipId}
                aria-label="Help"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-stone-300 transition hover:bg-stone-100 hover:text-stone-500 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
            >
                <InformationCircleIcon className="h-4 w-4" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        id={tipId}
                        role="tooltip"
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 z-20 mt-1.5 w-56 rounded-xl bg-stone-900 px-3 py-2 text-[12px] leading-relaxed text-white shadow-xl dark:bg-slate-800"
                    >
                        {text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Field({
    id,
    label,
    required,
    help,
    error,
    children,
    className = '',
}: {
    id: string;
    label: string;
    required?: boolean;
    help?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <div className="mb-1.5 flex items-center gap-1.5">
                <label htmlFor={id} className="text-[13px] font-medium text-stone-700 dark:text-slate-200">
                    {label}
                    {required && <span className="text-stone-300 dark:text-slate-600"> *</span>}
                </label>
                {help && <HelpTip text={help} />}
            </div>
            {children}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400"
                        role="alert"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

const controlBase =
    'w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.04)] outline-none transition duration-200 ' +
    'placeholder:text-stone-300/90 ' +
    'hover:border-stone-300 ' +
    'focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(31,111,219,0.12)] ' +
    'dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-600 ' +
    'dark:hover:border-slate-600 dark:focus:border-primary-500 dark:focus:shadow-[0_0_0_3px_rgba(31,111,219,0.2)]';

function controlClass(hasError?: boolean): string {
    if (hasError) {
        return `${controlBase} border-rose-300 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)] dark:border-rose-500/50`;
    }

    return `${controlBase} border-stone-200/90 dark:border-slate-700`;
}

function StepRail({ step, onJump }: { step: number; onJump: (index: number) => void }) {
    return (
        <nav aria-label="Submission progress" className="hidden lg:block">
            <ol className="space-y-1">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = i < step;
                    const active = i === step;

                    return (
                        <li key={s.key}>
                            <button
                                type="button"
                                onClick={() => onJump(i)}
                                aria-current={active ? 'step' : undefined}
                                className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                                    active
                                        ? 'bg-white shadow-sm ring-1 ring-stone-900/[0.06] dark:bg-white/[0.06] dark:ring-white/10'
                                        : 'hover:bg-stone-100/80 dark:hover:bg-white/[0.03]'
                                }`}
                            >
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                                        done
                                            ? 'bg-primary-600 text-white'
                                            : active
                                              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                              : 'bg-stone-100 text-stone-400 dark:bg-slate-800 dark:text-slate-500'
                                    }`}
                                >
                                    {done ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Icon className="h-3.5 w-3.5" />}
                                </span>
                                <span className="min-w-0">
                                    <span
                                        className={`block text-[13px] font-medium tracking-tight ${
                                            active
                                                ? 'text-stone-900 dark:text-white'
                                                : done
                                                  ? 'text-stone-600 dark:text-slate-300'
                                                  : 'text-stone-400 dark:text-slate-500'
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                    <AnimatePresence initial={false}>
                                        {active && (
                                            <motion.span
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-0.5 block overflow-hidden text-[11px] leading-snug text-stone-400 dark:text-slate-500"
                                            >
                                                {s.guidance}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function MobileProgress({ step }: { step: number }) {
    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <div className="lg:hidden">
            <div className="h-1 overflow-hidden rounded-full bg-stone-200/80 dark:bg-slate-800">
                <motion.div
                    className="h-full rounded-full bg-primary-600"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                />
            </div>
            <div className="mt-3 flex justify-between gap-1">
                {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;

                    return (
                        <span
                            key={s.key}
                            className={`text-[10px] font-semibold tracking-wide ${
                                active
                                    ? 'text-stone-900 dark:text-white'
                                    : done
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-stone-300 dark:text-slate-600'
                            }`}
                        >
                            {s.title.split(' ')[0]}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

export default function PartnerEstate({ partner }: Props) {
    const draft = typeof window !== 'undefined' ? loadDraft() : null;
    const [step, setStep] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [attemptedContinue, setAttemptedContinue] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        ...emptyForm,
        ...draft,
    });

    useEffect(() => {
        setSaveStatus('saving');
        const timer = window.setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            setSaveStatus('saved');
        }, 450);

        return () => window.clearTimeout(timer);
    }, [data]);

    useEffect(() => {
        setAttemptedContinue(false);
    }, [step]);

    const houses = Number(data.number_of_houses) || 0;
    const estimate = useMemo(
        () => estimateAnnualCommission(houses, partner?.commission_rate, partner?.commission_type),
        [houses, partner?.commission_rate, partner?.commission_type],
    );

    const current = STEPS[step];

    function markTouched(key: string) {
        setTouched((prev) => ({ ...prev, [key]: true }));
    }

    function canProceed(): boolean {
        if (step === 0) {
            return data.estate_name.trim().length > 0;
        }

        if (step === 2) {
            return (
                data.chairman_name.trim().length > 0 &&
                data.chairman_phone.trim().length > 0 &&
                data.chairman_email.trim().length > 0
            );
        }

        return true;
    }

    function next() {
        if (!canProceed()) {
            setAttemptedContinue(true);
            if (step === 0) {
                markTouched('estate_name');
            }
            if (step === 2) {
                markTouched('chairman_name');
                markTouched('chairman_phone');
                markTouched('chairman_email');
            }

            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }

    function back() {
        setStep((s) => Math.max(s - 1, 0));
    }

    function submitEstate() {
        post('/partner/partner-requests', {
            onSuccess: () => clearDraft(),
        });
    }

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (step < STEPS.length - 1) {
            next();

            return;
        }

        submitEstate();
    }

    const showEstateNameError = (touched.estate_name || attemptedContinue) && !data.estate_name.trim();
    const showNameError = (touched.chairman_name || attemptedContinue) && !data.chairman_name.trim();
    const showPhoneError = (touched.chairman_phone || attemptedContinue) && !data.chairman_phone.trim();
    const showEmailError = (touched.chairman_email || attemptedContinue) && !data.chairman_email.trim();

    const saveLabel =
        saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Auto-saved just now' : 'Draft ready';

    return (
        <PartnerLayout>
            <Head title="Submit estate" />

            <div className="relative mx-auto max-w-4xl">
                <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-14">
                    {/* Progress */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="mb-5 hidden lg:block">
                            <p className="text-[11px] font-medium tracking-wide text-stone-400 dark:text-slate-500">
                                Submit estate
                            </p>
                            <h1 className="mt-1 text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                                New referral
                            </h1>
                        </div>
                        <StepRail step={step} onJump={setStep} />
                    </aside>

                    {/* Form */}
                    <div className="min-w-0">
                        <div className="mb-6 lg:hidden">
                            <p className="text-[11px] font-medium tracking-wide text-stone-400">Submit estate</p>
                            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                {current.title}
                            </h1>
                        </div>

                        <MobileProgress step={step} />

                        <form onSubmit={handleFormSubmit} className="mt-8 lg:mt-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Step header — title + one line */}
                                    <header className="mb-8 hidden lg:block">
                                        <h2 className="text-[1.65rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                                            {current.title}
                                        </h2>
                                        <p className="mt-1.5 text-[14px] text-stone-500 dark:text-slate-400">
                                            {current.guidance}
                                        </p>
                                    </header>

                                    <div className="space-y-5">
                                        {step === 0 && (
                                            <>
                                                <Field
                                                    id="estate_name"
                                                    label="Estate name"
                                                    required
                                                    help="Use the official name residents know."
                                                    error={
                                                        errors.estate_name ||
                                                        (showEstateNameError ? 'Estate name is required.' : undefined)
                                                    }
                                                >
                                                    <input
                                                        id="estate_name"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        value={data.estate_name}
                                                        onChange={(e) => setData('estate_name', e.target.value)}
                                                        onBlur={() => markTouched('estate_name')}
                                                        placeholder="Palm Court Estate"
                                                        className={controlClass(!!errors.estate_name || showEstateNameError)}
                                                    />
                                                </Field>

                                                <Field id="estate_address" label="Street address" help="Optional. Helps during review.">
                                                    <textarea
                                                        id="estate_address"
                                                        rows={2}
                                                        value={data.estate_address}
                                                        onChange={(e) => setData('estate_address', e.target.value)}
                                                        placeholder="Street, area, landmarks"
                                                        className={`${controlClass()} resize-none`}
                                                    />
                                                </Field>
                                            </>
                                        )}

                                        {step === 1 && (
                                            <>
                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <Field id="state" label="State">
                                                        <select
                                                            id="state"
                                                            value={data.state}
                                                            onChange={(e) => setData('state', e.target.value)}
                                                            className={`${controlClass()} appearance-none bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat pr-9`}
                                                            style={{
                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a8a29e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                                                            }}
                                                        >
                                                            <option value="">Select state</option>
                                                            {NIGERIA_STATES.map((state) => (
                                                                <option key={state} value={state}>
                                                                    {state}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>

                                                    <Field id="lga" label="LGA">
                                                        <input
                                                            id="lga"
                                                            type="text"
                                                            value={data.lga}
                                                            onChange={(e) => setData('lga', e.target.value)}
                                                            placeholder="Local government area"
                                                            className={controlClass()}
                                                        />
                                                    </Field>
                                                </div>

                                                <Field
                                                    id="number_of_houses"
                                                    label="Number of houses"
                                                    help="Approximate is fine. Used for your commission preview."
                                                >
                                                    <input
                                                        id="number_of_houses"
                                                        type="number"
                                                        min={1}
                                                        value={data.number_of_houses}
                                                        onChange={(e) => setData('number_of_houses', e.target.value)}
                                                        placeholder="e.g. 120"
                                                        className={`${controlClass()} tabular-nums`}
                                                    />
                                                </Field>

                                                <AnimatePresence>
                                                    {estimate != null && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 4 }}
                                                            className="flex items-baseline justify-between gap-4 rounded-xl bg-stone-50 px-4 py-3.5 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10"
                                                        >
                                                            <div>
                                                                <p className="text-[11px] font-medium tracking-wide text-stone-400 uppercase">
                                                                    Est. annual commission
                                                                </p>
                                                                <p className="mt-0.5 text-xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                                                    ~{formatAmount(estimate)}
                                                                </p>
                                                            </div>
                                                            <p className="text-right text-[11px] text-stone-400">
                                                                {formatCommission(
                                                                    partner?.commission_rate ?? null,
                                                                    partner?.commission_type ?? null,
                                                                )}
                                                                <br />
                                                                Illustrative
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        )}

                                        {step === 2 && (
                                            <>
                                                <Field
                                                    id="chairman_name"
                                                    label="Full name"
                                                    required
                                                    help="Estate lead, secretary, or property manager."
                                                    error={
                                                        errors.chairman_name ||
                                                        (showNameError ? 'Name is required.' : undefined)
                                                    }
                                                >
                                                    <input
                                                        id="chairman_name"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        autoComplete="name"
                                                        value={data.chairman_name}
                                                        onChange={(e) => setData('chairman_name', e.target.value)}
                                                        onBlur={() => markTouched('chairman_name')}
                                                        placeholder="Full name"
                                                        className={controlClass(!!errors.chairman_name || showNameError)}
                                                    />
                                                </Field>

                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <Field
                                                        id="chairman_phone"
                                                        label="Phone"
                                                        required
                                                        error={
                                                            errors.chairman_phone ||
                                                            (showPhoneError ? 'Phone is required.' : undefined)
                                                        }
                                                    >
                                                        <input
                                                            id="chairman_phone"
                                                            type="tel"
                                                            required
                                                            autoComplete="tel"
                                                            value={data.chairman_phone}
                                                            onChange={(e) => setData('chairman_phone', e.target.value)}
                                                            onBlur={() => markTouched('chairman_phone')}
                                                            placeholder="0803…"
                                                            className={controlClass(!!errors.chairman_phone || showPhoneError)}
                                                        />
                                                    </Field>

                                                    <Field
                                                        id="chairman_email"
                                                        label="Email"
                                                        required
                                                        error={
                                                            errors.chairman_email ||
                                                            (showEmailError ? 'Email is required.' : undefined)
                                                        }
                                                    >
                                                        <input
                                                            id="chairman_email"
                                                            type="email"
                                                            required
                                                            autoComplete="email"
                                                            value={data.chairman_email}
                                                            onChange={(e) => setData('chairman_email', e.target.value)}
                                                            onBlur={() => markTouched('chairman_email')}
                                                            placeholder="name@estate.com"
                                                            className={controlClass(!!errors.chairman_email || showEmailError)}
                                                        />
                                                    </Field>
                                                </div>
                                            </>
                                        )}

                                        {step === 3 && (
                                            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-900/[0.05] dark:bg-white/[0.03] dark:ring-white/10">
                                                {[
                                                    {
                                                        group: 'Estate',
                                                        step: 0,
                                                        rows: [
                                                            { label: 'Name', value: data.estate_name || '—' },
                                                            { label: 'Address', value: data.estate_address || '—' },
                                                        ],
                                                    },
                                                    {
                                                        group: 'Location',
                                                        step: 1,
                                                        rows: [
                                                            {
                                                                label: 'Area',
                                                                value: [data.lga, data.state].filter(Boolean).join(', ') || '—',
                                                            },
                                                            { label: 'Houses', value: data.number_of_houses || '—' },
                                                        ],
                                                    },
                                                    {
                                                        group: 'Contact',
                                                        step: 2,
                                                        rows: [
                                                            { label: 'Name', value: data.chairman_name || '—' },
                                                            { label: 'Phone', value: data.chairman_phone || '—' },
                                                            { label: 'Email', value: data.chairman_email || '—' },
                                                        ],
                                                    },
                                                ].map((section, idx) => (
                                                    <div
                                                        key={section.group}
                                                        className={idx > 0 ? 'border-t border-stone-100 dark:border-white/[0.06]' : ''}
                                                    >
                                                        <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                                                            <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                                                {section.group}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setStep(section.step)}
                                                                className="text-[12px] font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                        <dl className="px-4 pb-3 sm:px-5">
                                                            {section.rows.map((row) => (
                                                                <div
                                                                    key={row.label}
                                                                    className="flex items-baseline justify-between gap-4 py-1.5"
                                                                >
                                                                    <dt className="text-[12px] text-stone-400">{row.label}</dt>
                                                                    <dd className="text-right text-[14px] font-medium text-stone-900 dark:text-white">
                                                                        {row.value}
                                                                    </dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    </div>
                                                ))}

                                                {estimate != null && (
                                                    <div className="border-t border-stone-100 px-4 py-3.5 sm:px-5 dark:border-white/[0.06]">
                                                        <div className="flex items-baseline justify-between gap-3">
                                                            <p className="text-[12px] text-stone-500">Est. annual commission</p>
                                                            <p className="text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                                ~{formatAmount(estimate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Action bar */}
                            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 pt-5 dark:border-white/[0.06]">
                                <div className="flex min-w-0 flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={back}
                                        disabled={step === 0}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-25 dark:text-slate-300 dark:hover:bg-white/5"
                                    >
                                        <ArrowLeftIcon className="h-4 w-4" />
                                        Back
                                    </button>
                                    <span className="hidden text-[12px] text-stone-400 sm:inline dark:text-slate-500">
                                        Step {step + 1} of {STEPS.length}
                                        <span className="mx-1.5 text-stone-300 dark:text-slate-600">·</span>
                                        <span
                                            className={
                                                saveStatus === 'saved'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : ''
                                            }
                                        >
                                            {saveStatus === 'saved' && (
                                                <CheckCircleIcon className="mr-1 inline h-3 w-3 -translate-y-px" />
                                            )}
                                            {saveLabel}
                                        </span>
                                    </span>
                                </div>

                                {step < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            next();
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-stone-800 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                                    >
                                        Continue
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            submitEstate();
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-500 disabled:opacity-60 active:scale-[0.98]"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                Submit estate
                                                <PaperAirplaneIcon className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <p className="mt-3 text-center text-[11px] text-stone-400 sm:hidden">
                                Step {step + 1} of {STEPS.length} · {saveLabel}
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
