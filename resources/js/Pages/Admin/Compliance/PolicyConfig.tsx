import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';

interface PolicyAction {
    id: number;
    action_type: string;
    configuration?: Record<string, any>;
    is_enabled: boolean;
}

interface PolicyStage {
    id: number;
    stage_name: string;
    trigger_days: number;
    order: number;
    actions: PolicyAction[];
}

interface Policy {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    violation_type: string;
    payment_plan_policy?: {
        pause_penalties?: boolean;
        suspend_restrictions?: boolean;
        suspend_escalation?: boolean;
    };
    stages: PolicyStage[];
}

interface Props {
    policies: Policy[];
}

export default function PolicyConfig({ policies }: Props) {
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(policies[0] || null);

    if (!selectedPolicy) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-800">Compliance Policies</h1>
                <p className="mt-2 text-slate-600">No active policy rules configured for this estate.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head title="Estate Policy Configurator" />

            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance Policy Configurator</h1>
                    <p className="text-sm text-slate-500">
                        Configure enforcement stages, grace periods, penalty rules, and restrictions for your estate.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {selectedPolicy.is_active ? 'Active Policy' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Stage Timeline Overview */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Enforcement Lifecycle Stages</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {selectedPolicy.stages.map((stage, idx) => (
                        <div key={stage.id} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Stage {idx + 1}</span>
                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Day {stage.trigger_days}</span>
                            </div>
                            <h3 className="font-bold text-slate-900">{stage.stage_name}</h3>
                            <div className="mt-3 space-y-1.5">
                                {stage.actions.map((act) => (
                                    <div key={act.id} className="flex items-center gap-1 text-xs text-slate-600">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                        <span className="capitalize">{act.action_type.replace('_', ' ')}</span>
                                        {act.action_type === 'restriction' && (
                                            <span className="text-slate-400">({act.configuration?.feature_key || 'Service'})</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Policy Details Form / Rules */}
            <div className="space-y-6 rounded-lg bg-white p-6 shadow">
                <h2 className="border-b pb-2 text-lg font-semibold text-slate-900">Payment Plan Behaviour & Safeguards</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <label className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.pause_penalties ?? true}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="block text-sm font-medium text-slate-900">Pause Penalties</span>
                            <span className="block text-xs text-slate-500">Halt interest and late fees while payment plan is active</span>
                        </div>
                    </label>

                    <label className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.suspend_restrictions ?? true}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="block text-sm font-medium text-slate-900">Suspend Restrictions</span>
                            <span className="block text-xs text-slate-500">Temporarily restore restricted amenities during payment plan</span>
                        </div>
                    </label>

                    <label className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.suspend_escalation ?? true}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="block text-sm font-medium text-slate-900">Suspend Escalation</span>
                            <span className="block text-xs text-slate-500">Prevent automatic escalation while installments are paid</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
