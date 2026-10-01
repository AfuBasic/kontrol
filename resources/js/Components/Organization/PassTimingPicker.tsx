import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Minus, Plus } from 'lucide-react';
import TextInput from '@/Components/UI/TextInput';

export interface PassTiming {
    startMode: 'now' | 'later';
    startDate: string; // yyyy-mm-dd (local)
    startTime: string; // HH:mm (local)
    durationMinutes: number;
    isCustom: boolean;
}

interface Props {
    value: PassTiming;
    onChange: (next: PassTiming) => void;
    durationOptions: { minutes: number; label: string }[];
    constraints: { min: number; max: number };
    errors?: { starts_at?: string; duration_minutes?: string };
}

const pad = (n: number) => String(n).padStart(2, '0');

const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Default "later" slot: the next full hour. */
export function defaultPassTiming(durationMinutes: number): PassTiming {
    const next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);

    return {
        startMode: 'now',
        startDate: toLocalDate(next),
        startTime: `${pad(next.getHours())}:00`,
        durationMinutes,
        isCustom: false,
    };
}

/** The pass start as a Date, or null when the pass starts immediately. */
export function passStart(timing: PassTiming): Date | null {
    if (timing.startMode === 'now' || !timing.startDate || !timing.startTime) return null;
    return new Date(`${timing.startDate}T${timing.startTime}`);
}

export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const days = Math.floor(minutes / 1440);
    if (days >= 1 && minutes % 1440 === 0) return days === 1 ? '1 day' : `${days} days`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
    return `${h} hr ${m} min`;
};

const timeLabel = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const dayLabel = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'today';
    if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

/** "until 2:15 PM", or "until Thu 2 Oct, 2:15 PM" when it ends on a later day. */
const untilLabel = (start: Date, minutes: number) => {
    const end = new Date(start.getTime() + minutes * 60_000);
    return end.toDateString() === start.toDateString() ? timeLabel(end) : `${dayLabel(end)}, ${timeLabel(end)}`;
};

const stepFor = (minutes: number) => (minutes < 120 ? 15 : minutes < 1440 ? 60 : 1440);

export default function PassTimingPicker({ value, onChange, durationOptions, constraints, errors }: Props) {
    const set = (patch: Partial<PassTiming>) => onChange({ ...value, ...patch });

    const scheduledStart = passStart(value);
    const start = scheduledStart ?? new Date();
    const end = new Date(start.getTime() + value.durationMinutes * 60_000);

    const summary = scheduledStart
        ? `Valid ${dayLabel(start)}, ${timeLabel(start)} – ${end.toDateString() === start.toDateString() ? timeLabel(end) : `${dayLabel(end)}, ${timeLabel(end)}`}`
        : `Valid from now until ${untilLabel(start, value.durationMinutes)}`;

    const adjustCustom = (direction: 1 | -1) => {
        const step = stepFor(direction === 1 ? value.durationMinutes : value.durationMinutes - 1);
        const next = Math.min(constraints.max, Math.max(constraints.min, value.durationMinutes + direction * step));
        set({ durationMinutes: next });
    };

    return (
        <div className="space-y-5">
            {/* Starts */}
            <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Starts</label>
                <div className="relative flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(['now', 'later'] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => set({ startMode: mode })}
                            className={`relative z-10 min-h-[40px] flex-1 rounded-lg text-sm font-semibold transition-colors ${
                                value.startMode === mode ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {mode === 'now' ? 'Now' : 'Later'}
                        </button>
                    ))}
                    <motion.div
                        className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-xs ring-1 ring-slate-900/5"
                        animate={{ left: value.startMode === 'later' ? 'calc(50% + 0.125rem)' : '0.25rem' }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                </div>

                <AnimatePresence initial={false}>
                    {value.startMode === 'later' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <TextInput
                                    label="Date"
                                    icon={Calendar}
                                    type="date"
                                    min={toLocalDate(new Date())}
                                    value={value.startDate}
                                    onChange={(e) => set({ startDate: e.target.value })}
                                />
                                <TextInput
                                    label="Time"
                                    icon={Clock}
                                    type="time"
                                    value={value.startTime}
                                    onChange={(e) => set({ startTime: e.target.value })}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {errors?.starts_at && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.starts_at}</p>}
            </div>

            {/* Expires after */}
            <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Expires after</label>
                <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((option) => {
                        const selected = !value.isCustom && value.durationMinutes === option.minutes;
                        return (
                            <button
                                key={option.minutes}
                                type="button"
                                onClick={() => set({ durationMinutes: option.minutes, isCustom: false })}
                                className={`min-h-[56px] rounded-xl px-2 py-2 text-center transition active:scale-[0.97] ${
                                    selected
                                        ? 'bg-[#071f4b] text-white shadow-sm'
                                        : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span className="block text-[13px] font-semibold">{formatDuration(option.minutes)}</span>
                                <span className={`mt-0.5 block truncate text-[10.5px] ${selected ? 'text-blue-100/75' : 'text-slate-500'}`}>
                                    until {untilLabel(start, option.minutes)}
                                </span>
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => set({ isCustom: true })}
                        className={`flex min-h-[56px] items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition active:scale-[0.97] ${
                            value.isCustom ? 'bg-[#071f4b] text-white shadow-sm' : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        Custom
                    </button>
                </div>

                <AnimatePresence initial={false}>
                    {value.isCustom && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                                <button
                                    type="button"
                                    aria-label="Shorter"
                                    onClick={() => adjustCustom(-1)}
                                    disabled={value.durationMinutes <= constraints.min}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 active:scale-95 disabled:opacity-30"
                                >
                                    <Minus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <div className="text-center">
                                    <p className="text-[16px] font-semibold text-[#071f4b]">{formatDuration(value.durationMinutes)}</p>
                                    <p className="text-[11px] text-slate-500">until {untilLabel(start, value.durationMinutes)}</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Longer"
                                    onClick={() => adjustCustom(1)}
                                    disabled={value.durationMinutes >= constraints.max}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 active:scale-95 disabled:opacity-30"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {errors?.duration_minutes && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.duration_minutes}</p>}
            </div>

            <p className="rounded-xl bg-blue-50/70 px-3.5 py-2.5 text-[12.5px] text-[#0b3b8c]">{summary}</p>
        </div>
    );
}
