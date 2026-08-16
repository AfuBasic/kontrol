import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar as CalendarIcon, ChevronLeft, Clock, Phone, ShieldCheck, User, Users, X, Zap, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import * as AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncEngine } from '@/Resilience/SyncEngine';
import { SyncStatus } from '@/Resilience/SyncStatus';
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
    const {
        durationOptions,
        durationConstraints,
        estate_plan,
        isSubscriptionActive,
        accessCodesEnabled = true,
        requireVehicleInfo = false,
    } = usePage<
        SharedData & {
            durationOptions: { minutes: number; label: string }[];
            durationConstraints: { min: number; max: number };
            isSubscriptionActive: boolean;
            accessCodesEnabled?: boolean;
            requireVehicleInfo?: boolean;
        }
    >().props;
    const { isOnline, isServerReachable } = useNetworkQuality();
    const [queuingOffline, setQueuingOffline] = useState(false);

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

    // Custom 12-hour schedule states
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleHour, setScheduleHour] = useState('12');
    const [scheduleMinute, setScheduleMinute] = useState('00');
    const [scheduleAmpm, setScheduleAmpm] = useState('PM');

    // Custom purpose selection states for long_lived access
    const [isOthersSelected, setIsOthersSelected] = useState(false);
    const [customPurpose, setCustomPurpose] = useState('');

    const updateStartsAt = (dateStr: string, hr: string, min: string, ampm: string) => {
        if (!dateStr) {
            form.setData('starts_at', '');
            return;
        }
        let hVal = parseInt(hr, 10);
        if (ampm === 'PM' && hVal < 12) {
            hVal += 12;
        } else if (ampm === 'AM' && hVal === 12) {
            hVal = 0;
        }
        const hStr = String(hVal).padStart(2, '0');
        const mStr = min.padStart(2, '0');
        form.setData('starts_at', `${dateStr}T${hStr}:${mStr}`);
    };

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
    const isDetailsStepInvalid =
        step === 'details' &&
        (((form.data.type === 'long_lived' || form.data.type === 'event') && !form.data.visitor_name.trim()) ||
            (form.data.type === 'long_lived' && isOthersSelected && !customPurpose.trim()));
    const isStepInvalid = isScheduleStepInvalid || isDetailsStepInvalid;

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/resident/visitors');
        }
    };

    if (isSubscriptionActive === false) {
        return (
            <>
                <Head title="Access Restricted" />
                <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-[#f8fafc]">
                    <div className="sticky top-0 z-[60] bg-[#f8fafc]/80 px-6 pt-[calc(env(safe-area-inset-top,24px)+12px)] pb-4 backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                onClick={handleBack}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                            >
                                <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                            </button>
                            <h1 className="text-[17px] font-bold tracking-tight text-slate-900">Access Restricted</h1>
                            <div className="w-10" />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-inner">
                            <AlertCircle className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Access Limited</h2>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed font-medium text-slate-500">
                            To generate visitor access codes, you must have an active resident subscription.
                        </p>
                        <div className="mt-8 w-full space-y-3">
                            <Link
                                href="/resident/billing"
                                className="flex w-full items-center justify-center rounded-full bg-slate-900 py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:bg-slate-800 active:scale-[0.98]"
                            >
                                Settle Account
                            </Link>
                            <button
                                onClick={handleBack}
                                className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-4.5 text-[17px] font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const submit = async () => {
        const payload = {
            ...form.data,
            guest_limit: form.data.guest_limit === '' ? null : Number(form.data.guest_limit),
            starts_at: form.data.starts_at ? new Date(form.data.starts_at).toISOString() : null,
            expires_at: form.data.expires_at ? new Date(form.data.expires_at).toISOString() : null,
        };

        const online = isOnline && (await isServerReachable(2500));

        if (!online) {
            setQueuingOffline(true);
            try {
                const operationId = await SyncEngine.enqueue({
                    type: 'visitor_pass',
                    endpoint: AccessCodeController.store.url(),
                    method: 'POST',
                    payload: payload as Record<string, unknown>,
                    retryPolicyKey: 'visitor_pass',
                });

                await ResidentStore.putPendingPass({
                    id: operationId,
                    payload: payload as Record<string, unknown>,
                    status: SyncStatus.Pending,
                    createdAt: new Date().toISOString(),
                    visitor_name: form.data.visitor_name || undefined,
                    purpose: form.data.purpose || undefined,
                    type: form.data.type,
                    expires_at: payload.expires_at,
                });

                router.visit(AccessCodeController.index.url(), {
                    preserveScroll: false,
                });
            } catch (error) {
                console.error('Failed to queue offline visitor pass:', error);
                form.setError('visitor_name', 'Could not save offline. Please try again when online.');
            } finally {
                setQueuingOffline(false);
            }
            return;
        }

        form.transform(() => payload);
        form.post(AccessCodeController.store.url());
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

            <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-[#f8fafc]">
                {/* Premium iOS-style Header */}
                <div className="sticky top-0 z-[60] bg-[#f8fafc]/80 px-6 pt-[calc(env(safe-area-inset-top,24px)+12px)] pb-4 backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
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
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                            className="h-full rounded-full bg-slate-900"
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
                                    <p className="mt-2 text-[15px] leading-relaxed font-medium text-slate-500">
                                        Choose the right type of pass for your visitor to ensure seamless entry.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {/* One-Time Card */}
                                    <button
                                        onClick={() => {
                                            form.setData((prev) => ({
                                                ...prev,
                                                type: 'single_use',
                                                purpose: 'Guest',
                                            }));
                                        }}
                                        className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                            isSingleUse
                                                ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                                isSingleUse ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                            }`}
                                        >
                                            <Zap className="h-6 w-6" strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-black tracking-tight">One-Time Visit</h3>
                                            <p
                                                className={`mt-0.5 text-[13px] leading-snug font-medium ${isSingleUse ? 'text-slate-300' : 'text-slate-500'}`}
                                            >
                                                Valid for a single entry. Ideal for standard guests or deliveries.
                                            </p>
                                        </div>
                                        {isSingleUse && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-5 right-5 text-white">
                                                <CheckCircle2 className="h-5 w-5 rounded-full bg-slate-900 text-white" fill="currentColor" />
                                            </motion.div>
                                        )}
                                    </button>

                                    {/* Long-Term Card */}
                                    {hasFlexibleCodes && (
                                        <button
                                            onClick={() => {
                                                form.setData((prev) => ({
                                                    ...prev,
                                                    type: 'long_lived',
                                                    purpose: 'Nanny',
                                                }));
                                                setIsOthersSelected(false);
                                                setCustomPurpose('');
                                            }}
                                            className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                                isLongLived
                                                    ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                    : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                                    isLongLived ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                                }`}
                                            >
                                                <Clock className="h-6 w-6" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="text-lg font-black tracking-tight">Long-Term Access</h3>
                                                <p
                                                    className={`mt-0.5 text-[13px] leading-snug font-medium ${isLongLived ? 'text-slate-300' : 'text-slate-500'}`}
                                                >
                                                    Multi-day access. Perfect for staff, contractors, or family.
                                                </p>
                                            </div>
                                            {isLongLived && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-5 right-5 text-white"
                                                >
                                                    <CheckCircle2 className="h-5 w-5 rounded-full bg-slate-900 text-white" fill="currentColor" />
                                                </motion.div>
                                            )}
                                        </button>
                                    )}

                                    {/* Event Card */}
                                    {hasEventCodes && (
                                        <button
                                            onClick={() => {
                                                form.setData((prev) => ({
                                                    ...prev,
                                                    type: 'event',
                                                    purpose: 'Event',
                                                }));
                                            }}
                                            className={`group relative flex items-center gap-5 rounded-[28px] p-5 transition-all duration-300 active:scale-[0.98] ${
                                                isEvent
                                                    ? 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-slate-800'
                                                    : 'bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-colors ${
                                                    isEvent ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                                }`}
                                            >
                                                <Users className="h-6 w-6" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="text-lg font-black tracking-tight">Event Pass</h3>
                                                <p
                                                    className={`mt-0.5 text-[13px] leading-snug font-medium ${isEvent ? 'text-slate-300' : 'text-slate-500'}`}
                                                >
                                                    One code for multiple guests. Ideal for parties and gatherings.
                                                </p>
                                            </div>
                                            {isEvent && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-5 right-5 text-white"
                                                >
                                                    <CheckCircle2 className="h-5 w-5 rounded-full bg-slate-900 text-white" fill="currentColor" />
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
                                    <p className="mt-2 text-[15px] leading-relaxed font-medium text-slate-500">
                                        Configure when this pass should be active.
                                    </p>
                                </div>

                                <div className="space-y-6 rounded-[32px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
                                    {/* Future Scheduling */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[15px] font-black text-slate-900">
                                                Starts At <span className="font-medium text-slate-400">(Optional)</span>
                                            </label>
                                            <p className="text-[13px] leading-snug font-medium text-slate-500">Leave blank for immediate access.</p>
                                        </div>

                                        {/* Date Picker (Calendar) */}
                                        <div className="space-y-2">
                                            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Select Date</span>
                                            <div className="relative w-full">
                                                <CalendarIcon className="pointer-events-none absolute top-[18px] left-4 z-10 h-5 w-5 text-slate-400" />
                                                <input
                                                    type="date"
                                                    value={scheduleDate}
                                                    min={minStartsAt.split('T')[0]}
                                                    onChange={(e) => {
                                                        const d = e.target.value;
                                                        setScheduleDate(d);
                                                        updateStartsAt(d, scheduleHour, scheduleMinute, scheduleAmpm);
                                                    }}
                                                    className="relative w-full min-w-0 rounded-2xl bg-slate-50 py-4 pr-4 pl-12 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none focus:ring-2 focus:ring-slate-900"
                                                />
                                            </div>
                                        </div>

                                        {/* Time Picker Row (Shown if date is selected) */}
                                        {scheduleDate && (
                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                <span className="mb-1 block text-[11px] font-black tracking-wider text-slate-400 uppercase">
                                                    Select Time
                                                </span>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Hour Selection */}
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Hour</label>
                                                        <div className="relative w-full">
                                                            <select
                                                                value={scheduleHour}
                                                                onChange={(e) => {
                                                                    const h = e.target.value;
                                                                    setScheduleHour(h);
                                                                    updateStartsAt(scheduleDate, h, scheduleMinute, scheduleAmpm);
                                                                }}
                                                                className="w-full min-w-0 appearance-none rounded-2xl bg-slate-50 px-3 py-3.5 font-bold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-slate-900"
                                                            >
                                                                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                                                                    <option key={h} value={h}>
                                                                        {h}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Minute Selection */}
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                                            Minute
                                                        </label>
                                                        <div className="relative w-full">
                                                            <select
                                                                value={scheduleMinute}
                                                                onChange={(e) => {
                                                                    const m = e.target.value;
                                                                    setScheduleMinute(m);
                                                                    updateStartsAt(scheduleDate, scheduleHour, m, scheduleAmpm);
                                                                }}
                                                                className="w-full min-w-0 appearance-none rounded-2xl bg-slate-50 px-3 py-3.5 font-bold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-slate-900"
                                                            >
                                                                {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map((m) => (
                                                                    <option key={m} value={m}>
                                                                        {m}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* AM / PM Toggle segments */}
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                                            AM / PM
                                                        </label>
                                                        <div className="grid h-[50px] grid-cols-2 items-center gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
                                                            {(['AM', 'PM'] as const).map((mode) => (
                                                                <button
                                                                    key={mode}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setScheduleAmpm(mode);
                                                                        updateStartsAt(scheduleDate, scheduleHour, scheduleMinute, mode);
                                                                    }}
                                                                    className={`rounded-xl py-2 text-xs font-black transition-all ${
                                                                        scheduleAmpm === mode
                                                                            ? 'bg-slate-900 text-white shadow-sm'
                                                                            : 'text-slate-500 hover:text-slate-800'
                                                                    }`}
                                                                >
                                                                    {mode}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reset/Clear Button */}
                                        {form.data.starts_at && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setScheduleDate('');
                                                    setScheduleHour('12');
                                                    setScheduleMinute('00');
                                                    setScheduleAmpm('PM');
                                                    form.setData('starts_at', '');
                                                }}
                                                className="inline-flex items-center gap-1.5 pt-2 text-[11px] font-black tracking-wider text-rose-500 uppercase transition-colors hover:text-rose-600"
                                            >
                                                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                Clear Schedule
                                            </button>
                                        )}
                                    </div>

                                    {/* Duration / Expires At based on Type */}
                                    {(isSingleUse || isEvent) && (
                                        <div className="space-y-4 border-t border-slate-100 pt-6">
                                            <label className="text-[15px] font-black text-slate-900">Pass Duration</label>
                                            <p className="text-[13px] leading-snug font-medium text-slate-500">
                                                How long is the pass valid once generated or started?
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {durationOptions?.map((d) => (
                                                    <button
                                                        key={d.minutes}
                                                        onClick={() => form.setData('duration_minutes', d.minutes)}
                                                        className={`rounded-2xl px-4 py-3.5 text-center transition-all duration-200 ${
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
                                        <div className="space-y-4 border-t border-slate-100 pt-6">
                                            <label className="text-[15px] font-black text-slate-900">
                                                Expires At <span className="font-medium text-slate-400">(Optional)</span>
                                            </label>
                                            <p className="text-[13px] leading-snug font-medium text-slate-500">
                                                When should this long-term access permanently end?
                                            </p>
                                            <div className="relative">
                                                <CalendarIcon className="pointer-events-none absolute top-[18px] left-4 z-10 h-5 w-5 text-slate-400" />
                                                <input
                                                    type="datetime-local"
                                                    value={form.data.expires_at}
                                                    min={minExpiresAt}
                                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                                    className={`w-full rounded-2xl bg-slate-50 py-4 pl-12 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none focus:ring-2 focus:ring-slate-900 ${
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
                                                        className="absolute top-[18px] right-4 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700 active:scale-95"
                                                    >
                                                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {scheduleError && (
                                        <p className="mt-2 flex animate-pulse items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-bold text-rose-500">
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
                                    <p className="mt-2 text-[15px] leading-relaxed font-medium text-slate-500">Who is arriving at the gate?</p>
                                </div>

                                <div className="space-y-5 rounded-[32px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
                                    <div className="relative">
                                        <User className="pointer-events-none absolute top-[18px] left-5 z-10 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={isEvent ? 'Event Name (e.g. Birthday Party)' : "Visitor's Full Name"}
                                            value={form.data.visitor_name}
                                            onChange={(e) => form.setData('visitor_name', e.target.value)}
                                            className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
                                        />
                                        {form.errors.visitor_name && (
                                            <p className="mt-1.5 text-[13px] font-bold text-rose-500">{form.errors.visitor_name}</p>
                                        )}
                                    </div>

                                    {!isEvent && (
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute top-[18px] left-5 z-10 h-5 w-5 text-slate-400" />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Phone Number (Optional)"
                                                value={form.data.visitor_phone}
                                                onChange={(e) => form.setData('visitor_phone', e.target.value)}
                                                className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
                                            />
                                        </div>
                                    )}

                                    {isEvent && (
                                        <div className="relative">
                                            <Users className="pointer-events-none absolute top-[18px] left-5 z-10 h-5 w-5 text-slate-400" />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Maximum Guests (Optional)"
                                                value={form.data.guest_limit}
                                                onChange={(e) => form.setData('guest_limit', e.target.value ? Number(e.target.value) : '')}
                                                className="w-full rounded-2xl bg-slate-50 py-4.5 pr-6 pl-14 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
                                            />
                                        </div>
                                    )}

                                    {!isEvent && (
                                        <div className="pt-3">
                                            <p className="mb-3 text-[11px] font-black tracking-widest text-slate-400 uppercase">Purpose of Visit</p>

                                            {isLongLived ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {[
                                                            { id: 'Nanny', icon: User },
                                                            { id: 'Househelp', icon: ShieldCheck },
                                                            { id: 'Driver', icon: User },
                                                            { id: 'Others', icon: AlertCircle },
                                                        ].map((p) => {
                                                            const isSelected =
                                                                p.id === 'Others'
                                                                    ? isOthersSelected
                                                                    : !isOthersSelected && form.data.purpose === p.id;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        if (p.id === 'Others') {
                                                                            setIsOthersSelected(true);
                                                                            form.setData('purpose', customPurpose);
                                                                        } else {
                                                                            setIsOthersSelected(false);
                                                                            form.setData('purpose', p.id);
                                                                        }
                                                                    }}
                                                                    className={`flex items-center gap-2 rounded-[14px] px-5 py-3 text-[14px] font-bold transition-all duration-200 ${
                                                                        isSelected
                                                                            ? 'bg-slate-900 text-white shadow-md'
                                                                            : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    <p.icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                                                                    {p.id}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {isOthersSelected && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="relative"
                                                        >
                                                            <input
                                                                type="text"
                                                                placeholder="Specify Role (e.g. Chef, Gardener)"
                                                                value={customPurpose}
                                                                onChange={(e) => {
                                                                    setCustomPurpose(e.target.value);
                                                                    form.setData('purpose', e.target.value);
                                                                }}
                                                                className="w-full rounded-2xl bg-slate-50 px-6 py-4.5 font-bold text-slate-900 ring-1 ring-slate-200 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2.5">
                                                    {purposes
                                                        .filter((p) => p.id !== 'Event')
                                                        .map((p) => (
                                                            <button
                                                                type="button"
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
                                            )}
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
                                                <p
                                                    className={`mt-0.5 text-[13px] font-medium ${form.data.has_vehicle ? 'text-slate-300' : 'text-slate-500'}`}
                                                >
                                                    {requireVehicleInfo
                                                        ? 'Mandatory: Gate security will require vehicle plate details at check-in'
                                                        : 'Security will log license plates'}
                                                </p>
                                            </div>
                                            <div
                                                className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-300 ${form.data.has_vehicle ? 'bg-white/20' : 'bg-slate-300 group-hover:bg-slate-400'}`}
                                            >
                                                <div
                                                    className={`absolute top-[4px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all duration-300 ${form.data.has_vehicle ? 'left-[24px]' : 'left-[4px]'}`}
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
                                    <p className="mt-2 text-[15px] leading-relaxed font-medium text-slate-500">
                                        Review the details below before creating the digital pass.
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
                                    <div className="relative overflow-hidden bg-slate-900 p-6 text-white">
                                        {/* Decorative background elements */}
                                        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
                                        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />

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
                                                <p className="mt-0.5 text-[13px] font-medium text-slate-300">Kontrol Digital Pass</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-50 bg-white p-6">
                                        <div className="flex items-center justify-between py-3.5">
                                            <span className="text-[14px] font-bold text-slate-400">Name</span>
                                            <span className="text-[15px] font-black text-slate-900">{form.data.visitor_name || 'Not provided'}</span>
                                        </div>
                                        {!isEvent && (
                                            <div className="flex items-center justify-between py-3.5">
                                                <span className="text-[14px] font-bold text-slate-400">Purpose</span>
                                                <span className="text-[15px] font-black text-slate-900">{form.data.purpose}</span>
                                            </div>
                                        )}
                                        {isEvent && form.data.guest_limit && (
                                            <div className="flex items-center justify-between py-3.5">
                                                <span className="text-[14px] font-bold text-slate-400">Guest Limit</span>
                                                <span className="text-[15px] font-black text-slate-900">{form.data.guest_limit} people</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between py-3.5">
                                            <span className="text-[14px] font-bold text-slate-400">Starts</span>
                                            <span className="text-[15px] font-black text-slate-900">
                                                {form.data.starts_at
                                                    ? new Date(form.data.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                                    : 'Immediately'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3.5">
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
                <div className="fixed right-0 bottom-0 left-0 z-40 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                    <div className="mx-auto max-w-lg space-y-4">
                        {/* Validation Errors Alert */}
                        {Object.keys(form.errors).length > 0 && (
                            <div className="rounded-[2rem] border border-rose-200/60 bg-rose-50 p-5 shadow-sm">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-rose-800">Generation Failed</h4>
                                        <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs font-bold text-rose-600">
                                            {Object.entries(form.errors).map(([field, error]) => (
                                                <li key={field}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'type' ? (
                            <button
                                onClick={nextStep}
                                disabled={isStepInvalid}
                                className={`flex w-full items-center justify-center rounded-full py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all active:scale-[0.98] ${
                                    isStepInvalid ? 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none' : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                            >
                                Continue
                            </button>
                        ) : (
                            <div className="flex w-full gap-3">
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
                                                ? 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'
                                                : 'bg-slate-900 hover:bg-slate-800'
                                        }`}
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => void submit()}
                                        disabled={form.processing || queuingOffline}
                                        className="flex-[2] items-center justify-center rounded-full bg-slate-900 py-4.5 text-[17px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {form.processing || queuingOffline ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg
                                                    className="h-5 w-5 animate-spin text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                {queuingOffline ? 'Saving offline…' : 'Generating...'}
                                            </span>
                                        ) : !isOnline ? (
                                            'Save Offline'
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
