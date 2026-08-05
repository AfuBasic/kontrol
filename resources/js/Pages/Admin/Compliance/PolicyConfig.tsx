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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Head title="Estate Policy Configurator" />

            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance Policy Configurator</h1>
                    <p className="text-sm text-slate-500">Configure enforcement stages, grace periods, penalty rules, and restrictions for your estate.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {selectedPolicy.is_active ? 'Active Policy' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Stage Timeline Overview */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Enforcement Lifecycle Stages</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {selectedPolicy.stages.map((stage, idx) => (
                        <div key={stage.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stage {idx + 1}</span>
                                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Day {stage.trigger_days}</span>
                            </div>
                            <h3 className="font-bold text-slate-900">{stage.stage_name}</h3>
                            <div className="mt-3 space-y-1.5">
                                {stage.actions.map(act => (
                                    <div key={act.id} className="text-xs text-slate-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
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
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Payment Plan Behaviour & Safeguards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.pause_penalties ?? true}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-900 block">Pause Penalties</span>
                            <span className="text-xs text-slate-500 block">Halt interest and late fees while payment plan is active</span>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.suspend_restrictions ?? true}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-900 block">Suspend Restrictions</span>
                            <span className="text-xs text-slate-500 block">Temporarily restore restricted amenities during payment plan</span>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                            type="checkbox"
                            defaultChecked={selectedPolicy.payment_plan_policy?.suspend_escalation ?? true}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-900 block">Suspend Escalation</span>
                            <span className="text-xs text-slate-500 block">Prevent automatic escalation while installments are paid</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
