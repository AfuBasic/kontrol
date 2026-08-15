import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface MetricSummary {
    good_standing_count: number;
    under_restriction_count: number;
    total_penalties_amount: number;
    on_payment_plan_count: number;
    escalated_count: number;
}

interface Payment {
    id: number;
    reference: string;
    amount: number;
    status: string;
    paid_at?: string;
    created_at: string;
}

interface Violation {
    id: number;
    violation_type: string;
    status: string;
    outstanding_amount: number;
    total_penalties_applied: number;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    current_stage?: {
        stage_name: string;
    };
    created_at: string;
    violatable?: {
        id: number;
        amount_due: number;
        amount_paid: number;
        payments?: Payment[];
    };
}

interface Props {
    violations: {
        data: Violation[];
        links: any[];
    };
    metrics: MetricSummary;
}

export default function AdminComplianceIndex({ violations, metrics }: Props) {
    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head title="Compliance Command Center" />

            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance & Enforcement Command Center</h1>
                    <p className="text-sm text-slate-500">Platform-wide policy enforcement metrics and violation tracking.</p>
                </div>
                <Link
                    href="/admin/compliance/policies"
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase transition hover:bg-indigo-700"
                >
                    Configure Policy Rules
                </Link>
            </div>

            {/* Operational Status Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border-l-4 border-emerald-500 bg-white p-4 shadow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Good Standing</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.good_standing_count}</p>
                </div>

                <div className="rounded-lg border-l-4 border-amber-500 bg-white p-4 shadow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Under Restriction</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.under_restriction_count}</p>
                </div>

                <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">On Payment Plan</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.on_payment_plan_count}</p>
                </div>

                <div className="rounded-lg border-l-4 border-rose-500 bg-white p-4 shadow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Escalated</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.escalated_count}</p>
                </div>

                <div className="rounded-lg border-l-4 border-purple-500 bg-white p-4 shadow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Total Penalties</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900">₦{metrics.total_penalties_amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Violations Table */}
            <div className="overflow-hidden rounded-lg border bg-white shadow">
                <div className="border-b bg-slate-50 px-6 py-4">
                    <h2 className="text-md font-semibold text-slate-800">Active Violations</h2>
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Resident</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Violation Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Current Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Outstanding</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {violations.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No active compliance violations found. All residents in good standing.
                                </td>
                            </tr>
                        ) : (
                            violations.data.map((violation) => (
                                <React.Fragment key={violation.id}>
                                    <tr className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{violation.user?.name || 'Resident'}</div>
                                            <div className="text-xs text-slate-500">{violation.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700 capitalize">
                                            {violation.violation_type.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700">
                                            {violation.current_stage?.stage_name || 'Initial'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 capitalize">
                                                {violation.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-slate-900">
                                            ₦{Number(violation.outstanding_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                    {violation.violatable?.payments && violation.violatable.payments.length > 0 && (
                                        <tr className="border-b bg-slate-50/70">
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex items-center justify-between font-semibold text-slate-500">
                                                        <span>Partial Payment History ({violation.violatable.payments.length} installments)</span>
                                                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
                                                            Paid ₦{Number(violation.violatable.amount_paid).toLocaleString()} of ₦
                                                            {Number(violation.violatable.amount_due).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        {violation.violatable.payments.map((p, idx) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center justify-between rounded border border-slate-200 bg-white p-2 text-[11px]"
                                                            >
                                                                <div>
                                                                    <span className="block font-bold text-slate-700">
                                                                        Installment #{violation.violatable!.payments!.length - idx}
                                                                    </span>
                                                                    <span className="font-mono text-[9px] text-slate-400">{p.reference}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block font-bold text-emerald-600">
                                                                        +₦{Number(p.amount).toLocaleString()}
                                                                    </span>
                                                                    <span className="block text-[9px] text-slate-400">
                                                                        {new Date(p.paid_at || p.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
