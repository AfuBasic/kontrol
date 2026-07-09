import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BuildingOffice2Icon,
    CheckIcon,
    ClockIcon,
    CloudArrowUpIcon,
    HomeModernIcon,
    MapPinIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
        title: 'Estate identity',
        short: 'Identity',
        description: 'Name and address as residents know them.',
        icon: BuildingOffice2Icon,
        minutes: 1,
        accent: 'from-sky-500/15 to-primary-500/10',
        iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        tip: 'Use the official estate name — it becomes the label on My Estates and commissions.',
        why: 'Reviewers match this against maps and outreach. Clarity speeds approval.',
    },
    {
        key: 'details',
        title: 'Location & scale',
        short: 'Location',
        description: 'Where it sits and how large it is.',
        icon: MapPinIcon,
        minutes: 1,
        accent: 'from-violet-500/15 to-indigo-500/10',
        iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        tip: 'House count is approximate. It powers your commission preview — not a hard commitment.',
        why: 'Scale helps us prioritize outreach and estimate your upside.',
    },
    {
        key: 'contact',
        title: 'Contact person',
        short: 'Contact',
        description: 'Who we should reach after review.',
        icon: UserCircleIcon,
        minutes: 1,
        accent: 'from-amber-500/15 to-orange-500/10',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        tip: 'A responsive decision-maker — estate lead, secretary, or property manager.',
        why: 'We only contact them after internal review. Accuracy avoids delays.',
    },
    {
        key: 'review',
        title: 'Review & submit',
        short: 'Review',
        description: 'Confirm everything before we take it live.',
        icon: SparklesIcon,
        minutes: 1,
        accent: 'from-primary-500/15 to-emerald-500/10',
        iconBg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
        tip: 'Jump back to any step to edit. Submission freezes this version for review.',
        why: 'A final check prevents rework after the team starts processing.',
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

/* ——— Premium field primitives ——— */

function FieldShell({
    id,
    label,
    required,
    hint,
    example,
    error,
    children,
    className = '',
}: {
    id: string;
    label: string;
    required?: boolean;
    hint?: string;
    example?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`group/field ${className}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <label htmlFor={id} className="text-[13px] font-medium tracking-tight text-stone-800 dark:text-slate-100">
                    {label}
                    {required && (
                        <span className="ml-1 font-normal text-stone-400 dark:text-slate-500" aria-hidden>
                            required
                        </span>
                    )}
                </label>
                {example && (
                    <span className="text-[11px] text-stone-400 dark:text-slate-500">e.g. {example}</span>
                )}
            </div>
            {children}
            <div className="mt-1.5 min-h-[1.1rem]">
                {error ? (
                    <motion.p
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[12px] font-medium text-rose-600 dark:text-rose-400"
                        role="alert"
                    >
                        {error}
                    </motion.p>
                ) : hint ? (
                    <p className="text-[12px] leading-snug text-stone-400 dark:text-slate-500">{hint}</p>
                ) : null}
            </div>
        </div>
    );
}

const controlBase =
    'w-full rounded-2xl border bg-white/80 px-4 py-3.5 text-[15px] leading-snug text-stone-900 shadow-[0_1px_0_rgba(28,25,23,0.04)] outline-none transition-all duration-200 ' +
    'placeholder:text-stone-300 ' +
    'hover:border-stone-300 hover:bg-white ' +
    'focus:border-primary-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] ' +
    'dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-600 ' +
    'dark:hover:border-slate-600 dark:focus:border-primary-500 dark:focus:shadow-[0_0_0_4px_rgba(37,99,235,0.2)]';

function controlClass(hasError?: boolean, valid?: boolean): string {
    if (hasError) {
        return `${controlBase} border-rose-300 focus:border-rose-400 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)] dark:border-rose-500/50`;
    }

    if (valid) {
        return `${controlBase} border-emerald-200/90 dark:border-emerald-800/50`;
    }

    return `${controlBase} border-stone-200/90`;
}

function StepRail({
    step,
    onJump,
}: {
    step: number;
    onJump: (index: number) => void;
}) {
    return (
        <nav aria-label="Submission progress" className="hidden lg:block">
            <ol className="relative space-y-0">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = i < step;
                    const active = i === step;
                    const upcoming = i > step;

                    return (
                        <li key={s.key} className="relative flex gap-3 pb-8 last:pb-0">
                            {i < STEPS.length - 1 && (
                                <span
                                    className={`absolute top-10 left-[15px] h-[calc(100%-2rem)] w-px ${
                                        done ? 'bg-primary-400' : 'bg-stone-200 dark:bg-slate-700'
                                    }`}
                                    aria-hidden
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => onJump(i)}
                                className="relative z-10 flex shrink-0 outline-none"
                                aria-current={active ? 'step' : undefined}
                                aria-label={`${s.title}${done ? ', completed' : active ? ', current' : ''}`}
                            >
                                <motion.span
                                    layout
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold transition-all ${
                                        done
                                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                                            : active
                                              ? 'bg-stone-900 text-white ring-4 ring-primary-500/15 dark:bg-white dark:text-stone-900 dark:ring-primary-400/20'
                                              : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700'
                                    }`}
                                >
                                    {done ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
                                </motion.span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onJump(i)}
                                className={`min-w-0 flex-1 pt-0.5 text-left transition ${upcoming ? 'opacity-55' : ''}`}
                            >
                                <p
                                    className={`text-[13px] font-semibold tracking-tight ${
                                        active
                                            ? 'text-stone-900 dark:text-white'
                                            : done
                                              ? 'text-primary-700 dark:text-primary-300'
                                              : 'text-stone-500 dark:text-slate-400'
                                    }`}
                                >
                                    {s.title}
                                </p>
                                <p className="mt-0.5 text-[11px] leading-snug text-stone-400 dark:text-slate-500">
                                    {s.description}
                                </p>
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
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
                <span className="text-stone-500 dark:text-slate-400">
                    Step {step + 1} of {STEPS.length}
                </span>
                <span className="tabular-nums text-stone-600 dark:text-slate-300">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-stone-200/80 dark:bg-slate-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                    className="h-full rounded-full bg-linear-to-r from-primary-500 to-primary-600"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                />
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;

                    return (
                        <span
                            key={s.key}
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                                active
                                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                    : done
                                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                                      : 'bg-stone-100 text-stone-400 dark:bg-slate-800 dark:text-slate-500'
                            }`}
                        >
                            {s.short}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

function SavePill({ status }: { status: 'idle' | 'saving' | 'saved' }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={status}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-stone-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400"
            >
                {status === 'saving' && (
                    <>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        Saving draft…
                    </>
                )}
                {status === 'saved' && (
                    <>
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">Draft saved</span>
                    </>
                )}
                {status === 'idle' && (
                    <>
                        <CloudArrowUpIcon className="h-3.5 w-3.5" />
                        Auto-save ready
                    </>
                )}
            </motion.div>
        </AnimatePresence>
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

    const remainingMinutes = STEPS.slice(step).reduce((sum, s) => sum + s.minutes, 0);
    const houses = Number(data.number_of_houses) || 0;
    const estimate = useMemo(
        () => estimateAnnualCommission(houses, partner?.commission_rate, partner?.commission_type),
        [houses, partner?.commission_rate, partner?.commission_type],
    );

    const current = STEPS[step];
    const CurrentIcon = current.icon;

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
        // Never auto-submit when advancing steps (Enter key / button type swap).
        e.preventDefault();

        if (step < STEPS.length - 1) {
            next();

            return;
        }

        // Final step: only submit when the primary Submit control is used.
        // Enter on review still submits intentionally.
        submitEstate();
    }

    const showEstateNameError = (touched.estate_name || attemptedContinue) && !data.estate_name.trim();
    const showNameError = (touched.chairman_name || attemptedContinue) && !data.chairman_name.trim();
    const showPhoneError = (touched.chairman_phone || attemptedContinue) && !data.chairman_phone.trim();
    const showEmailError = (touched.chairman_email || attemptedContinue) && !data.chairman_email.trim();

    return (
        <PartnerLayout>
            <Head title="Submit estate" />

            <div className="relative -mx-4 -mt-1 min-h-[calc(100vh-8rem)] sm:-mx-5 sm:min-h-[calc(100vh-7rem)]">
                {/* Ambient canvas */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className={`absolute -top-24 -right-16 h-72 w-72 rounded-full bg-linear-to-br ${current.accent} blur-3xl transition-all duration-700`} />
                    <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-stone-300/20 blur-3xl dark:bg-slate-700/20" />
                </div>

                <div className="relative mx-auto grid max-w-5xl gap-8 px-4 pb-28 sm:px-5 lg:grid-cols-[220px_1fr] lg:gap-12 lg:pb-16">
                    {/* Journey rail */}
                    <aside className="lg:sticky lg:top-20 lg:self-start">
                        <div className="mb-6 hidden lg:block">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase dark:text-slate-500">
                                Referral journey
                            </p>
                            <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                Submit an estate
                            </h1>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500 dark:text-slate-400">
                                {partner
                                    ? `A guided referral for ${partner.name}.`
                                    : 'A guided referral into Kontrol.'}{' '}
                                About {remainingMinutes} min left.
                            </p>
                            <div className="mt-4">
                                <SavePill status={saveStatus} />
                            </div>
                        </div>
                        <StepRail step={step} onJump={setStep} />
                    </aside>

                    {/* Focused workspace */}
                    <div className="min-w-0">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 lg:hidden">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                                    Submit estate
                                </p>
                                <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                    {current.title}
                                </h1>
                            </div>
                            <SavePill status={saveStatus} />
                        </div>

                        <MobileProgress step={step} />

                        <form onSubmit={handleFormSubmit} className="mt-6 lg:mt-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Step hero */}
                                    <div className="mb-8 flex gap-4">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${current.iconBg} ring-1 ring-black/[0.03] dark:ring-white/5`}
                                        >
                                            <CurrentIcon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <p className="hidden text-[11px] font-medium text-stone-400 lg:block dark:text-slate-500">
                                                Step {step + 1} · ~{current.minutes} min
                                            </p>
                                            <h2 className="hidden text-[26px] font-semibold tracking-tight text-stone-900 lg:block dark:text-white">
                                                {current.title}
                                            </h2>
                                            <p className="mt-1 max-w-md text-[14px] leading-relaxed text-stone-500 dark:text-slate-400">
                                                {current.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Guidance strip */}
                                    <div className="mb-8 flex gap-3 rounded-2xl border border-stone-200/60 bg-white/50 px-4 py-3.5 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-900/5 dark:bg-white/5">
                                            <SparklesIcon className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-[13px] leading-relaxed text-stone-700 dark:text-slate-200">
                                                {current.tip}
                                            </p>
                                            <p className="text-[12px] leading-relaxed text-stone-400 dark:text-slate-500">
                                                <span className="font-medium text-stone-500 dark:text-slate-400">Why we ask: </span>
                                                {current.why}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step body */}
                                    <div className="space-y-6">
                                        {step === 0 && (
                                            <div className="space-y-6">
                                                <FieldShell
                                                    id="estate_name"
                                                    label="Estate name"
                                                    required
                                                    hint="The name residents and managers use day-to-day."
                                                    example="Palm Court Estate"
                                                    error={
                                                        errors.estate_name ||
                                                        (showEstateNameError ? 'Please enter the estate name to continue.' : undefined)
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
                                                        placeholder="Enter the estate name"
                                                        className={controlClass(
                                                            !!errors.estate_name || showEstateNameError,
                                                            !!data.estate_name.trim() && !errors.estate_name,
                                                        )}
                                                    />
                                                </FieldShell>

                                                <FieldShell
                                                    id="estate_address"
                                                    label="Street address"
                                                    hint="Optional — helps our team locate the estate during review."
                                                    example="12 Admiralty Way, Lekki"
                                                >
                                                    <textarea
                                                        id="estate_address"
                                                        rows={3}
                                                        value={data.estate_address}
                                                        onChange={(e) => setData('estate_address', e.target.value)}
                                                        placeholder="Street, area, landmarks…"
                                                        className={`${controlClass()} resize-none`}
                                                    />
                                                </FieldShell>
                                            </div>
                                        )}

                                        {step === 1 && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 sm:grid-cols-2">
                                                    <FieldShell id="state" label="State" hint="Nigeria’s 36 states and FCT.">
                                                        <select
                                                            id="state"
                                                            value={data.state}
                                                            onChange={(e) => setData('state', e.target.value)}
                                                            className={`${controlClass(false, !!data.state)} appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10`}
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
                                                    </FieldShell>

                                                    <FieldShell id="lga" label="LGA" hint="Local government area." example="Eti-Osa">
                                                        <input
                                                            id="lga"
                                                            type="text"
                                                            value={data.lga}
                                                            onChange={(e) => setData('lga', e.target.value)}
                                                            placeholder="Local government area"
                                                            className={controlClass(false, !!data.lga)}
                                                        />
                                                    </FieldShell>
                                                </div>

                                                <div className="rounded-3xl border border-stone-200/70 bg-linear-to-br from-white/80 to-stone-50/80 p-5 dark:border-slate-700/70 dark:from-slate-900/60 dark:to-slate-900/30 sm:p-6">
                                                    <div className="mb-4 flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                            <HomeModernIcon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                                                Estate scale
                                                            </p>
                                                            <p className="text-[12px] text-stone-400">
                                                                Approximate is fine — you can refine later with our team.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <FieldShell
                                                        id="number_of_houses"
                                                        label="Number of houses"
                                                        hint="Used only for your commission preview."
                                                        example="120"
                                                    >
                                                        <input
                                                            id="number_of_houses"
                                                            type="number"
                                                            min={1}
                                                            value={data.number_of_houses}
                                                            onChange={(e) => setData('number_of_houses', e.target.value)}
                                                            placeholder="0"
                                                            className={`${controlClass(false, houses > 0)} tabular-nums`}
                                                        />
                                                    </FieldShell>

                                                    <AnimatePresence>
                                                        {estimate != null && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                                                                    <div>
                                                                        <p className="text-[11px] font-semibold tracking-[0.1em] text-emerald-700/80 uppercase dark:text-emerald-400/80">
                                                                            Potential annual commission
                                                                        </p>
                                                                        <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-900 tabular-nums dark:text-emerald-100">
                                                                            ~{formatAmount(estimate)}
                                                                        </p>
                                                                        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-emerald-800/70 dark:text-emerald-300/70">
                                                                            Based on{' '}
                                                                            {formatCommission(
                                                                                partner?.commission_rate ?? null,
                                                                                partner?.commission_type ?? null,
                                                                            )}{' '}
                                                                            and ₦50k avg dues / house / month. Illustrative only.
                                                                        </p>
                                                                    </div>
                                                                    <SparklesIcon className="h-8 w-8 text-emerald-400/60" />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="space-y-6">
                                                <FieldShell
                                                    id="chairman_name"
                                                    label="Contact person name"
                                                    required
                                                    hint="The person best placed to coordinate with Kontrol."
                                                    example="Adaobi Okonkwo"
                                                    error={
                                                        errors.chairman_name ||
                                                        (showNameError ? 'Contact person name is required.' : undefined)
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
                                                        className={controlClass(
                                                            !!errors.chairman_name || showNameError,
                                                            !!data.chairman_name.trim() && !errors.chairman_name,
                                                        )}
                                                    />
                                                </FieldShell>

                                                <div className="grid gap-6 sm:grid-cols-2">
                                                    <FieldShell
                                                        id="chairman_phone"
                                                        label="Contact person phone"
                                                        required
                                                        hint="Mobile preferred for faster follow-up."
                                                        example="0803…"
                                                        error={
                                                            errors.chairman_phone ||
                                                            (showPhoneError ? 'Phone number is required.' : undefined)
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
                                                            placeholder="Phone number"
                                                            className={controlClass(
                                                                !!errors.chairman_phone || showPhoneError,
                                                                !!data.chairman_phone.trim() && !errors.chairman_phone,
                                                            )}
                                                        />
                                                    </FieldShell>

                                                    <FieldShell
                                                        id="chairman_email"
                                                        label="Contact person email"
                                                        required
                                                        hint="We'll introduce Kontrol via email after approval."
                                                        example="name@estate.com"
                                                        error={
                                                            errors.chairman_email ||
                                                            (showEmailError ? 'Email address is required.' : undefined)
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
                                                            placeholder="Email address"
                                                            className={controlClass(
                                                                !!errors.chairman_email || showEmailError,
                                                                !!data.chairman_email.trim() && !errors.chairman_email,
                                                            )}
                                                        />
                                                    </FieldShell>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="space-y-5">
                                                <div className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/50">
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
                                                            group: 'Location & scale',
                                                            step: 1,
                                                            rows: [
                                                                {
                                                                    label: 'Location',
                                                                    value: [data.lga, data.state].filter(Boolean).join(', ') || '—',
                                                                },
                                                                {
                                                                    label: 'Houses',
                                                                    value: data.number_of_houses || '—',
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            group: 'Contact person',
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
                                                            className={idx > 0 ? 'border-t border-stone-100 dark:border-slate-800' : ''}
                                                        >
                                                            <div className="flex items-center justify-between bg-stone-50/80 px-5 py-2.5 dark:bg-slate-800/40">
                                                                <p className="text-[11px] font-semibold tracking-[0.1em] text-stone-400 uppercase">
                                                                    {section.group}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setStep(section.step)}
                                                                    className="text-[12px] font-semibold text-primary-600 transition hover:text-primary-500"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </div>
                                                            <dl className="divide-y divide-stone-100/80 px-5 dark:divide-slate-800/80">
                                                                {section.rows.map((row) => (
                                                                    <div
                                                                        key={row.label}
                                                                        className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                                                                    >
                                                                        <dt className="text-[12px] text-stone-400">{row.label}</dt>
                                                                        <dd className="text-[14px] font-medium text-stone-900 sm:text-right dark:text-white">
                                                                            {row.value}
                                                                        </dd>
                                                                    </div>
                                                                ))}
                                                            </dl>
                                                        </div>
                                                    ))}
                                                </div>

                                                {estimate != null && (
                                                    <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
                                                        <p className="text-[12px] text-emerald-800 dark:text-emerald-200">
                                                            Illustrative annual commission for this scale:{' '}
                                                            <span className="font-semibold tabular-nums">
                                                                ~{formatAmount(estimate)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-400 dark:text-slate-500">
                                                    <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    After submit, our team reviews this request. You can track status in My Estates.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Footer actions */}
                            <div className="mt-10 flex items-center justify-between gap-3 border-t border-stone-200/60 pt-6 dark:border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={back}
                                    disabled={step === 0}
                                    className="group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-100/80 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                >
                                    <ArrowLeftIcon className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                                    Back
                                </button>

                                {step < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            next();
                                        }}
                                        className="group inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-[13px] font-semibold text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:shadow-white/10 dark:hover:bg-stone-100"
                                    >
                                        Continue
                                        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            submitEstate();
                                        }}
                                        className="group inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-[13px] font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-500 hover:shadow-xl disabled:opacity-60 active:scale-[0.98]"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                Submit estate
                                                <PaperAirplaneIcon className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
