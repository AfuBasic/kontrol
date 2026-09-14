import { Head } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, ReceiptText } from 'lucide-react';
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

export default function Payments({ organization, total_outstanding = 0, outstanding = [], paid_history = [] }: Props) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(value);

    const primaryBill = outstanding[0];
    const isAllCaughtUp = total_outstanding <= 0 && outstanding.length === 0;
    const hasOverduePayment = outstanding.some((item) => item.is_overdue);
    const estateName = organization.estate_name || 'your estate';

    return (
        <OrganizationLayout title="Payments" contentClassName="max-w-[82rem]">
            <Head title={`${organization.name} - Payments`} />

            <div className="space-y-5">
                <section
                    className={`grid overflow-hidden rounded-[1.5rem] shadow-[0_24px_70px_rgba(15,23,42,0.12)] ring-1 sm:rounded-[2rem] ${
                        isAllCaughtUp
                            ? 'bg-[#0f172a] text-white ring-slate-900/10'
                            : hasOverduePayment
                              ? 'bg-rose-50 text-slate-950 ring-rose-200'
                              : 'bg-amber-50 text-slate-950 ring-amber-200'
                    } lg:grid-cols-[minmax(0,1fr)_24rem]`}
                >
                    <div className="p-4 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-black">
                            {isAllCaughtUp ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                            ) : (
                                <AlertTriangle className={`h-5 w-5 ${hasOverduePayment ? 'text-rose-600' : 'text-amber-600'}`} />
                            )}
                            <span className={isAllCaughtUp ? 'text-emerald-200' : hasOverduePayment ? 'text-rose-700' : 'text-amber-800'}>
                                {isAllCaughtUp ? 'Settled' : hasOverduePayment ? 'Overdue payment' : 'Payment due'}
                            </span>
                        </div>

                        <h1 className="mt-4 max-w-3xl text-[2rem] leading-none font-black sm:mt-5 sm:text-6xl">
                            {isAllCaughtUp ? 'No balance due' : formatCurrency(total_outstanding)}
                        </h1>

                        <p
                            className={`mt-5 max-w-xl text-base leading-7 font-semibold sm:text-lg ${
                                isAllCaughtUp ? 'text-slate-300' : 'text-slate-600'
                            }`}
                        >
                            {isAllCaughtUp
                                ? `${organization.name} is financially clear with ${estateName}.`
                                : `${organization.name} has ${outstanding.length} ${outstanding.length === 1 ? 'open item' : 'open items'} with ${estateName}.`}
                        </p>
                    </div>

                    <div
                        className={`border-t p-4 sm:p-6 lg:border-t-0 lg:border-l ${
                            isAllCaughtUp ? 'border-white/10 bg-white/[0.06]' : 'border-white/80 bg-white/60'
                        }`}
                    >
                        {isAllCaughtUp ? (
                            <div className="flex h-full flex-col justify-between gap-8">
                                <div>
                                    <p className="text-sm font-black text-white">Financial calm</p>
                                    <p className="mt-2 text-sm leading-6 font-semibold text-slate-300">
                                        Receipts and past payments remain available below when they exist.
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10">
                                    <p className="text-sm font-bold text-slate-300">Outstanding</p>
                                    <p className="mt-1 text-3xl font-black">{formatCurrency(0)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
                                    <p className="text-sm font-black text-slate-950">{primaryBill?.name || 'Estate payment'}</p>
                                    {primaryBill?.description && (
                                        <p className="mt-1 text-sm leading-6 font-semibold text-slate-500">{primaryBill.description}</p>
                                    )}
                                    <p className="mt-4 flex items-center gap-2 text-xs font-black text-slate-500">
                                        <Clock className="h-4 w-4" />
                                        {primaryBill?.due_date_human ? `Due ${primaryBill.due_date_human}` : 'Due date pending'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => alert('Online payment checkout can be completed with the estate management office.')}
                                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Pay {formatCurrency(total_outstanding)}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {!isAllCaughtUp && outstanding.length > 0 && (
                    <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-950">Open items</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">What the outstanding balance is made of.</p>
                            </div>
                        </div>

                        <div className="mt-5 divide-y divide-slate-100">
                            {outstanding.map((item) => {
                                const balance = item.amount_due - item.amount_paid;

                                return (
                                    <article
                                        key={item.id}
                                        className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-base font-black text-slate-950">{item.name}</h3>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                        item.is_overdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {item.is_overdue ? 'Overdue' : item.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                                {item.due_date_human ? `Due ${item.due_date_human}` : 'Due date pending'}
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-slate-950">{formatCurrency(balance)}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-950">Receipts</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Payment history for this organization.</p>
                        </div>
                        <ReceiptText className="h-5 w-5 text-slate-400" />
                    </div>

                    {paid_history.length === 0 ? (
                        <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
                            <p className="text-base font-black text-slate-950">No receipts yet.</p>
                            <p className="mt-2 text-sm leading-6 font-semibold text-slate-500">
                                Completed estate payments will appear here with receipt access.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 divide-y divide-slate-100">
                            {paid_history.map((item) => (
                                <article
                                    key={item.id}
                                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                >
                                    <div>
                                        <h3 className="text-base font-black text-slate-950">{item.name}</h3>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">Paid {item.paid_at}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <span className="text-lg font-black text-slate-950">{formatCurrency(item.amount_paid)}</span>
                                        <span className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-black text-[#0b4aa2]">Receipt</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </OrganizationLayout>
    );
}
