import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
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

type Props = {
    plans: Plan[];
};

export default function CreateEstate({ plans }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        address: '',
        plan_id: plans.length > 0 ? plans[0].id : '',
        charge_type: 'residents',
        free_trial_enabled: true,
        free_trial_days: 30,
    });

    const [selectedPlanId, setSelectedPlanId] = useState<number | string>(plans.length > 0 ? plans[0].id : '');

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/estates');
    }

    const handlePlanSelect = (id: number) => {
        setSelectedPlanId(id);
        setData('plan_id', id);
    };

    return (
        <ZeusLayout backUrl="/zeus/dashboard">
            <Head title="Create Estate - Zeus" />

            <div className="mx-auto max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <div className="mb-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Infrastructure</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Deploy <span className="font-light text-slate-400">Estate</span>
                    </h1>
                </motion.div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="space-y-6 lg:col-span-7"
                    >
                        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">Entity Details</h3>
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Entity Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 transition-all outline-none placeholder:text-slate-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                                        placeholder="e.g. Silverwood Heights"
                                    />
                                    {errors.name && (
                                        <p className="mt-1.5 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Administrative Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 transition-all outline-none placeholder:text-slate-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                                        placeholder="admin@entity.com"
                                    />
                                    <p className="mt-2 text-[10px] leading-relaxed font-medium tracking-tight text-slate-400 uppercase">
                                        Initialization credentials will be dispatched to this endpoint.
                                    </p>
                                    {errors.email && (
                                        <p className="mt-1.5 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.email}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Physical Mapping
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 transition-all outline-none placeholder:text-slate-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                                        placeholder="Primary operations address..."
                                    />
                                    {errors.address && (
                                        <p className="mt-1.5 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">Subscription Selection</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className={`group relative flex flex-col items-start rounded-xl border-2 p-4 transition-all ${
                                            selectedPlanId === plan.id
                                                ? 'border-blue-500 bg-blue-50/30'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="mb-1 flex w-full items-center justify-between">
                                            <span
                                                className={`text-[10px] font-black tracking-widest uppercase ${selectedPlanId === plan.id ? 'text-blue-600' : 'text-slate-400'}`}
                                            >
                                                {plan.billing_interval}
                                            </span>
                                            {selectedPlanId === plan.id && (
                                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                                                    <CheckIcon className="h-2.5 w-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold ${selectedPlanId === plan.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {plan.name}
                                        </span>
                                        <span className="mt-1 text-[11px] font-medium text-slate-400">
                                            ₦{(plan.price / 100).toLocaleString()} / {plan.billing_interval}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {errors.plan_id && <p className="mt-2 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.plan_id}</p>}
                        </div>

                        {/* Billing Configuration */}
                        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">Billing Configuration</h3>
                            <div className="space-y-6">
                                {/* Billing Model */}
                                <div>
                                    <label htmlFor="charge_type" className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Billing Model
                                    </label>
                                    <select
                                        id="charge_type"
                                        value={data.charge_type}
                                        onChange={(e) => setData('charge_type', e.target.value as 'residents' | 'estate')}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 transition-all outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                                    >
                                        <option value="estate">Charge Estate (Fixed)</option>
                                        <option value="residents">Charge Residents (Per-resident)</option>
                                    </select>
                                    {errors.charge_type && (
                                        <p className="mt-1.5 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.charge_type}</p>
                                    )}
                                </div>

                                {/* Free Trial Toggle */}
                                <div>
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={data.free_trial_enabled}
                                            onChange={(e) => setData('free_trial_enabled', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-slate-900">Enable Free Trial Period</span>
                                    </label>
                                    <p className="mt-2 text-[10px] leading-relaxed font-medium tracking-tight text-slate-400 uppercase">
                                        Estate begins with a trial period before billing starts
                                    </p>
                                </div>

                                {/* Trial Days (conditional) */}
                                {data.free_trial_enabled && (
                                    <div>
                                        <label htmlFor="free_trial_days" className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Trial Duration (Days)
                                        </label>
                                        <input
                                            type="number"
                                            id="free_trial_days"
                                            min="1"
                                            max="365"
                                            value={data.free_trial_days}
                                            onChange={(e) => setData('free_trial_days', parseInt(e.target.value) || 30)}
                                            className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 transition-all outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                                        />
                                        <p className="mt-2 text-[10px] leading-relaxed font-medium tracking-tight text-slate-400 uppercase">
                                            Days from creation before first billing (1-365, default: 30)
                                        </p>
                                        {errors.free_trial_days && (
                                            <p className="mt-1.5 text-[11px] font-bold tracking-tight text-red-500 uppercase">{errors.free_trial_days}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Link
                                href="/zeus/dashboard"
                                className="rounded px-6 py-3 text-[12px] font-bold tracking-wider text-slate-400 uppercase transition-all hover:bg-slate-100 active:scale-95"
                            >
                                Abort
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-slate-900 px-10 py-3.5 text-[12px] font-bold tracking-wider text-white uppercase shadow-xl shadow-slate-950/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                            >
                                {processing ? 'Provisioning...' : 'Deploy Estate'}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.1 }}
                        className="lg:col-span-5"
                    >
                        <div className="sticky top-8">
                            <AnimatePresence mode="wait">
                                {selectedPlan ? (
                                    <motion.div
                                        key={selectedPlan.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white shadow-2xl"
                                    >
                                        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-center gap-2">
                                                <div className="h-1 w-4 rounded-full bg-blue-500" />
                                                <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Selected TIER</span>
                                            </div>

                                            <h2 className="mb-2 text-2xl font-bold">{selectedPlan.name}</h2>
                                            <p className="mb-6 text-[13px] leading-relaxed font-medium text-slate-400">
                                                {selectedPlan.description || 'Custom provisioned infrastructure for secure estate management.'}
                                            </p>

                                            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
                                                <div className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Cost Structure
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">₦{(selectedPlan.price / 100).toLocaleString()}</span>
                                                    <span className="text-xs font-medium text-slate-400">/ {selectedPlan.billing_interval}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Included Capabilities
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {selectedPlan.features.map((feature) => (
                                                        <div key={feature.id} className="group flex items-start gap-3">
                                                            <div
                                                                className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${feature.pivot.is_enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}
                                                            >
                                                                <CheckIcon className="h-2.5 w-2.5" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p
                                                                    className={`text-[12px] font-bold ${feature.pivot.is_enabled ? 'text-slate-200' : 'text-slate-500 line-through'}`}
                                                                >
                                                                    {feature.name}
                                                                    {feature.pivot.limit && (
                                                                        <span className="ml-1.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-blue-400 uppercase">
                                                                            Limit: {feature.pivot.limit}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                {feature.description && (
                                                                    <p className="text-[10px] leading-tight font-medium text-slate-500 transition-colors group-hover:text-slate-400">
                                                                        {feature.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-10 flex items-center gap-3 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-blue-400">
                                                <InformationCircleIcon className="h-5 w-5 shrink-0" />
                                                <p className="text-[10px] leading-relaxed font-bold tracking-wide uppercase">
                                                    Infrastructure will be automatically provisioned upon deployment. Initial month billed at base
                                                    rate.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-400">
                                        <InformationCircleIcon className="mb-3 h-8 w-8 opacity-20" />
                                        <p className="mb-1 text-xs font-bold tracking-widest uppercase">Analysis Pending</p>
                                        <p className="text-[11px] leading-relaxed font-medium">
                                            Select a subscription tier to view infrastructure capabilities and terms.
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </form>
            </div>
        </ZeusLayout>
    );
}
