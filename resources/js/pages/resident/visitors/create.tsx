import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { DurationOption } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';

type Props = {
    durationOptions: DurationOption[];
};

export default function CreateCode({ durationOptions }: Props) {
    const [selectedDuration, setSelectedDuration] = useState<number>(durationOptions[1]?.minutes || 240);

    const { data, setData, post, processing, errors } = useForm({
        visitor_name: '',
        visitor_phone: '',
        purpose: '',
        duration_minutes: selectedDuration,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/resident/visitors');
    }

    function handleDurationChange(minutes: number) {
        setSelectedDuration(minutes);
        setData('duration_minutes', minutes);
    }

    return (
        <ResidentLayout hideNav>
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
                {/* Visitor Name */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-6">
                    <label htmlFor="visitor_name" className="mb-2 block text-sm font-medium text-gray-700">
                        Who&apos;s visiting? <span className="text-gray-400">(optional)</span>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mb-6">
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-8">
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

                {/* Duration Selection */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mb-8">
                    <label className="mb-3 block text-sm font-medium text-gray-700">How long should this code work?</label>
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                    {errors.duration_minutes && <p className="mt-2 text-sm text-red-600">{errors.duration_minutes}</p>}
                </motion.div>

                {/* Submit Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
