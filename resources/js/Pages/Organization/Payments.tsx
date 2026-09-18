import { Head, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, CreditCard, MapPin, ReceiptText } from 'lucide-react';
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

    const page = usePage();
    const props = page.props as any;
    const auth = props.auth || {};
    const user = auth.user || {};
    const userFirstName = user.name ? user.name.split(' ')[0] : 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <OrganizationLayout title="Payments" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - Payments`} />

            <div className="mx-auto flex max-w-[480px] flex-col gap-3.5 px-4 pt-1 pb-24">
                {/* ATMOSPHERIC BACKGROUND */}
                <div className="app-atmosphere" />

                {/* ORGANIZATION IDENTITY */}
                <header className="flex flex-col pt-1">
                    <p className="text-[12px] font-medium text-slate-500">
                        {getGreeting()}, {userFirstName}
                    </p>
                    <div className="mt-0.5 flex items-center justify-between">
                        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#071f4b]">{organization.name || 'Payments'}</h1>
                    </div>
                    {estateName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {estateName}
                            <ChevronRight className="ml-0.5 h-3 w-3 text-slate-400" />
                        </p>
                    )}
                </header>

                <section
                    className={`relative mt-1 overflow-hidden rounded-[20px] p-5 shadow-lg ring-1 ${
                        isAllCaughtUp
                            ? 'bg-[#0a2558] text-white ring-slate-900/10'
                            : hasOverduePayment
                              ? 'bg-rose-50 text-slate-950 shadow-rose-900/5 ring-rose-200'
                              : 'bg-amber-50 text-slate-950 shadow-amber-900/5 ring-amber-200'
                    }`}
                >
                    {isAllCaughtUp && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[12px] font-bold">
                            {isAllCaughtUp ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            ) : (
                                <AlertTriangle className={`h-4 w-4 ${hasOverduePayment ? 'text-rose-600' : 'text-amber-600'}`} />
                            )}
                            <span className={isAllCaughtUp ? 'text-emerald-200' : hasOverduePayment ? 'text-rose-700' : 'text-amber-800'}>
                                {isAllCaughtUp ? 'Settled' : hasOverduePayment ? 'Overdue payment' : 'Payment due'}
                            </span>
                        </div>

                        <h2 className="mt-3 text-[36px] leading-none font-extrabold tracking-tight">
                            {isAllCaughtUp ? 'No balance' : formatCurrency(total_outstanding)}
                        </h2>

                        <p className={`mt-2 text-[13px] leading-relaxed font-medium ${isAllCaughtUp ? 'text-blue-100/80' : 'text-slate-600'}`}>
                            {isAllCaughtUp
                                ? `${organization.name} is financially clear with ${estateName}.`
                                : `${organization.name} has ${outstanding.length} ${outstanding.length === 1 ? 'open item' : 'open items'} with ${estateName}.`}
                        </p>

                        {!isAllCaughtUp && (
                            <div className="mt-5 space-y-3">
                                <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/50">
                                    <p className="text-[13px] font-bold text-slate-900">{primaryBill?.name || 'Estate payment'}</p>
                                    {primaryBill?.description && (
                                        <p className="mt-1 text-[12px] leading-snug font-medium text-slate-500">{primaryBill.description}</p>
                                    )}
                                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        {primaryBill?.due_date_human ? `Due ${primaryBill.due_date_human}` : 'Due date pending'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-200/60 bg-amber-100/50 p-3 text-[11px] leading-relaxed font-medium text-amber-900">
                                    <span className="mb-0.5 block font-bold">Settlement instructions</span>
                                    Payments are settled directly with the estate management office. Contact them to record and confirm this payment.
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {!isAllCaughtUp && outstanding.length > 0 && (
                    <section className="soft-card p-4">
                        <div className="mb-3">
                            <h2 className="text-[15px] font-bold text-[#071f4b]">Open items</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {outstanding.map((item) => {
                                const balance = item.amount_due - item.amount_paid;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-[14px] border border-slate-100 bg-slate-50/50 p-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-[13px] font-bold text-slate-900">{item.name}</h3>
                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        item.is_overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {item.is_overdue ? 'Overdue' : item.status}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                                {item.due_date_human ? `Due ${item.due_date_human}` : 'Due date pending'}
                                            </p>
                                        </div>
                                        <div className="pl-3 text-right">
                                            <p className="text-[14px] font-extrabold text-slate-900">{formatCurrency(balance)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="soft-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[15px] font-bold text-[#071f4b]">Receipts</h2>
                        <ReceiptText className="h-4 w-4 text-slate-400" />
                    </div>

                    {paid_history.length === 0 ? (
                        <div className="rounded-[14px] border border-slate-100 bg-slate-50/80 p-4 text-center">
                            <p className="text-[13px] font-bold text-slate-700">No receipts yet</p>
                            <p className="mt-1 text-[12px] font-medium text-slate-500">Completed payments will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {paid_history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-[14px] border border-slate-100 bg-slate-50/50 p-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-[13px] font-bold text-slate-900">{item.name}</h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">Paid {item.paid_at}</p>
                                    </div>
                                    <div className="flex flex-col items-end pl-3 text-right">
                                        <p className="text-[14px] font-extrabold text-slate-900">{formatCurrency(item.amount_paid)}</p>
                                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Settled
                                        </p>
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
