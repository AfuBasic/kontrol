import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import ZeusLayout from '@/layouts/ZeusLayout';
import { CurrencyDollarIcon, PencilIcon, TrashIcon, SparklesIcon, ArrowTrendingUpIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    formatted_price: string;
    billing_interval: 'monthly' | 'annual';
    is_featured: boolean;
    badge: string | null;
    color: string;
    visibility: 'public' | 'private';
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    is_active: boolean;
    features_count: number;
    subscriptions_count: number;
}

interface Props {
    plans: Plan[];
}

const colorGradients: Record<string, { from: string; to: string; accent: string; light: string }> = {
    blue: { from: 'from-blue-600', to: 'to-blue-400', accent: 'bg-blue-100 text-blue-700', light: 'bg-blue-50' },
    indigo: { from: 'from-indigo-600', to: 'to-indigo-400', accent: 'bg-indigo-100 text-indigo-700', light: 'bg-indigo-50' },
    purple: { from: 'from-purple-600', to: 'to-purple-400', accent: 'bg-purple-100 text-purple-700', light: 'bg-purple-50' },
    pink: { from: 'from-pink-600', to: 'to-pink-400', accent: 'bg-pink-100 text-pink-700', light: 'bg-pink-50' },
    green: { from: 'from-green-600', to: 'to-green-400', accent: 'bg-green-100 text-green-700', light: 'bg-green-50' },
};

export default function PlansIndex({ plans }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDeleteClick(plan: Plan) {
        setSelectedPlan(plan);
        setDeleteModalOpen(true);
    }

    function handleDeleteConfirm() {
        if (!selectedPlan) return;
        setIsDeleting(true);
        router.delete(`/zeus/plans/${selectedPlan.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setSelectedPlan(null);
            },
        });
    }

    function handleCopyPlan(plan: Plan) {
        // Navigate to create page with plan data as query params
        router.visit('/zeus/plans/create', {
            method: 'get',
            data: {
                copy: plan.id,
            },
        });
    }

    const getColorGradient = (color: string) => colorGradients[color] || colorGradients.blue;

    return (
        <ZeusLayout>
            <Head title="Plans Management" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-10 flex items-end justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Billing Engine
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Platform <span className="text-slate-400 font-light">Plans</span>
                    </h1>
                </div>
                <Link
                    href="/zeus/plans/create"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95"
                >
                    <span className="text-xl leading-none">+</span>
                    New Plan
                </Link>
            </motion.div>

            {/* Plans Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {plans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 bg-linear-to-br from-gray-50 to-gray-100 p-16 text-center"
                    >
                        <div className="mx-auto w-fit rounded-full bg-gray-200 p-4 mb-4">
                            <CurrencyDollarIcon className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No plans created yet</h3>
                        <p className="text-gray-600 mb-8 max-w-sm mx-auto">Start building your pricing strategy by creating your first plan</p>
                        <Link
                            href="/zeus/plans/create"
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                        >
                            <span className="text-lg">+</span> Create Your First Plan
                        </Link>
                    </motion.div>
                ) : (
                    plans.map((plan, index) => {
                        const colors = getColorGradient(plan.color);
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="group relative"
                            >
                                {/* Premium Card */}
                                <div className="relative h-full rounded-lg bg-white border border-slate-200 overflow-hidden transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                                    {/* Accent top border */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-slate-900`}></div>

                                    {/* Background gradient on hover */}
                                    <div className={`absolute inset-0 ${colors.light} opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>

                                    {/* Featured ribbon - Simplified */}
                                    {plan.is_featured && (
                                        <div className="absolute top-0 right-0 p-3">
                                            <div className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded shadow-lg shadow-blue-600/20">
                                                Featured
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative p-7 flex flex-col h-full">
                                        {/* Header */}
                                        <div className="mb-6">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="text-xl font-bold tracking-tight text-slate-900">{plan.name}</h3>
                                                {plan.badge && (
                                                    <span className="text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">{plan.description}</p>
                                            )}
                                        </div>

                                        {/* Pricing */}
                                        <div className="mb-6 pb-6 border-b border-slate-50">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black tracking-tight text-slate-900">
                                                    {plan.formatted_price}
                                                </span>
                                                <span className="text-[13px] font-medium text-slate-400">/{plan.billing_interval === 'monthly' ? 'mo' : 'yr'}</span>
                                            </div>
                                        </div>

                                        {/* Limits */}
                                        <div className="mb-6 flex-1">
                                            {(plan.max_residents || plan.max_security || plan.max_admins) ? (
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Residents', value: plan.max_residents },
                                                        { label: 'Security', value: plan.max_security },
                                                        { label: 'Admins', value: plan.max_admins },
                                                    ].filter(i => i.value).map(item => (
                                                        <div key={item.label} className="flex items-center justify-between p-2.5 rounded bg-slate-50">
                                                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</span>
                                                            <span className="text-[13px] font-bold text-slate-900">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 rounded border border-dashed border-slate-200">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No Limits</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats - Premium Mini Cards */}
                                        <div className="mb-8 grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg border border-gray-200 bg-linear-to-br from-gray-50 to-white text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <SparklesIcon className="h-4 w-4 text-gray-400" />
                                                    <p className="text-xs text-gray-600 font-medium">Features</p>
                                                </div>
                                                <p className={`text-2xl font-bold bg-linear-to-r ${colors.from} ${colors.to} bg-clip-text text-transparent`}>
                                                    {plan.features_count}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg border border-gray-200 bg-linear-to-br from-gray-50 to-white text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400" />
                                                    <p className="text-xs text-gray-600 font-medium">Active</p>
                                                </div>
                                                <p className={`text-2xl font-bold bg-linear-to-r ${colors.from} ${colors.to} bg-clip-text text-transparent`}>
                                                    {plan.subscriptions_count}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full mt-1 ${plan.is_active ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-slate-300'}`} />
                                                <span className="text-[11px] font-bold uppercase tracking-tight text-slate-500">
                                                    {plan.is_active ? 'Active Engine' : 'Offline'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {plan.visibility === 'public' ? 'Public' : 'Protected'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/zeus/plans/${plan.id}/edit`}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-slate-900 text-white font-bold text-[12px] transition-all hover:bg-slate-800 active:scale-95"
                                            >
                                                <PencilIcon className="h-3.5 w-3.5" />
                                                Manage
                                            </Link>
                                            <button
                                                onClick={() => handleCopyPlan(plan)}
                                                className="flex items-center justify-center px-4 py-2.5 rounded border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"
                                                title="Copy plan"
                                            >
                                                <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(plan)}
                                                className="flex items-center justify-center px-4 py-2.5 rounded border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                                            >
                                                <TrashIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedPlan(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Plan"
                message={`Are you sure you want to delete the "${selectedPlan?.name}" plan? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                type="danger"
                isLoading={isDeleting}
            />
        </ZeusLayout>
    );
}
