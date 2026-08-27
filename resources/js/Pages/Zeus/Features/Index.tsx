import {  MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

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
            },
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
                (feature) => feature.name.toLowerCase().includes(lowerSearchTerm) || feature.description?.toLowerCase().includes(lowerSearchTerm),
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
                <div className="mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Capability Matrix</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Feature <span className="font-light text-slate-400">Control</span>
                </h1>
            </motion.div>

            {/* Search Input */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="mb-6">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter system features..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white py-3 pr-4 pl-11 text-[13px] text-slate-900 transition-all placeholder:text-slate-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                    />
                </div>
            </motion.div>

            {/* Matrix Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
                style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-0">
                        {visibleGroups.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-[13px] font-bold tracking-widest text-slate-400 uppercase">No Matches Found</p>
                            </div>
                        ) : (
                            visibleGroups.map((group) => (
                                <div key={group}>
                                    {/* Group Header */}
                                    <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/80 px-6 py-3 backdrop-blur-md">
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{group}</h2>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-slate-100 bg-white">
                                                <tr>
                                                    <th className="sticky left-0 z-10 min-w-[320px] bg-white px-6 py-4 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                                                        Integration Point
                                                    </th>
                                                    {plans.map((plan) => (
                                                        <th
                                                            key={plan.id}
                                                            className="min-w-32 px-4 py-4 text-center text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase"
                                                        >
                                                            {plan.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredFeatures[group]?.map((feature, _idx) => (
                                                    <tr key={feature.id} className="bg-white transition-colors hover:bg-slate-50/50">
                                                        <td className="sticky left-0 z-10 bg-inherit px-6 py-5">
                                                            <div>
                                                                <p className="text-[13px] font-bold text-slate-900">{feature.name}</p>
                                                                {feature.description && (
                                                                    <p className="mt-0.5 text-[11px] font-medium tracking-tight text-slate-400 uppercase">
                                                                        {feature.description}
                                                                    </p>
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
                                                                        } ${isUpdating ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 active:scale-90'}`}
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
                <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Operational Notice</h3>
                </div>
                <p className="text-[13px] leading-relaxed font-medium text-slate-300">
                    Feature toggles modify the system capability matrix in real-time. Changes are immediately reflected in the billing engine and
                    subscription logic. Use caution when disabling mission-critical services for active tiers.
                </p>
            </motion.div>
        </ZeusLayout>
    );
}
