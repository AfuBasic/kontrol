import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';
import { SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Plan {
    id: number;
    name: string;
}

interface Feature {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    group: string;
    is_global: boolean;
    plans: Array<{
        plan_id: number;
        is_enabled: boolean;
    }>;
}

interface Props {
    features: Record<string, Feature[]>;
    plans: Plan[];
    groups: string[];
}

export default function FeaturesIndex({ features, plans, groups }: Props) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    function handleToggle(planId: number, featureId: number, currentState: boolean) {
        setUpdating(`${planId}-${featureId}`);

        const plan = plans.find((p) => p.id === planId);
        if (!plan) return;

        router.patch(
            `/zeus/plans/${planId}/features/${featureId}`,
            { enabled: !currentState },
            {
                onFinish: () => setUpdating(null),
            }
        );
    }

    function isFeatureEnabledForPlan(feature: Feature, planId: number): boolean {
        const planFeature = feature.plans.find((pf) => pf.plan_id === planId);
        return planFeature?.is_enabled || false;
    }

    // Filter features based on search term
    const filteredFeatures = useMemo(() => {
        if (!searchTerm.trim()) {
            return features;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered: Record<string, Feature[]> = {};

        Object.entries(features).forEach(([group, groupFeatures]) => {
            const matchedFeatures = groupFeatures.filter(
                (feature) =>
                    feature.name.toLowerCase().includes(lowerSearchTerm) ||
                    feature.description?.toLowerCase().includes(lowerSearchTerm)
            );

            if (matchedFeatures.length > 0) {
                filtered[group] = matchedFeatures;
            }
        });

        return filtered;
    }, [features, searchTerm]);

    const visibleGroups = Object.keys(filteredFeatures);

    return (
        <ZeusLayout>
            <Head title="Feature Control" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-10"
            >
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Capability Matrix
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Feature <span className="text-slate-400 font-light">Control</span>
                </h1>
            </motion.div>

            {/* Search Input */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="mb-6"
            >
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter system features..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white pl-11 pr-4 py-3 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                </div>
            </motion.div>

            {/* Matrix Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col"
                style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
                <div className="overflow-y-auto flex-1">
                    <div className="space-y-0">
                        {visibleGroups.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">No Matches Found</p>
                            </div>
                        ) : (
                            visibleGroups.map((group) => (
                                <div key={group}>
                                    {/* Group Header */}
                                    <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md px-6 py-3">
                                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{group}</h2>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-slate-100 bg-white">
                                                <tr>
                                                    <th className="sticky left-0 z-10 bg-white px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 min-w-[320px]">
                                                        Integration Point
                                                    </th>
                                                    {plans.map((plan) => (
                                                        <th
                                                            key={plan.id}
                                                            className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 min-w-32"
                                                        >
                                                            {plan.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredFeatures[group]?.map((feature, idx) => (
                                        <tr key={feature.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                                            <td className="sticky left-0 z-10 bg-inherit px-6 py-5">
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900">{feature.name}</p>
                                                    {feature.description && (
                                                        <p className="text-[11px] text-slate-400 uppercase tracking-tight font-medium mt-0.5">{feature.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            {plans.map((plan) => {
                                                const isEnabled = isFeatureEnabledForPlan(feature, plan.id);
                                                const isUpdating = updating === `${plan.id}-${feature.id}`;

                                                return (
                                                    <td key={plan.id} className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggle(plan.id, feature.id, isEnabled)}
                                                            disabled={isUpdating}
                                                            className={`relative inline-flex h-5 w-9 items-center rounded-sm transition-all ${
                                                                isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                                                            } ${isUpdating ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 active:scale-90'}`}
                                                        >
                                                            <motion.span
                                                                animate={{ x: isEnabled ? 18 : 2 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="inline-block h-4 w-4 transform rounded-sm bg-white shadow-sm"
                                                            />
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            </tr>
                                        ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>

            {/* System Notice */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-10 rounded border border-slate-900 bg-slate-900 p-6 text-white"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Operational Notice</h3>
                </div>
                <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                    Feature toggles modify the system capability matrix in real-time. Changes are immediately reflected in the billing engine and subscription logic. Use caution when disabling mission-critical services for active tiers.
                </p>
            </motion.div>
        </ZeusLayout>
    );
}
