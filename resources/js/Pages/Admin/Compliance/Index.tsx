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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Head title="Compliance Command Center" />

            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance & Enforcement Command Center</h1>
                    <p className="text-sm text-slate-500">Platform-wide policy enforcement metrics and violation tracking.</p>
                </div>
                <Link
                    href="/admin/compliance/policies"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition"
                >
                    Configure Policy Rules
                </Link>
            </div>

            {/* Operational Status Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
                    <span className="text-xs font-semibold uppercase text-slate-500">Good Standing</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.good_standing_count}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
                    <span className="text-xs font-semibold uppercase text-slate-500">Under Restriction</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.under_restriction_count}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <span className="text-xs font-semibold uppercase text-slate-500">On Payment Plan</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.on_payment_plan_count}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-rose-500">
                    <span className="text-xs font-semibold uppercase text-slate-500">Escalated</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.escalated_count}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                    <span className="text-xs font-semibold uppercase text-slate-500">Total Penalties</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₦{metrics.total_penalties_amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Violations Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden border">
                <div className="px-6 py-4 border-b bg-slate-50">
                    <h2 className="text-md font-semibold text-slate-800">Active Violations</h2>
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resident</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Violation Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {violations.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No active compliance violations found. All residents in good standing.
                                </td>
                            </tr>
                        ) : (
                            violations.data.map(violation => (
                                <React.Fragment key={violation.id}>
                                    <tr className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{violation.user?.name || 'Resident'}</div>
                                            <div className="text-xs text-slate-500">{violation.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 capitalize">
                                            {violation.violation_type.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {violation.current_stage?.stage_name || 'Initial'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-800">
                                                {violation.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            ₦{Number(violation.outstanding_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                    {violation.violatable?.payments && violation.violatable.payments.length > 0 && (
                                        <tr className="bg-slate-50/70 border-b">
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="text-xs space-y-2">
                                                    <div className="flex justify-between items-center text-slate-500 font-semibold">
                                                        <span>Partial Payment History ({violation.violatable.payments.length} installments)</span>
                                                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                                            Paid ₦{Number(violation.violatable.amount_paid).toLocaleString()} of ₦{Number(violation.violatable.amount_due).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {violation.violatable.payments.map((p, idx) => (
                                                            <div key={p.id} className="flex justify-between items-center p-2 rounded bg-white border border-slate-200 text-[11px]">
                                                                <div>
                                                                    <span className="font-bold text-slate-700 block">Installment #{violation.violatable!.payments!.length - idx}</span>
                                                                    <span className="font-mono text-[9px] text-slate-400">{p.reference}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-emerald-600 block">+₦{Number(p.amount).toLocaleString()}</span>
                                                                    <span className="text-[9px] text-slate-400 block">{new Date(p.paid_at || p.created_at).toLocaleDateString()}</span>
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
