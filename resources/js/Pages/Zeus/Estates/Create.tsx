import { CheckIcon, ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

type Feature = {
    id: number;
    name: string;
    description: string | null;
    pivot: {
        is_enabled: boolean;
        limit: number | null;
    };
};

type Plan = {
    id: number;
    name: string;
    price: number;
    billing_interval: string;
    description: string | null;
    badge: string | null;
    color: string | null;
    features: Feature[];
};

type Partner = {
    id: number;
    name: string;
    commission_rate: string;
};

type Props = {
    plans: Plan[];
    partners: Partner[];
};

export default function CreateEstate({ plans, partners }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        address: '',
        plan_id: plans.length > 0 ? plans[0].id : '',
        charge_type: 'residents',
        free_trial_enabled: true,
        free_trial_days: 30,
        has_partner: false,
        partner_id: '',
        partner_source: '',
        partner_notes: '',
        commission_starts_at: '',
        commission_ends_at: '',
    });

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewPlanDetails, setViewPlanDetails] = useState<number | null>(null);

    const selectedPlan = plans.find((p) => p.id === data.plan_id);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/estates');
    }

    return (
        <ZeusLayout backUrl="/zeus/dashboard">
            <Head title="Create Estate - Zeus" />

            <div className="mx-auto max-w-3xl pb-24 pt-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mb-10"
                >
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Link href="/zeus/estates" className="hover:text-slate-800 transition-colors">Estates</Link>
                        <span>/</span>
                        <span className="text-slate-800">Create</span>
                    </div>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Create an estate
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Set up the estate, assign its primary administrator, and choose a subscription plan.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Estate Information */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                    >
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Estate information</h3>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                                        Estate name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                        placeholder="e.g. Silverwood Heights"
                                    />
                                    {errors.name && (
                                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
                                        Estate address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                        placeholder="Enter the estate's primary address"
                                    />
                                    {errors.address && (
                                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Primary Administrator */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900">Primary administrator</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                This person will receive the initial account credentials and manage the estate.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                                    Administrator email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                    placeholder="admin@example.com"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    Login credentials and setup instructions will be sent to this email address.
                                </p>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Subscription */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.15 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900">Subscription</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Choose the billing plan for this estate.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {plans.map((plan) => {
                                const isSelected = data.plan_id === plan.id;
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setData('plan_id', plan.id)}
                                        className={`group relative flex flex-col rounded-xl border p-5 text-left transition-all ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="mb-2 flex w-full items-center justify-between">
                                            <span
                                                className={`text-sm font-semibold capitalize ${
                                                    isSelected ? 'text-blue-900' : 'text-slate-900'
                                                }`}
                                            >
                                                {plan.billing_interval}
                                            </span>
                                            {isSelected && (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                                                    <CheckIcon className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                                ₦{(plan.price / 100).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                / {plan.billing_interval === 'monthly' ? 'month' : plan.billing_interval === 'quarterly' ? 'quarter' : plan.billing_interval === 'semi-annually' ? '6 months' : 'year'}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
                                            View plan details <ChevronRightIcon className="h-3 w-3" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.plan_id && <p className="mt-2 text-xs font-medium text-red-500">{errors.plan_id}</p>}
                    </motion.div>

                    {/* Additional Settings */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                        <button
                            type="button"
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
                        >
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Additional settings</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Optional configuration for this estate</p>
                            </div>
                            <div className="text-slate-400">
                                {settingsOpen ? (
                                    <ChevronDownIcon className="h-5 w-5" />
                                ) : (
                                    <ChevronRightIcon className="h-5 w-5" />
                                )}
                            </div>
                        </button>

                        <AnimatePresence>
                            {settingsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-100 overflow-hidden"
                                >
                                    <div className="px-6 py-6 space-y-8">
                                        {/* Billing Model */}
                                        <div>
                                            <h4 className="mb-4 text-sm font-semibold text-slate-900">Billing settings</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="charge_type" className="mb-2 block text-sm font-medium text-slate-700">
                                                        Billing Model
                                                    </label>
                                                    <select
                                                        id="charge_type"
                                                        value={data.charge_type}
                                                        onChange={(e) => setData('charge_type', e.target.value as 'residents' | 'estate')}
                                                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                    >
                                                        <option value="estate">Charge Estate (Fixed)</option>
                                                        <option value="residents">Charge Residents (Per-resident)</option>
                                                    </select>
                                                    {errors.charge_type && (
                                                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.charge_type}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.free_trial_enabled}
                                                            onChange={(e) => setData('free_trial_enabled', e.target.checked)}
                                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-medium text-slate-900">Enable trial period</span>
                                                    </label>
                                                </div>

                                                {data.free_trial_enabled && (
                                                    <div>
                                                        <label
                                                            htmlFor="free_trial_days"
                                                            className="mb-2 block text-sm font-medium text-slate-700"
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
                                                            onChange={(e) => setData('free_trial_days', parseInt(e.target.value) || 30)}
                                                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                        />
                                                        {errors.free_trial_days && (
                                                            <p className="mt-1.5 text-xs font-medium text-red-500">{errors.free_trial_days}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Partner Config */}
                                        <div className="pt-6 border-t border-slate-100">
                                            <h4 className="mb-4 text-sm font-semibold text-slate-900">Partner association</h4>
                                            
                                            <div className="mb-4">
                                                <label className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.has_partner}
                                                        onChange={(e) => setData('has_partner', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-900">Associate with a partner</span>
                                                </label>
                                            </div>

                                            {data.has_partner && (
                                                <div className="space-y-4 pl-7">
                                                    <div>
                                                        <label htmlFor="partner_id" className="mb-2 block text-sm font-medium text-slate-700">
                                                            Select Partner
                                                        </label>
                                                        <select
                                                            id="partner_id"
                                                            value={data.partner_id}
                                                            onChange={(e) => setData('partner_id', e.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                        >
                                                            <option value="">Choose a partner...</option>
                                                            {partners.map((partner) => (
                                                                <option key={partner.id} value={partner.id}>
                                                                    {partner.name} ({partner.commission_rate}%)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.partner_id && (
                                                            <p className="mt-1.5 text-xs font-medium text-red-500">{errors.partner_id}</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <label htmlFor="commission_starts_at" className="mb-2 block text-sm font-medium text-slate-700">
                                                                Commission Starts
                                                            </label>
                                                            <input
                                                                type="date"
                                                                id="commission_starts_at"
                                                                value={data.commission_starts_at}
                                                                onChange={(e) => setData('commission_starts_at', e.target.value)}
                                                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="commission_ends_at" className="mb-2 block text-sm font-medium text-slate-700">
                                                                Commission Ends (Optional)
                                                            </label>
                                                            <input
                                                                type="date"
                                                                id="commission_ends_at"
                                                                value={data.commission_ends_at}
                                                                onChange={(e) => setData('commission_ends_at', e.target.value)}
                                                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label htmlFor="partner_notes" className="mb-2 block text-sm font-medium text-slate-700">
                                                            Notes
                                                        </label>
                                                        <textarea
                                                            id="partner_notes"
                                                            value={data.partner_notes}
                                                            onChange={(e) => setData('partner_notes', e.target.value)}
                                                            rows={2}
                                                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                            placeholder="Internal notes about this partner..."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Summary and Actions */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.25 }}
                        className="pt-8"
                    >
                        <div className="mb-6 rounded-xl bg-slate-50 p-6 border border-slate-100">
                            <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Review</h3>
                            
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estate</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{data.name || '—'}</div>
                                    <div className="mt-0.5 text-xs text-slate-500">{data.address || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Administrator</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{data.email || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Subscription</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedPlan?.name || '—'}</div>
                                    <div className="mt-0.5 text-xs text-slate-500">
                                        {selectedPlan ? `₦${(selectedPlan.price / 100).toLocaleString()} / ${selectedPlan.billing_interval === 'monthly' ? 'month' : selectedPlan.billing_interval === 'quarterly' ? 'quarter' : selectedPlan.billing_interval === 'semi-annually' ? '6 months' : 'year'}` : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/zeus/estates"
                                className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !data.name || !data.email || !data.plan_id}
                                className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
