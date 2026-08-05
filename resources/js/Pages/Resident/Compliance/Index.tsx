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
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Head title="Account Compliance & Standing" />

            {/* Banner Status */}
            {isCompliant ? (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-emerald-900">Account in Good Standing</h2>
                        <p className="text-sm text-emerald-700 mt-1">You have no active restrictions or overdue compliance obligations.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 font-semibold text-xs rounded-full uppercase">Compliant</span>
                </div>
            ) : (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">Account Notice: Action Required</h2>
                            <p className="text-sm text-amber-800 mt-1">
                                Your account has active restrictions due to policy non-compliance. Visitor passes remain fully accessible.
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-amber-200 text-amber-900 font-semibold text-xs rounded-full uppercase">Action Needed</span>
                    </div>

                    {activeRestrictions.length > 0 && (
                        <div className="mt-2 bg-white/60 p-3 rounded border border-amber-200">
                            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider block mb-1">Currently Restricted Services</span>
                            <div className="flex flex-wrap gap-2">
                                {activeRestrictions.map(r => (
                                    <span key={r.id} className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-medium">
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
                    <div className="bg-white p-6 text-center text-slate-500 rounded-lg border shadow-sm">
                        No policy violations recorded on your account.
                    </div>
                ) : (
                    violations.map(violation => (
                        <div key={violation.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Violation #{violation.id}</span>
                                    <h3 className="text-md font-bold text-slate-800 capitalize">{violation.violation_type.replace('_', ' ')}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 block">Outstanding</span>
                                    <span className="text-md font-bold text-slate-900">₦{Number(violation.outstanding_amount).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Partial Payment Pattern Breakdown */}
                            {violation.violatable?.payments && violation.violatable.payments.length > 0 && (
                                <div className="p-4 bg-slate-50/70 border-b border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Payment Pattern & Partial Receipts ({violation.violatable.payments.length})
                                        </h4>
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            Paid ₦{Number(violation.violatable.amount_paid).toLocaleString()} of ₦{Number(violation.violatable.amount_due).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {violation.violatable.payments.map((p, idx) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-[10px]">
                                                        #{violation.violatable!.payments!.length - idx}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 block">Partial Installment Received</span>
                                                        <span className="font-mono text-[10px] text-slate-400">{p.reference}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-emerald-600 block text-sm">
                                                        +₦{Number(p.amount).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        {new Date(p.paid_at || p.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="p-4 space-y-3">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transparent Event Timeline</h4>
                                <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-3">
                                    {violation.timeline?.map(event => (
                                        <div key={event.id} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                                            <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                                            {event.description && <div className="text-xs text-slate-600 mt-0.5">{event.description}</div>}
                                            <div className="text-[10px] text-slate-400 mt-1">{new Date(event.created_at).toLocaleString()}</div>
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
