import { Head, Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { DurationOption } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';

type Props = {
    durationOptions: { minutes: number; label: string }[];
    durationConstraints: { min: number; max: number };
};

export default function CreateCode({ durationOptions, durationConstraints }: Props) {
    const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(durationOptions[0]?.minutes || 60);
    const [customDuration, setCustomDuration] = useState<string>('');
    const [accessType, setAccessType] = useState<'single_use' | 'long_lived'>('single_use');

    const { data, setData, post, processing, errors } = useForm({
        visitor_name: '',
        visitor_phone: '',
        purpose: '',
        type: 'single_use',
        duration_minutes: durationOptions[0]?.minutes || 60,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/resident/visitors');
    }

    function handleDurationChange(minutes: number | 'custom') {
        setSelectedDuration(minutes);
        if (typeof minutes === 'number') {
            setData('duration_minutes', minutes);
        } else {
            // If switching to custom, don't update data yet until input
            // or maybe set it to customDuration if it exists, but custom logic handles the input change.
            // Just keeping selection state is enough here.
            if (customDuration) {
                setData('duration_minutes', parseInt(customDuration) || 0);
            }
        }
    }

    return (
        <ResidentLayout>
            <Head title="Create Access Code" />

            {/* Header with Back Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <Link href="/resident/visitors" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">Create Access Code</h1>
                <p className="mt-1 text-gray-500">Generate a one-time code for your visitor</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
                {/* Global Errors */}
                {(errors as any).daily_limit && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 overflow-hidden rounded-xl bg-red-50 p-4"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-red-800">{(errors as any).daily_limit}</p>
                        </div>
                    </motion.div>
                )}

                {/* Access Type Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="mb-6"
                >
                    <label className="mb-3 block text-sm font-medium text-gray-700">Access Type</label>
                    <div className="flex w-full rounded-2xl bg-gray-100 p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                        {(['single_use', 'long_lived'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => {
                                    setAccessType(type);
                                    setData('type', type);
                                }}
                                className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                                    accessType === type ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {accessType === type && (
                                    <motion.div
                                        layoutId="accessTypeTab"
                                        className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {type === 'single_use' ? 'Single Visit' : 'Long-lived'}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Visitor Name */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-6"
                >
                    <label htmlFor="visitor_name" className="mb-2 block text-sm font-medium text-gray-700">
                        Who&apos;s visiting?{' '}
                        <span className={accessType === 'long_lived' ? 'text-red-500' : 'text-gray-400'}>
                            {accessType === 'long_lived' ? '(required)' : '(optional)'}
                        </span>
                    </label>
                    <input
                        type="text"
                        id="visitor_name"
                        value={data.visitor_name}
                        onChange={(e) => setData('visitor_name', e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="e.g., John the plumber"
                    />
                    {errors.visitor_name && <p className="mt-2 text-sm text-red-600">{errors.visitor_name}</p>}
                </motion.div>

                {/* Phone Number */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="mb-6"
                >
                    <label htmlFor="visitor_phone" className="mb-2 block text-sm font-medium text-gray-700">
                        Visitor&apos;s phone <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        id="visitor_phone"
                        value={data.visitor_phone}
                        onChange={(e) => setData('visitor_phone', e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="e.g., 08012345678"
                    />
                    {errors.visitor_phone && <p className="mt-2 text-sm text-red-600">{errors.visitor_phone}</p>}
                </motion.div>

                {/* Purpose */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mb-8"
                >
                    <label htmlFor="purpose" className="mb-2 block text-sm font-medium text-gray-700">
                        Purpose of visit <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        id="purpose"
                        value={data.purpose}
                        onChange={(e) => setData('purpose', e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="e.g., Plumbing repair"
                    />
                    {errors.purpose && <p className="mt-2 text-sm text-red-600">{errors.purpose}</p>}
                </motion.div>

                {/* Duration Selection (Only for Single Use) */}
                <AnimatePresence>
                    {accessType === 'single_use' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <label className="mb-3 block text-sm font-medium text-gray-700">How long should this code work?</label>
                            <div className="mb-4 grid grid-cols-2 gap-3">
                                {durationOptions.map((option) => (
                                    <button
                                        key={option.minutes}
                                        type="button"
                                        onClick={() => handleDurationChange(option.minutes)}
                                        className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                                            selectedDuration === option.minutes
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => handleDurationChange('custom')}
                                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                                        selectedDuration === 'custom'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {selectedDuration === 'custom' && (
                                <motion.div initial={{ opacity: 0, marginTop: -10 }} animate={{ opacity: 1, marginTop: 0 }} className="mb-4">
                                    <label className="mb-1 block text-xs text-gray-500">
                                        Enter duration in minutes ({durationConstraints.min} - {durationConstraints.max})
                                    </label>
                                    <input
                                        type="number"
                                        value={customDuration}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomDuration(val);
                                            const minutes = parseInt(val);
                                            if (!isNaN(minutes)) {
                                                setData('duration_minutes', minutes);
                                            }
                                        }}
                                        min={durationConstraints.min}
                                        max={durationConstraints.max}
                                        className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        placeholder="Minutes"
                                    />
                                </motion.div>
                            )}

                            {errors.duration_minutes && <p className="mb-6 text-sm text-red-600">{errors.duration_minutes}</p>}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Create Code
                            </>
                        )}
                    </button>
                </motion.div>
            </form>
        </ResidentLayout>
    );
}
