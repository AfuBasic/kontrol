import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { store } from '@/actions/App/Http/Controllers/Zeus/EstateController';
import ZeusLayout from '@/Layouts/ZeusLayout';

type Partner = {
    id: number;
    name: string;
    commission_rate: string;
};

type Props = {
    partners: Partner[];
};

export default function CreateEstate({ partners }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        admin_name: '',
        email: '',
        address: '',
        charge_type: 'residents',
        free_trial_enabled: true,
        free_trial_days: 30 as number | '',
        has_partner: false,
        partner_id: '',
        partner_source: '',
        partner_notes: '',
        commission_starts_at: '',
        commission_ends_at: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url());
    }

    return (
        <ZeusLayout backUrl="/zeus/dashboard">
            <Head title="Create Estate - Zeus" />

            <div className="mx-auto max-w-3xl pt-8 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mb-10"
                >
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Link href="/zeus/estates" className="transition-colors hover:text-slate-800 dark:hover:text-slate-200">
                            Estates
                        </Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-white">Create</span>
                    </div>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Create an estate</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Set up the estate, assign its primary administrator, and choose a subscription plan.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    {/* Estate Information */}
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.05 }}>
                        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Estate information</h3>
                        <div className="rounded-xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-[#0f1423]">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Estate name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                        placeholder="e.g. Silverwood Heights"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Estate address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                        placeholder="Enter the estate's primary address"
                                    />
                                    {errors.address && <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.address}</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Primary Administrator */}
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }}>
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Primary administrator</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                This person will receive the initial account credentials and manage the estate.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-[#0f1423]">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="admin_name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Administrator name
                                    </label>
                                    <input
                                        type="text"
                                        id="admin_name"
                                        value={data.admin_name}
                                        onChange={(e) => setData('admin_name', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                        placeholder="e.g. Ada Okafor"
                                    />
                                    {errors.admin_name && (
                                        <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.admin_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Administrator email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                        placeholder="admin@example.com"
                                    />
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Login credentials and setup instructions will be sent to this email address.
                                    </p>
                                    {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.email}</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Additional Settings */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.15 }}
                        className="rounded-xl border border-slate-200/50 bg-white/50 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-[#0f1423]"
                    >
                        <div className="px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Additional settings</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Optional configuration for this estate</p>
                        </div>
                        <div className="border-t border-slate-100 dark:border-white/5">
                            <div className="space-y-8 px-6 py-6">
                                {/* Billing Model */}
                                <div>
                                    <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Billing settings</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                htmlFor="charge_type"
                                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Billing Model
                                            </label>
                                            <select
                                                id="charge_type"
                                                value={data.charge_type}
                                                onChange={(e) => setData('charge_type', e.target.value as 'residents' | 'estate')}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                            >
                                                <option value="estate">Charge Estate (Fixed)</option>
                                                <option value="residents">Charge Residents (Per-resident)</option>
                                            </select>
                                            {errors.charge_type && (
                                                <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.charge_type}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={data.free_trial_enabled}
                                                    onChange={(e) => setData('free_trial_enabled', e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-slate-900 dark:checked:bg-blue-500"
                                                />
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-300">Enable trial period</span>
                                            </label>
                                        </div>

                                        {data.free_trial_enabled && (
                                            <div>
                                                <label
                                                    htmlFor="free_trial_days"
                                                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Trial Duration (Days)
                                                </label>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    id="free_trial_days"
                                                    min="1"
                                                    max="365"
                                                    value={data.free_trial_days}
                                                    onChange={(e) =>
                                                        setData('free_trial_days', e.target.value === '' ? '' : parseInt(e.target.value))
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                                />
                                                {errors.free_trial_days && (
                                                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                                                        {errors.free_trial_days}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Partner Config */}
                                <div className="border-t border-slate-100 pt-6 dark:border-white/5">
                                    <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Partner association</h4>

                                    <div className="mb-4">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={data.has_partner}
                                                onChange={(e) => setData('has_partner', e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-slate-900 dark:checked:bg-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-300">Associate with a partner</span>
                                        </label>
                                    </div>

                                    {data.has_partner && (
                                        <div className="space-y-4 pl-7">
                                            <div>
                                                <label
                                                    htmlFor="partner_id"
                                                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Select Partner
                                                </label>
                                                <select
                                                    id="partner_id"
                                                    value={data.partner_id}
                                                    onChange={(e) => setData('partner_id', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                                >
                                                    <option value="">Choose a partner...</option>
                                                    {partners.map((partner) => (
                                                        <option key={partner.id} value={partner.id}>
                                                            {partner.name} ({partner.commission_rate}%)
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.partner_id && (
                                                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.partner_id}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label
                                                        htmlFor="commission_starts_at"
                                                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                    >
                                                        Commission Starts
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="commission_starts_at"
                                                        value={data.commission_starts_at}
                                                        onChange={(e) => setData('commission_starts_at', e.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        htmlFor="commission_ends_at"
                                                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                    >
                                                        Commission Ends (Optional)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="commission_ends_at"
                                                        value={data.commission_ends_at}
                                                        onChange={(e) => setData('commission_ends_at', e.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="partner_notes"
                                                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Notes
                                                </label>
                                                <textarea
                                                    id="partner_notes"
                                                    value={data.partner_notes}
                                                    onChange={(e) => setData('partner_notes', e.target.value)}
                                                    rows={2}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                                                    placeholder="Internal notes about this partner..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary and Actions */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.25 }}
                        className="pt-8"
                    >
                        <div className="mb-6 rounded-xl border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/[0.04] dark:bg-[#0f1423]">
                            <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">Review</h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">Estate</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{data.name || '-'}</div>
                                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{data.address || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Administrator
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{data.email || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/zeus/estates"
                                className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {processing ? 'Creating estate...' : 'Create estate'}
                            </button>
                        </div>
                    </motion.div>
                </form>
            </div>
        </ZeusLayout>
    );
}
