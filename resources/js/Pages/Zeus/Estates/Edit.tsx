import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { Building2, Settings, Mail, MapPin, ArrowLeft, Save, CreditCard, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
    estate: {
        id: number;
        name: string;
        email: string;
        address: string | null;
        status: 'active' | 'inactive';
        admin_accepted: boolean;
        charge_type: 'residents' | 'estate';
        free_trial_enabled: boolean;
        free_trial_days: number;
        grace_period_days: number;
    };
}

export default function EditEstate({ estate }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: estate.name,
        email: estate.email,
        address: estate.address || '',
        status: estate.status,
        charge_type: estate.charge_type,
        free_trial_enabled: estate.free_trial_enabled,
        free_trial_days: estate.free_trial_days,
        grace_period_days: estate.grace_period_days,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/zeus/estates/${estate.id}`);
    }

    return (
        <ZeusLayout>
            <Head title={`Edit ${estate.name} - Zeus`} />

            <div className="mx-auto max-w-4xl pb-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <Link
                        href={`/zeus/estates/${estate.id}`}
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Estate
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Estate</h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Configure settings and billing properties for {estate.name}.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    {/* Basic Information Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800/50 dark:bg-slate-800/20">
                            <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Basic Information
                            </h2>
                        </div>
                        <div className="grid gap-6 p-8 md:grid-cols-2">
                            <div className="col-span-full">
                                <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Estate Name
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Building2 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        placeholder="Enter estate name"
                                    />
                                </div>
                                {errors.name && <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.name}</p>}
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`block w-full rounded-2xl border border-slate-200 py-3 pr-4 pl-11 text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:text-white ${
                                            estate.admin_accepted
                                                ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                                                : 'bg-white dark:bg-slate-900'
                                        }`}
                                        placeholder="admin@estate.com"
                                        disabled={estate.admin_accepted}
                                    />
                                </div>
                                {estate.admin_accepted && (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Email locked because admin has accepted the invitation.
                                    </p>
                                )}
                                {errors.email && <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.email}</p>}
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="address" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Address <span className="font-normal text-slate-400">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute top-3.5 left-0 flex items-start pl-4">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        placeholder="Enter estate address"
                                    />
                                </div>
                                {errors.address && <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.address}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Settings & Billing Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800/50 dark:bg-slate-800/20">
                            <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Settings & Billing
                            </h2>
                        </div>
                        <div className="grid gap-8 p-8 md:grid-cols-2">
                            {/* Status */}
                            <div>
                                <label htmlFor="status" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Estate Status
                                </label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as 'active' | 'inactive')}
                                    className={`block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:text-white ${
                                        !estate.admin_accepted ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'
                                    }`}
                                    disabled={!estate.admin_accepted}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {!estate.admin_accepted && (
                                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Estate cannot be activated until the admin accepts the invitation.
                                    </p>
                                )}
                                {errors.status && <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.status}</p>}
                            </div>

                            {/* Billing Model */}
                            <div>
                                <label htmlFor="charge_type" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Billing Model
                                </label>
                                <select
                                    id="charge_type"
                                    value={data.charge_type}
                                    onChange={(e) => setData('charge_type', e.target.value as 'residents' | 'estate')}
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="estate">Charge Estate (Bulk)</option>
                                    <option value="residents">Charge Residents (Individual)</option>
                                </select>
                                {errors.charge_type && (
                                    <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.charge_type}</p>
                                )}
                            </div>

                            {/* Free Trial Toggle */}
                            <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-800/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Free Trial</h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Allow this estate to start with a trial period before billing begins.
                                        </p>
                                    </div>
                                    <div
                                        onClick={() => setData('free_trial_enabled', !data.free_trial_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.free_trial_enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.free_trial_enabled ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </div>
                                </div>

                                {/* Free Trial Days & Grace Period - Animated Reveal */}
                                {data.free_trial_enabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-2 dark:border-slate-700"
                                    >
                                        <div>
                                            <label
                                                htmlFor="free_trial_days"
                                                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                                            >
                                                Trial Duration (Days)
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <Clock className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    id="free_trial_days"
                                                    min="1"
                                                    max="365"
                                                    value={data.free_trial_days}
                                                    onChange={(e) => setData('free_trial_days', parseInt(e.target.value) || 30)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                />
                                            </div>
                                            {errors.free_trial_days && (
                                                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{errors.free_trial_days}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="grace_period_days"
                                                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                                            >
                                                Grace Period (Days)
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <CreditCard className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    id="grace_period_days"
                                                    min="1"
                                                    max="30"
                                                    value={data.grace_period_days}
                                                    onChange={(e) => setData('grace_period_days', parseInt(e.target.value) || 2)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                />
                                            </div>
                                            {errors.grace_period_days && (
                                                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                                                    {errors.grace_period_days}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {!data.free_trial_enabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700"
                                    >
                                        <div className="md:w-1/2">
                                            <label
                                                htmlFor="grace_period_days_no_trial"
                                                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                                            >
                                                Grace Period (Days)
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <CreditCard className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    id="grace_period_days_no_trial"
                                                    min="1"
                                                    max="30"
                                                    value={data.grace_period_days}
                                                    onChange={(e) => setData('grace_period_days', parseInt(e.target.value) || 2)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Days allowed for payment before service suspension.
                                            </p>
                                            {errors.grace_period_days && (
                                                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                                                    {errors.grace_period_days}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={`/zeus/estates/${estate.id}`}
                            className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </ZeusLayout>
    );
}
