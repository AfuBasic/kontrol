import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Percent, Coins, Calendar, ShieldCheck, Phone, Mail, User } from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

export default function CreatePartner() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        commission_type: '' as 'percentage' | 'fixed' | '',
        commission_rate: '',
        commission_length: '' as string | number,
        status: 'pending',
    });

    const [touchedMode, setTouchedMode] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Adjust empty or always commission length to null before post
        const payload = { ...data };
        if (payload.commission_length === 'always' || payload.commission_length === '') {
            payload.commission_length = '';
        }
        post('/zeus/partners');
    }

    const modeOptions = [
        {
            id: 'percentage',
            title: 'Percentage Rate',
            description: 'Apply percentage of the total transaction fees.',
            icon: Percent,
            color: 'text-[#6C5DFD] border-[#6C5DFD]/20 bg-[#6C5DFD]/5',
        },
        {
            id: 'fixed',
            title: 'Fixed Fee',
            description: 'Apply a flat amount per subscription billing cycle.',
            icon: Coins,
            color: 'text-[#34D399] border-[#34D399]/20 bg-[#34D399]/5',
        },
    ];

    const lengthOptions = [
        { label: '6 Months', value: 6 },
        { label: '1 Year (12m)', value: 12 },
        { label: '2 Years (24m)', value: 24 },
        { label: 'Always Eligible', value: 'always' },
    ];

    return (
        <ZeusLayout>
            <Head title="Create Partner – Zeus" />

            <div className="relative mx-auto max-w-2xl px-4 py-8 text-[#F2F3F6] space-y-6">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[100px] duration-[8000ms]" />

                <Link
                    href="/zeus/partners"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9297A8] hover:text-[#F2F3F6] transition-colors uppercase tracking-wider"
                >
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl space-y-8"
                >
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                            <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">PARTNER ONBOARDING</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-[#F2F3F6]">
                            Create <span className="font-light text-[#9297A8]">Partner</span>
                        </h1>
                        <p className="text-xs text-[#9297A8] mt-1">Register a new partner program with targeted commission structures.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Profile Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8] border-b border-[rgba(255,255,255,0.06)] pb-2 mb-2">
                                Profile Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Partner Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                            placeholder="e.g. Atlas Referrals"
                                            required
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                                placeholder="partners@atlas.com"
                                                required
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                            <input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                                placeholder="+234..."
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Commission Schedule */}
                        <div className="space-y-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8] mb-4">
                                Commission Schedule
                            </h3>

                            {/* Step 1: Commission Mode Cards */}
                            <div className="space-y-3">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {modeOptions.map((opt) => {
                                        const Icon = opt.icon;
                                        const isSelected = data.commission_type === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    setData('commission_type', opt.id as any);
                                                    setTouchedMode(true);
                                                }}
                                                className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD]/5 shadow-lg'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] hover:border-gray-700'
                                                }`}
                                            >
                                                <div className={`rounded-xl p-2.5 ${opt.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-[#F2F3F6]">{opt.title}</span>
                                                    <span className="block text-xs text-[#9297A8] mt-1">{opt.description}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Rate/Amount Input - Only display after choosing mode */}
                            <AnimatePresence>
                                {data.commission_type && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-2 mt-4"
                                    >
                                        <label className="block text-xs font-semibold text-[#9297A8]">
                                            {data.commission_type === 'percentage' ? 'Commission Rate (%)' : 'Flat Amount (kobo)'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-sm font-bold text-[#9297A8]">
                                                {data.commission_type === 'percentage' ? '%' : '₦'}
                                            </span>
                                            <input
                                                type="number"
                                                value={data.commission_rate}
                                                onChange={(e) => setData('commission_rate', e.target.value)}
                                                min="0"
                                                max={data.commission_type === 'percentage' ? '100' : undefined}
                                                step="any"
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-9 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                                placeholder={data.commission_type === 'percentage' ? '10' : '50000'}
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-[#9297A8]">
                                            {data.commission_type === 'fixed'
                                                ? 'Enter flat amount in kobo (e.g. 50000 kobo = ₦500.00)'
                                                : 'Percentage rate applied to resident transaction fees.'}
                                        </p>
                                        {errors.commission_rate && <p className="text-xs text-rose-500 mt-1">{errors.commission_rate}</p>}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Step 3: Commission Length Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#9297A8]">
                                    Commission Length
                                </label>
                                <div className="grid gap-2 sm:grid-cols-4">
                                    {lengthOptions.map((opt) => {
                                        const isSelected = data.commission_length === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setData('commission_length', opt.value)}
                                                className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                                                    isSelected
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD] text-white'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] text-[#9297A8] hover:border-gray-700'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.commission_length && <p className="text-xs text-rose-500 mt-1">{errors.commission_length}</p>}
                            </div>
                        </div>



                        {/* Submit Actions */}
                        <div className="flex gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6">
                            <Link
                                href="/zeus/partners"
                                className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] py-4 text-center text-sm font-bold text-[#9297A8] hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-2xl bg-[#6C5DFD] py-4 text-sm font-bold text-white shadow-lg hover:bg-[#6C5DFD]/90 transition-all active:scale-[0.98] disabled:opacity-60"
                            >
                                {processing ? 'Creating...' : 'Create Partner'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </ZeusLayout>
    );
}