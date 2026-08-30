import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
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
        accessCode.reminder?.reminder_offset_minutes ?? defaultOffset
    );
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const visitorName = accessCode.visitor_name || 'Your visitor';
    const arrivalTime = accessCode.arrival_time || 'soon';
    const arrivalDate = accessCode.arrival_date || '';

    const handleSetReminder = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post(
            resident.visitors.reminder.store.url(accessCode.id),
            { reminder_offset_minutes: selectedOffset },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                    const offsetObj = availableOptions.find((o) => o.minutes === selectedOffset);
                    const label = offsetObj ? offsetObj.label.toLowerCase() : `${selectedOffset}m before`;
                    if (onSuccess) {
                        onSuccess(`Reminder set. We'll remind you ${label} ${visitorName}'s visit.`);
                    }
                },
                onError: () => {
                    setSubmitting(false);
                },
            }
        );
    };

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
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-slate-900">
                                    {isPostCreation ? 'Pass Created Successfully' : 'Set Visit Reminder'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 line-clamp-1">
                                    {visitorName}'s pass is ready for {arrivalDate ? `${arrivalDate} at ` : ''}{arrivalTime}
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
                                Kontrol can send a push notification to your phone before {visitorName}'s pass becomes valid.
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-2 pt-1">
                            {availableOptions.map((option) => {
                                const isSelected = selectedOffset === option.minutes;
                                return (
                                    <button
                                        key={option.minutes}
                                        type="button"
                                        onClick={() => setSelectedOffset(option.minutes)}
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
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {isPostCreation ? 'No, thanks' : 'Cancel'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSetReminder}
                            disabled={submitting || availableOptions.length === 0}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Set Reminder</span>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
