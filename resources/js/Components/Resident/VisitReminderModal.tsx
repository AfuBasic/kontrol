import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, Check, X, Loader2, Minus, Plus, Pencil } from 'lucide-react';
import { useState, useMemo } from 'react';
import resident from '@/routes/resident';
import type { AccessCode, ReminderOption } from '@/types/access-code';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accessCode: AccessCode;
    availableOptions: ReminderOption[];
    isPostCreation?: boolean;
    onSuccess?: (message: string) => void;
}

/** Round to nearest step. For ≤ 120 min: 15-min steps. Above: 60-min steps. */
function snapOffset(minutes: number): number {
    if (minutes <= 120) {
        return Math.round(minutes / 15) * 15;
    }
    return Math.round(minutes / 60) * 60;
}

function stepSize(minutes: number): number {
    return minutes <= 120 ? 15 : 60;
}

function formatOffset(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
    return `${h} hr ${m} min`;
}

function wallClockTime(startsAt: string | null, offsetMinutes: number): string | null {
    if (!startsAt) return null;
    const start = new Date(startsAt);
    const remindAt = new Date(start.getTime() - offsetMinutes * 60 * 1000);
    return remindAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const CUSTOM_KEY = -1;

export default function VisitReminderModal({
    isOpen,
    onClose,
    accessCode,
    availableOptions,
    isPostCreation = false,
    onSuccess,
}: Props) {
    const defaultOffset = availableOptions[0]?.minutes ?? 120;
    const [selectedOffset, setSelectedOffset] = useState<number>(
        accessCode.reminder?.reminder_offset_minutes ?? defaultOffset,
    );
    const [isCustomSelected, setIsCustomSelected] = useState(false);
    const [customMinutes, setCustomMinutes] = useState(180);
    const [submitting, setSubmitting] = useState(false);

    /** Max allowed custom value: minutes until the pass starts minus 5 */
    const maxCustom = useMemo(() => {
        if (!accessCode.starts_at) return 10080;
        const diff = Math.floor(
            (new Date(accessCode.starts_at).getTime() - Date.now()) / 60000,
        );
        return Math.max(5, diff - 5);
    }, [accessCode.starts_at]);

    if (!isOpen) return null;

    const visitorName = accessCode.visitor_name || 'Your visitor';
    const arrivalDate = accessCode.arrival_date || '';
    const arrivalTime = accessCode.arrival_time;

    /** The minutes that will actually be submitted */
    const effectiveOffset = isCustomSelected ? customMinutes : selectedOffset;

    const adjustCustom = (delta: number) => {
        setCustomMinutes((prev) => {
            const next = prev + delta;
            const snapped = snapOffset(Math.max(5, Math.min(maxCustom, next)));
            return snapped;
        });
    };

    const handleSetReminder = () => {
        setSubmitting(true);

        router.post(
            resident.visitors.reminder.store.url(accessCode.id),
            { reminder_offset_minutes: effectiveOffset },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                    const preset = availableOptions.find((o) => o.minutes === effectiveOffset);
                    const label = preset
                        ? preset.label.toLowerCase()
                        : `${formatOffset(effectiveOffset)} before`;
                    if (onSuccess) {
                        onSuccess(`Reminder set. We'll remind you ${label} ${visitorName}'s visit.`);
                    }
                },
                onError: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    const customWallClock = wallClockTime(accessCode.starts_at, customMinutes);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                />

                {/* Modal / Sheet */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100"
                >
                    {/* Drag handle (mobile) */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

                    {/* Header */}
                    <div className="flex items-start justify-between pt-3 sm:pt-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-slate-900">
                                    {isPostCreation ? 'Pass Created Successfully' : 'Set Visit Reminder'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 line-clamp-1">
                                    {visitorName}'s pass · {arrivalDate}
                                    {arrivalTime ? ` at ${arrivalTime}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="mt-5 space-y-3">
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Want a reminder before the visit?
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-600">
                                Kontrol can send a push notification to your phone before {visitorName}'s pass becomes
                                valid.
                            </p>
                        </div>

                        {/* Preset Options */}
                        <div className="space-y-2 pt-1">
                            {availableOptions.map((option) => {
                                const isSelected = !isCustomSelected && selectedOffset === option.minutes;
                                return (
                                    <button
                                        key={option.minutes}
                                        type="button"
                                        onClick={() => {
                                            setIsCustomSelected(false);
                                            setSelectedOffset(option.minutes);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-bold">{option.label}</span>
                                        </div>
                                        <div
                                            className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Custom Option */}
                            <button
                                type="button"
                                onClick={() => setIsCustomSelected(true)}
                                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${
                                    isCustomSelected
                                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                            isCustomSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold">Custom time…</span>
                                </div>
                                <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                        isCustomSelected
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-300 bg-white'
                                    }`}
                                >
                                    {isCustomSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                            </button>

                            {/* Custom Stepper — expands inline */}
                            <AnimatePresence>
                                {isCustomSelected && (
                                    <motion.div
                                        key="custom-stepper"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-1 rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 space-y-3">
                                            {/* Stepper row */}
                                            <div className="flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => adjustCustom(-stepSize(customMinutes))}
                                                    disabled={customMinutes <= 5}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95 disabled:opacity-30"
                                                >
                                                    <Minus className="h-4 w-4 stroke-[2.5]" />
                                                </button>

                                                <div className="flex-1 text-center">
                                                    <p className="text-lg font-black text-indigo-900 leading-none">
                                                        {formatOffset(customMinutes)}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">
                                                        before the visit
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => adjustCustom(stepSize(customMinutes))}
                                                    disabled={customMinutes >= maxCustom}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95 disabled:opacity-30"
                                                >
                                                    <Plus className="h-4 w-4 stroke-[2.5]" />
                                                </button>
                                            </div>

                                            {/* Wall-clock preview */}
                                            {customWallClock && (
                                                <p className="text-center text-xs font-semibold text-indigo-700">
                                                    We'll notify you at{' '}
                                                    <span className="font-black">{customWallClock}</span>
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleSetReminder}
                            disabled={submitting || availableOptions.length === 0}
                            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="h-4 w-4" />
                                    <span>Set Reminder</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isPostCreation ? 'No, thanks' : 'Cancel'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
