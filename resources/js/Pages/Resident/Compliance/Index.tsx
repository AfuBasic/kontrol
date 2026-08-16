import React from 'react';
import { Head } from '@inertiajs/react';

interface Restriction {
    id: number;
    feature_key: string;
    status: string;
    restricted_at: string;
}

interface TimelineEvent {
    id: number;
    event_type: string;
    title: string;
    description?: string;
    created_at: string;
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
    original_amount: number;
    outstanding_amount: number;
    total_penalties_applied: number;
    current_stage?: {
        stage_name: string;
    };
    active_restrictions: Restriction[];
    timeline: TimelineEvent[];
    violatable?: {
        id: number;
        amount_due: number;
        amount_paid: number;
        payments?: Payment[];
    };
}

interface Props {
    violations: Violation[];
    activeRestrictions: Restriction[];
    totalOutstanding: number;
    isCompliant: boolean;
}

export default function ResidentComplianceIndex({ violations, activeRestrictions, totalOutstanding, isCompliant }: Props) {
    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <Head title="Account Compliance & Standing" />

            {/* Banner Status */}
            {isCompliant ? (
                <div className="flex items-center justify-between rounded-r-lg border-l-4 border-emerald-500 bg-emerald-50 p-4">
                    <div>
                        <h2 className="text-lg font-bold text-emerald-900">Account in Good Standing</h2>
                        <p className="mt-1 text-sm text-emerald-700">You have no active restrictions or overdue compliance obligations.</p>
                    </div>
                    <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 uppercase">Compliant</span>
                </div>
            ) : (
                <div className="space-y-3 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">Account Notice: Action Required</h2>
                            <p className="mt-1 text-sm text-amber-800">
                                Your account has active restrictions due to policy non-compliance. Visitor passes remain fully accessible.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 uppercase">Action Needed</span>
                    </div>

                    {activeRestrictions.length > 0 && (
                        <div className="mt-2 rounded border border-amber-200 bg-white/60 p-3">
                            <span className="mb-1 block text-xs font-semibold tracking-wider text-amber-900 uppercase">
                                Currently Restricted Services
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {activeRestrictions.map((r) => (
                                    <span key={r.id} className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                                        🚫 {r.feature_key.replace('.', ' ').toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Violation Details & Immutable Timeline */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Compliance History & Audit Log</h2>
                {violations.length === 0 ? (
                    <div className="rounded-lg border bg-white p-6 text-center text-slate-500 shadow-sm">
                        No policy violations recorded on your account.
                    </div>
                ) : (
                    violations.map((violation) => (
                        <div key={violation.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b bg-slate-50 p-4">
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Violation #{violation.id}</span>
                                    <h3 className="text-md font-bold text-slate-800 capitalize">{violation.violation_type.replace('_', ' ')}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-slate-500">Outstanding</span>
                                    <span className="text-md font-bold text-slate-900">₦{Number(violation.outstanding_amount).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Partial Payment Pattern Breakdown */}
                            {violation.violatable?.payments && violation.violatable.payments.length > 0 && (
                                <div className="space-y-3 border-b border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black tracking-wider text-slate-500 uppercase">
                                            Payment Pattern & Partial Receipts ({violation.violatable.payments.length})
                                        </h4>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                            Paid ₦{Number(violation.violatable.amount_paid).toLocaleString()} of ₦
                                            {Number(violation.violatable.amount_due).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {violation.violatable.payments.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[10px] font-black text-emerald-600">
                                                        #{violation.violatable!.payments!.length - idx}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-800">Partial Installment Received</span>
                                                        <span className="font-mono text-[10px] text-slate-400">{p.reference}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-sm font-black text-emerald-600">
                                                        +₦{Number(p.amount).toLocaleString()}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400">
                                                        {new Date(p.paid_at || p.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="space-y-3 p-4">
                                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Transparent Event Timeline</h4>
                                <div className="ml-2 space-y-3 border-l-2 border-slate-200 pl-4">
                                    {violation.timeline?.map((event) => (
                                        <div key={event.id} className="relative">
                                            <div className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-indigo-600"></div>
                                            <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                                            {event.description && <div className="mt-0.5 text-xs text-slate-600">{event.description}</div>}
                                            <div className="mt-1 text-[10px] text-slate-400">{new Date(event.created_at).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
