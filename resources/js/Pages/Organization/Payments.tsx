import { Head, Link } from '@inertiajs/react';
import {
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    ExternalLink,
    HelpCircle,
} from 'lucide-react';
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

    return (
        <OrganizationLayout title="Payments">
            <Head title={`${organization.name} - Payments`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Payments
                    </h1>
                    <p className="text-sm text-stone-500 mt-0.5">
                        Estate levies, facility dues, and payment receipts for {organization.name}.
                    </p>
                </div>

                {/* Outstanding Dues Summary */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-xs space-y-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Total Outstanding
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {formatCurrency(total_outstanding)}
                        </div>

                        {total_outstanding > 0 ? (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                Dues pending settlement
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                All estate dues are settled
                            </span>
                        )}
                    </div>
                </div>

                {/* Outstanding Bills List */}
                {outstanding.length > 0 && (
                    <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-900">Current Invoices & Dues</h2>
                        <div className="divide-y divide-stone-100">
                            {outstanding.map((item) => (
                                <div
                                    key={item.id}
                                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div>
                                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                            {item.name}
                                        </h3>
                                        {item.description && (
                                            <p className="text-xs text-stone-500 mt-0.5">{item.description}</p>
                                        )}
                                        <p className="text-xs text-stone-400 mt-1">
                                            Due {item.due_date_human || 'soon'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 self-start sm:self-auto">
                                        <span className="font-bold text-base text-slate-900">
                                            {formatCurrency(item.amount_due - item.amount_paid)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => alert('Online checkout can be completed with the estate office.')}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
                                        >
                                            Pay now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment History */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <h2 className="text-base font-bold text-slate-900">Payment History</h2>

                    {paid_history.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">No payment records yet</h3>
                            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                                Settled facility levies and estate service dues will be listed here with receipts.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {paid_history.map((item) => (
                                <div
                                    key={item.id}
                                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 text-xs sm:text-sm"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-stone-500">Settled on {item.paid_at}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(item.amount_paid)}
                                        </span>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Paid
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
