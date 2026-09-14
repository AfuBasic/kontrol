import { Head } from '@inertiajs/react';
import React from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface OutstandingItem {
    id: number;
    name: string;
    description: string | null;
    amount_due: number;
    amount_paid: number;
    status: string;
    due_date: string | null;
    due_date_human: string | null;
    is_overdue: boolean;
}

interface PaidItem {
    id: number;
    name: string;
    amount_paid: number;
    paid_at: string;
    status: string;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    total_outstanding: number;
    outstanding: OutstandingItem[];
    paid_history: PaidItem[];
}

export default function Payments({
    organization,
    membership,
    total_outstanding = 0,
    outstanding = [],
    paid_history = [],
}: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const isAllCaughtUp = total_outstanding <= 0 && outstanding.length === 0;

    return (
        <OrganizationLayout title="Payments">
            <Head title={`${organization.name} - Payments`} />

            <div className="space-y-8 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Payments
                    </h1>
                </div>

                {/* Outstanding Dues Status */}
                {isAllCaughtUp ? (
                    <div className="space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-800">
                            You’re all caught up.
                        </p>
                        <p className="text-sm text-slate-500">
                            {organization.name} doesn’t have any outstanding estate payments.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* High visual emphasis earned card */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(total_outstanding)} due
                                </span>
                                {outstanding[0]?.due_date_human && (
                                    <p className="text-sm font-semibold text-slate-400">
                                        by {outstanding[0].due_date_human}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-0.5">
                                <p className="font-bold text-base text-slate-800">
                                    {outstanding[0]?.name || 'Facility Levy'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {organization.estate_name}
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => alert('Online payment checkout can be completed with the estate management office.')}
                                    className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors"
                                >
                                    Pay {formatCurrency(total_outstanding)}
                                </button>
                            </div>
                        </div>

                        {/* If multiple bills */}
                        {outstanding.length > 1 && (
                            <div className="pt-2 divide-y divide-slate-100">
                                {outstanding.slice(1).map((item) => (
                                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-400">Due {item.due_date_human || 'soon'}</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-900">
                                            {formatCurrency(item.amount_due - item.amount_paid)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="h-px bg-slate-200/60" />

                {/* Payment History */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Payment History
                    </h2>

                    {paid_history.length === 0 ? (
                        <div className="py-2 space-y-1">
                            <p className="text-sm font-bold text-slate-800">No payments yet.</p>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Receipts will appear here after the first payment.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {paid_history.map((item) => (
                                <div
                                    key={item.id}
                                    className="py-3 flex items-center justify-between gap-4 text-sm"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-400">Paid {item.paid_at}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(item.amount_paid)}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600">
                                            Paid
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </OrganizationLayout>
    );
}
