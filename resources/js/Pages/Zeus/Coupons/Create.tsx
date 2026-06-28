import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Estate {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    estates: Estate[];
    residents: User[];
}

export default function CreateCoupon({ estates, residents }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        type: 'percentage',
        value: '',
        scope: 'global',
        estate_id: '',
        user_id: '',
        expires_at: '',
        usage_limit: '',
    });

    function generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'ZEU-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('code', code);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/coupons');
    }

    return (
        <ZeusLayout>
            <Head title="Create Coupon" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }} 
                className="max-w-2xl"
            >
                <a href="/zeus/coupons" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Coupons
                </a>

                <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                    <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white">Create Coupon</h1>
                    <p className="mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">Add a new subscription coupon to your platform</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Code Input */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={e => setData('code', e.target.value.toUpperCase())}
                                        placeholder="ZEU-SUMMER"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm uppercase font-mono tracking-wider text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateRandomCode}
                                        className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Auto
                                    </button>
                                </div>
                                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                            </div>

                            {/* Type Selector */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
                                <select
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value as 'percentage' | 'fixed')}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₦)</option>
                                </select>
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Discount Value */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Discount Value {data.type === 'percentage' ? '(%)' : '(₦)'}
                                </label>
                                <input
                                    type="number"
                                    value={data.value}
                                    onChange={e => setData('value', e.target.value)}
                                    placeholder={data.type === 'percentage' ? '15' : '500'}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
                            </div>

                            {/* Target Scope */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Target Scope</label>
                                <select
                                    value={data.scope}
                                    onChange={e => {
                                        setData(d => ({
                                            ...d,
                                            scope: e.target.value,
                                            estate_id: '',
                                            user_id: ''
                                        }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="global">Global (All Residents)</option>
                                    <option value="estate">Estate Level (Specific Estate)</option>
                                    <option value="resident">Resident Level (Specific Resident)</option>
                                </select>
                                {errors.scope && <p className="mt-1 text-sm text-red-600">{errors.scope}</p>}
                            </div>
                        </div>

                        {/* Estate Selector */}
                        {data.scope === 'estate' && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Target Estate</label>
                                <select
                                    value={data.estate_id}
                                    onChange={e => setData('estate_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">Select Target Estate...</option>
                                    {estates.map(estate => (
                                        <option key={estate.id} value={estate.id}>{estate.name}</option>
                                    ))}
                                </select>
                                {errors.estate_id && <p className="mt-1 text-sm text-red-600">{errors.estate_id}</p>}
                            </motion.div>
                        )}

                        {/* Resident Selector */}
                        {data.scope === 'resident' && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Target Resident</label>
                                <select
                                    value={data.user_id}
                                    onChange={e => setData('user_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">Select Target Resident...</option>
                                    {residents.map(resident => (
                                        <option key={resident.id} value={resident.id}>{resident.name} ({resident.email})</option>
                                    ))}
                                </select>
                                {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                            </motion.div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Expiration Date */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Expires At (Optional)</label>
                                <input
                                    type="date"
                                    value={data.expires_at}
                                    onChange={e => setData('expires_at', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                {errors.expires_at && <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>}
                            </div>

                            {/* Usage Limit */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Usage Limit (Optional)</label>
                                <input
                                    type="number"
                                    value={data.usage_limit}
                                    onChange={e => setData('usage_limit', e.target.value)}
                                    placeholder="100"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                {errors.usage_limit && <p className="mt-1 text-sm text-red-600">{errors.usage_limit}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800/50 pt-6">
                            <a
                                href="/zeus/coupons"
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-6 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                            >
                                {processing ? 'Creating...' : 'Create Coupon'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
