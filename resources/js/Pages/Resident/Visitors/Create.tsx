import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar as CalendarIcon,
    ChevronLeft,
    Clock,
    Phone,
    ShieldCheck,
    User,
    Users,
    X,
    Zap,
    CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { SharedData } from '@/types';

type Step = 'type' | 'schedule' | 'details' | 'review';

const purposes = [
    { id: 'Guest', icon: User },
    { id: 'Delivery', icon: Zap },
    { id: 'Service', icon: ShieldCheck },
    { id: 'Event', icon: Users },
];

interface FormState {
    type: 'single_use' | 'long_lived' | 'event';
    visitor_name: string;
    visitor_phone: string;
    purpose: string;
    has_vehicle: boolean;
    duration_minutes: number;
    starts_at: string;
    expires_at: string;
    schedule_type: 'one_time' | 'recurring';
    schedule_data: any;
    guest_limit: number | '';
}

const getLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const CreateAccessCode = () => {
    const { durationOptions, durationConstraints, estate_plan } = usePage<
        SharedData & {
            durationOptions: { minutes: number; label: string }[];
            durationConstraints: { min: number; max: number };
        }
    >().props;

    const features = estate_plan?.features || [];
    const hasFlexibleCodes = features.includes('flexible-code-types');
    const hasEventCodes = true;

    // Read query parameter from window.location if available
    const getInitialType = (): FormState['type'] => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const typeParam = params.get('type');
            if (typeParam === 'event' || typeParam === 'long_lived' || typeParam === 'single_use') {
                return typeParam;
            }
        }
        return 'single_use';
    };

    const getInitialStep = (): Step => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('type')) {
                return 'schedule';
            }
        }
        return 'type';
    };

    const [step, setStep] = useState<Step>(getInitialStep());

    const form = useForm<FormState>({
        type: getInitialType(),
        visitor_name: '',
        visitor_phone: '',
        purpose: 'Guest',
        has_vehicle: false,
        duration_minutes: durationOptions?.[0]?.minutes || durationConstraints?.min || 60,
        starts_at: '',
        expires_at: '',
        schedule_type: 'one_time',
        schedule_data: null,
        guest_limit: '',
    });

    const isSchedulingEnabled = true;

    const now = new Date();
    const minStartsAt = getLocalISOString(now);
    const minExpiresAt = form.data.starts_at || minStartsAt;

    const startsAtDate = form.data.starts_at ? new Date(form.data.starts_at) : null;
    const expiresAtDate = form.data.expires_at ? new Date(form.data.expires_at) : null;

    let scheduleError = '';
    if (startsAtDate && startsAtDate < new Date(now.getTime() - 5 * 60 * 1000)) {
        scheduleError = 'Start time cannot be in the past.';
    } else if (expiresAtDate && expiresAtDate < now) {
        scheduleError = 'Expiration time cannot be in the past.';
    } else if (startsAtDate && expiresAtDate && expiresAtDate <= startsAtDate) {
        scheduleError = 'Expiration time must be after the start time.';
    }

    const isScheduleStepInvalid = step === 'schedule' && !!scheduleError;
    const isDetailsStepInvalid = step === 'details' && ((form.data.type === 'long_lived' || form.data.type === 'event') && !form.data.visitor_name.trim());
    const isStepInvalid = isScheduleStepInvalid || isDetailsStepInvalid;

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/resident/visitors');
        }
    };

    const submit = () => {
        const payload = {
            ...form.data,
            guest_limit: form.data.guest_limit === '' ? null : Number(form.data.guest_limit),
            starts_at: form.data.starts_at || null,
            expires_at: form.data.expires_at || null,
        };

        // @ts-expect-error form helper typings issue
        form.transform(() => payload).post(AccessCodeController.store.url());
    };

    const nextStep = () => {
        if (step === 'type') {
            if (form.data.type === 'long_lived' && !isSchedulingEnabled) {
                setStep('details');
            } else {
                setStep('schedule');
            }
        } else if (step === 'schedule') {
            setStep('details');
        } else if (step === 'details') {
            setStep('review');
        }
    };

    const prevStep = () => {
        if (step === 'review') setStep('details');
        else if (step === 'details') setStep('schedule');
        else if (step === 'schedule') setStep('type');
    };

    const isSingleUse = form.data.type === 'single_use';
    const isLongLived = form.data.type === 'long_lived';
    const isEvent = form.data.type === 'event';

    const getProgressPercentage = () => {
        const steps = ['type', 'schedule', 'details', 'review'];
        const currentIndex = steps.indexOf(step);
        return ((currentIndex + 1) / steps.length) * 100;
    };

    return (
        <>
            <Head title="Create Access Pass" />

            <div className="mx-auto min-h-screen max-w-lg bg-[#f8fafc] flex flex-col">
                {/* Premium iOS-style Header */}
                <div className="sticky top-0 z-[60] bg-[#f8fafc]/80 backdrop-blur-xl px-6 pt-[calc(env(safe-area-inset-top,24px)+12px)] pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handleBack}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
                            {step === 'type' && 'Pass Type'}
                            {step === 'schedule' && 'Scheduling'}
                            {step === 'details' && 'Visitor Details'}
                            {step === 'review' && 'Review Pass'}
                        </h1>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-slate-900 rounded-full"
                            initial={{ width: '25%' }}
                            animate={{ width: `${getProgressPercentage()}%` }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                </div>

                {/* Steps Content */}
                <div className="relative z-10 flex-1 px-6 pb-40">
                    <AnimatePresence mode="wait">
                        {step === 'type' && (
                            <motion.div
                                key="step-type"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6 pt-4"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Select Access Type</h2>
                                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">
                                        Choose the right type of pass for your visitor to ensure seamless entry.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {/* One-Time Card */}
                                    <button
                                        onClick={() => form.setData('type', 'single_use')}
                                        className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                            isSingleUse
                                                ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                        }`}
                                    >
                                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                            isSingleUse ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                        }`}>
                                            <Zap className="h-6 w-6" strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-black tracking-tight">One-Time Visit</h3>
                                            <p className={`mt-0.5 text-[13px] font-medium leading-snug ${isSingleUse ? 'text-slate-300' : 'text-slate-500'}`}>
                                                Valid for a single entry. Ideal for standard guests or deliveries.
                                            </p>
                                        </div>
                                        {isSingleUse && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-5 right-5 text-white">
                                                <CheckCircle2 className="h-5 w-5" fill="currentColor" className="text-white bg-slate-900 rounded-full" />
                                            </motion.div>
                                        )}
                                    </button>

                                    {/* Long-Term Card */}
                                    {hasFlexibleCodes && (
                                        <button
                                            onClick={() => form.setData('type', 'long_lived')}
                                            className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                                isLongLived
                                                    ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                    : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                            }`}
                                        >
                                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                                isLongLived ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                            }`}>
                                                <Clock className="h-6 w-6" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="text-lg font-black tracking-tight">Long-Term Access</h3>
                                                <p className={`mt-0.5 text-[13px] font-medium leading-snug ${isLongLived ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    Multi-day access. Perfect for staff, contractors, or family.
                                                </p>
                                            </div>
                                            {isLongLived && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-5 right-5 text-white">
                                                    <CheckCircle2 className="h-5 w-5" fill="currentColor" className="text-white bg-slate-900 rounded-full" />
                                                </motion.div>
                                            )}
                                        </button>
                                    )}

                                    {/* Event Card */}
                                    {hasEventCodes && (
                                        <button
                                            onClick={() => form.setData('type', 'event')}
                                            className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                                isEvent
                                                    ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                    : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                            }`}
                                        >
                                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                                isEvent ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                            }`}>
                                                <Users className="h-6 w-6" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="text-lg font-black tracking-tight">Event Pass</h3>
                                                <p className={`mt-0.5 text-[13px] font-medium leading-snug ${isEvent ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    One code for multiple guests. Ideal for parties and gatherings.
                                                </p>
                                            </div>
                                            {isEvent && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-5 right-5 text-white">
                                                    <CheckCircle2 className="h-5 w-5" fill="currentColor" className="text-white bg-slate-900 rounded-full" />
                                                </motion.div>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 'schedule' && (
                            <motion.div
                                key="step-schedule"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-4"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Set the Timing</h2>
                                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">
                                        Configure when this pass should be active.
                                    </p>
                                </div>

                                <div className="space-y-6 rounded-[32px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
                                    {/* Future Scheduling */}
                                    <div className="space-y-3">
                                        <label className="text-[15px] font-black text-slate-900">Starts At <span className="text-slate-400 font-medium">(Optional)</span></label>
                                        <p className="text-[13px] font-medium text-slate-500 leading-snug">Leave blank for immediate access.</p>
                                        <div className="relative">
                                            <CalendarIcon className="absolute top-[18px] left-4 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                                            <input
                                                type="datetime-local"
                                                value={form.data.starts_at}
                                                min={minStartsAt}
                                                onChange={(e) => form.setData('starts_at', e.target.value)}
                                                className={`w-full rounded-2xl bg-slate-50 py-4 pl-12 font-bold text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all ${
                                                    form.data.starts_at ? 'pr-12' : 'pr-4'
                                                }`}
                                            />
                                            {form.data.starts_at && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        form.setData('starts_at', '');
                                                    }}
                                                    className="absolute right-4 top-[18px] z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700 active:scale-95"
                                                >
                                                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duration / Expires At based on Type */}
                                    {(isSingleUse || isEvent) && (
                                        <div className="space-y-4 pt-6 border-t border-slate-100">
                                            <label className="text-[15px] font-black text-slate-900">Pass Duration</label>
                                            <p className="text-[13px] font-medium text-slate-500 leading-snug">How long is the pass valid once generated or started?</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {durationOptions?.map((d) => (
                                                    <button
                                                        key={d.minutes}
                                                        onClick={() => form.setData('duration_minutes', d.minutes)}
                                                        className={`rounded-2xl py-3.5 px-4 text-center transition-all duration-200 ${
                                                            form.data.duration_minutes === d.minutes
                                                                ? 'bg-slate-900 text-white shadow-md'
                                                                : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <p className="text-sm font-black">{d.label}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isLongLived && (
                                        <div className="space-y-4 pt-6 border-t border-slate-100">
                                            <label className="text-[15px] font-black text-slate-900">Expires At <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <p className="text-[13px] font-medium text-slate-500 leading-snug">When should this long-term access permanently end?</p>
                                            <div className="relative">
                                                <CalendarIcon className="absolute top-[18px] left-4 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                                                <input
                                                    type="datetime-local"
                                                    value={form.data.expires_at}
                                                    min={minExpiresAt}
                                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                                    className={`w-full rounded-2xl bg-slate-50 py-4 pl-12 font-bold text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all ${
                                                        form.data.expires_at ? 'pr-12' : 'pr-4'
                                                    }`}
                                                />
                                                {form.data.expires_at && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            form.setData('expires_at', '');
                                                        }}
                                                        className="absolute right-4 top-[18px] z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700 active:scale-95"
                                                    >
                                                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {scheduleError && (
                                        <p className="text-sm font-bold text-rose-500 flex items-center gap-1.5 animate-pulse mt-2 pt-4 border-t border-slate-100">
                                            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                                            {scheduleError}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 'details' && (
                            <motion.div
                                key="step-details"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-4"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Visitor Details</h2>
                                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">
                                        Who is arriving at the gate?
                                    </p>
                                </div>

                                <div className="space-y-5 rounded-[32px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
                                    <div className="relative">
                                        <User className="absolute top-[18px] left-5 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder={isEvent ? "Event Name (e.g. Birthday Party)" : "Visitor's Full Name"}
                                            value={form.data.visitor_name}
                                            onChange={(e) => form.setData('visitor_name', e.target.value)}
                                            className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                                        />
                                        {form.errors.visitor_name && <p className="mt-1.5 text-[13px] font-bold text-rose-500">{form.errors.visitor_name}</p>}
                                    </div>

                                    {!isEvent && (
                                        <div className="relative">
                                            <Phone className="absolute top-[18px] left-5 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Phone Number (Optional)"
                                                value={form.data.visitor_phone}
                                                onChange={(e) => form.setData('visitor_phone', e.target.value)}
                                                className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                                            />
                                        </div>
                                    )}

                                    {isEvent && (
                                        <div className="relative">
                                            <Users className="absolute top-[18px] left-5 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Maximum Guests (Optional)"
                                                value={form.data.guest_limit}
                                                onChange={(e) => form.setData('guest_limit', e.target.value ? Number(e.target.value) : '')}
                                                className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                                            />
                                        </div>
                                    )}

                                    {!isEvent && (
                                        <div className="pt-3">
                                            <p className="mb-3 text-[11px] font-black tracking-widest text-slate-400 uppercase">Purpose of Visit</p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {purposes.filter(p => p.id !== 'Event').map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => form.setData('purpose', p.id)}
                                                        className={`flex items-center gap-2 rounded-[14px] px-5 py-3 text-[14px] font-bold transition-all duration-200 ${
                                                            form.data.purpose === p.id
                                                                ? 'bg-slate-900 text-white shadow-md'
                                                                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <p.icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                                                        {p.id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-3">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('has_vehicle', !form.data.has_vehicle)}
                                            className={`group flex w-full items-center justify-between rounded-[20px] p-5 transition-all duration-300 ${
                                                form.data.has_vehicle
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-[15px] font-black ${form.data.has_vehicle ? 'text-white' : 'text-slate-900'}`}>
                                                    Arriving with a vehicle?
                                                </p>
                                                <p className={`mt-0.5 text-[13px] font-medium ${form.data.has_vehicle ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    Security will log license plates
                                                </p>
                                            </div>
                                            <div
                                                className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-300 ${form.data.has_vehicle ? 'bg-white/20' : 'bg-slate-300 group-hover:bg-slate-400'}`}
                                            >
                                                <div
                                                    className={`absolute top-[4px] h-[20px] w-[20px] rounded-full bg-white transition-all duration-300 shadow-sm ${form.data.has_vehicle ? 'left-[24px]' : 'left-[4px]'}`}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'review' && (
                            <motion.div
                                key="step-review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-4"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Ready to Generate</h2>
                                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">
                                        Review the details below before creating the digital pass.
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
                                    <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                                        {/* Decorative background elements */}
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />

                                        <div className="relative z-10 flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                                {isSingleUse && <Zap className="h-6 w-6" />}
                                                {isEvent && <Users className="h-6 w-6" />}
                                                {isLongLived && <Clock className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black tracking-tight">
                                                    {isSingleUse ? 'One-Time Visit' : isEvent ? 'Event Pass' : 'Long-Term Access'}
                                                </h3>
                                                <p className="text-[13px] font-medium text-slate-300 mt-0.5">Kontrol Digital Pass</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-50 p-6 bg-white">
                                        <div className="py-3.5 flex justify-between items-center">
                                            <span className="text-[14px] font-bold text-slate-400">Name</span>
                                            <span className="text-[15px] font-black text-slate-900">{form.data.visitor_name || 'Not provided'}</span>
                                        </div>
                                        {!isEvent && (
                                            <div className="py-3.5 flex justify-between items-center">
                                                <span className="text-[14px] font-bold text-slate-400">Purpose</span>
                                                <span className="text-[15px] font-black text-slate-900">{form.data.purpose}</span>
                                            </div>
                                        )}
                                        {isEvent && form.data.guest_limit && (
                                            <div className="py-3.5 flex justify-between items-center">
                                                <span className="text-[14px] font-bold text-slate-400">Guest Limit</span>
                                                <span className="text-[15px] font-black text-slate-900">{form.data.guest_limit} people</span>
                                            </div>
                                        )}
                                        <div className="py-3.5 flex justify-between items-center">
                                            <span className="text-[14px] font-bold text-slate-400">Starts</span>
                                            <span className="text-[15px] font-black text-slate-900">
                                                {form.data.starts_at ? new Date(form.data.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Immediately'}
                                            </span>
                                        </div>
                                        <div className="py-3.5 flex justify-between items-center">
                                            <span className="text-[14px] font-bold text-slate-400">Vehicle</span>
                                            <span className="text-[15px] font-black text-slate-900">{form.data.has_vehicle ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Fixed Bottom Action Area */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent z-40 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                    <div className="mx-auto max-w-lg">
                        {step === 'type' ? (
                            <button
                                onClick={nextStep}
                                disabled={isStepInvalid}
                                className={`flex w-full items-center justify-center rounded-full py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all active:scale-[0.98] ${
                                    isStepInvalid
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                        : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                            >
                                Continue
                            </button>
                        ) : (
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={prevStep}
                                    disabled={step === 'review' && form.processing}
                                    className="flex-1 items-center justify-center rounded-full bg-slate-100 py-4.5 text-[17px] font-black text-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {step !== 'review' ? (
                                    <button
                                        onClick={nextStep}
                                        disabled={isStepInvalid}
                                        className={`flex-[2] items-center justify-center rounded-full py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all active:scale-[0.98] ${
                                            isStepInvalid
                                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                                : 'bg-slate-900 hover:bg-slate-800'
                                        }`}
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        onClick={submit}
                                        disabled={form.processing}
                                        className="flex-[2] items-center justify-center rounded-full bg-slate-900 py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </span>
                                        ) : (
                                            'Generate Pass'
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

CreateAccessCode.layout = (page: React.ReactNode) => (
    <ResidentLayout hideHeader={true} hideNav={true} className="bg-[#f8fafc]">
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);

export default CreateAccessCode;
