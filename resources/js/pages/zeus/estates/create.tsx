import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import ZeusLayout from '@/layouts/ZeusLayout';
import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

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
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Infrastructure
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Deploy <span className="text-slate-400 font-light">Estate</span>
                    </h1>
                </motion.div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Entity Details</h3>
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Entity Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="e.g. Silverwood Heights"
                                    />
                                    {errors.name && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Administrative Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="admin@entity.com"
                                    />
                                    <p className="mt-2 text-[10px] text-slate-400 leading-relaxed uppercase tracking-tight font-medium">Initialization credentials will be dispatched to this endpoint.</p>
                                    {errors.email && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.email}</p>}
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Physical Mapping
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="Primary operations address..."
                                    />
                                    {errors.address && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.address}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Subscription Selection</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all group ${
                                            selectedPlanId === plan.id
                                                ? 'border-blue-500 bg-blue-50/30'
                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlanId === plan.id ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {plan.billing_interval}
                                            </span>
                                            {selectedPlanId === plan.id && (
                                                <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <CheckIcon className="h-2.5 w-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold ${selectedPlanId === plan.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {plan.name}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400 mt-1">
                                            ₦{(plan.price / 100).toLocaleString()} / {plan.billing_interval}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {errors.plan_id && <p className="mt-2 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.plan_id}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Link
                                href="/zeus/dashboard"
                                className="rounded px-6 py-3 text-[12px] font-bold text-slate-400 transition-all hover:bg-slate-100 active:scale-95 uppercase tracking-wider"
                            >
                                Abort
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-slate-900 px-10 py-3.5 text-[12px] font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-40 active:scale-95 uppercase tracking-wider shadow-xl shadow-slate-950/20"
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
                                        className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-1 w-4 bg-blue-500 rounded-full" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Selected TIER</span>
                                            </div>
                                            
                                            <h2 className="text-2xl font-bold mb-2">{selectedPlan.name}</h2>
                                            <p className="text-slate-400 text-[13px] leading-relaxed mb-6 font-medium">
                                                {selectedPlan.description || 'Custom provisioned infrastructure for secure estate management.'}
                                            </p>

                                            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cost Structure</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">₦{(selectedPlan.price / 100).toLocaleString()}</span>
                                                    <span className="text-slate-400 text-xs font-medium">/ {selectedPlan.billing_interval}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Included Capabilities</div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {selectedPlan.features.map((feature) => (
                                                        <div key={feature.id} className="flex items-start gap-3 group">
                                                            <div className={`mt-1 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${feature.pivot.is_enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                                                                <CheckIcon className="h-2.5 w-2.5" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className={`text-[12px] font-bold ${feature.pivot.is_enabled ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                                                    {feature.name}
                                                                    {feature.pivot.limit && (
                                                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] uppercase tracking-wider font-black">
                                                                            Limit: {feature.pivot.limit}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                {feature.description && (
                                                                    <p className="text-[10px] text-slate-500 font-medium leading-tight group-hover:text-slate-400 transition-colors">
                                                                        {feature.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-10 flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                                                <InformationCircleIcon className="h-5 w-5 shrink-0" />
                                                <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wide">
                                                    Infrastructure will be automatically provisioned upon deployment. Initial month billed at base rate.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-64 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
                                        <InformationCircleIcon className="h-8 w-8 mb-3 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest mb-1">Analysis Pending</p>
                                        <p className="text-[11px] font-medium leading-relaxed">Select a subscription tier to view infrastructure capabilities and terms.</p>
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
