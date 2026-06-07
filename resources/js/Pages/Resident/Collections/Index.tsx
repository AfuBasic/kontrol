import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { show } from '@/actions/App/Http/Controllers/Resident/CollectionController';
import type { SharedData } from '@/types';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const MotionLink = motion(Link);

type Collection = {
    ulid: string;
    id: number;
    name: string;
};

type Assignment = {
    ulid: string;
    id: number;
    collection_id: number;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'grace' | 'partial';
    due_date: string;
    period: string | null;
    collection: Collection;
    is_property_owner_bill?: boolean;
    billing_source?: 'estate' | 'property_owner';
};

type Props = {
    summary: {
        outstanding: Assignment[];
        paid: Assignment[];
    };
    allAssignments: Assignment[];
};

export default function CollectionsIndex({ summary }: Props) {
    const { auth, app_url: appUrl } = usePage<SharedData>().props;
    const hasLandlord = !!auth?.user?.profile?.property_owner_id;
    const [billFilter, setBillFilter] = useState<'all' | 'estate' | 'property_owner'>('all');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-success-50 text-success-700';
            case 'overdue':
                return 'bg-error-50 text-error-700';
            case 'grace':
                return 'bg-primary-50 text-primary-700';
            default:
                return 'bg-warning-50 text-warning-700';
        }
    };

    const totalOutstanding = summary.outstanding.reduce((acc, curr) => acc + (curr.amount_due - curr.amount_paid), 0);

    const filteredOutstanding = summary.outstanding.filter((item) => {
        if (billFilter === 'all') return true;
        return item.billing_source === billFilter;
    });

    const filteredPaid = summary.paid.filter((item) => {
        if (billFilter === 'all') return true;
        return item.billing_source === billFilter;
    });

    const handlePayAll = async () => {
        const ulids = filteredOutstanding.map((a) => a.ulid).join(',');
        const rawPaymentUrl = `/billing/collections/bulk?assignments=${ulids}`;
        const paymentUrl = rawPaymentUrl.startsWith('//')
            ? `${appUrl.startsWith('https') ? 'https:' : 'http:'}${rawPaymentUrl}`
            : `${appUrl}${rawPaymentUrl}`;

        const isNative = Capacitor.isNativePlatform();
        if (isNative) {
            try {
                await Browser.open({ url: paymentUrl });
            } catch (err) {
                console.error('Failed to open in-app browser:', err);
                window.open(paymentUrl, '_system');
            }
        } else {
            window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const tabs = [
        { id: 'all' as const, label: 'All Bills' },
        { id: 'estate' as const, label: 'Estate Bills' },
        ...(hasLandlord ? [{ id: 'property_owner' as const, label: 'Property Owner Bills' }] : []),
    ];

    return (
        <div className="flex flex-col gap-6 pb-32">
            <Head title="Billing & Dues" />

            {/* Header Section */}
            <section className="px-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Billing</h1>
                <p className="mt-1 font-medium text-slate-500">Manage your estate dues and levies.</p>
            </section>

            {/* Total Balance Card */}
            <section>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
                    <div className="relative z-10">
                        <p className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Total Outstanding</p>
                        <h2 className="mt-2 text-4xl font-black tracking-tight">{formatCurrency(totalOutstanding)}</h2>

                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {summary.outstanding.slice(0, 3).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800"
                                    >
                                        <Wallet className="h-4 w-4 text-slate-500" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-slate-400">{summary.outstanding.length} pending obligations</p>
                        </div>
                    </div>
                    {/* Decorative Blobs */}
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
                </div>
            </section>

            {/* Filter Tabs */}
            {hasLandlord && (
                <div className="mb-2">
                    <div className="flex max-w-md rounded-xl bg-slate-100 p-1">
                        {tabs.map((tab) => {
                            const isActive = billFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setBillFilter(tab.id)}
                                    className={`relative flex flex-1 items-center justify-center rounded-lg py-2 text-xs font-semibold transition-all ${
                                        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeBillFilter"
                                            className="absolute inset-0 rounded-lg bg-white shadow-xs"
                                            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Outstanding Section */}
            <section>
                <div className="mb-4 flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Outstanding Dues</h3>
                    {filteredOutstanding.length > 1 && (
                        <button
                            onClick={handlePayAll}
                            className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[9px] font-black tracking-widest text-indigo-600 uppercase transition-all active:scale-95 cursor-pointer hover:bg-indigo-100"
                        >
                            Pay All ({filteredOutstanding.length})
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredOutstanding.length > 0 ? (
                        filteredOutstanding.map((assignment) => (
                            <MotionLink
                                key={assignment.id}
                                href={show.url(assignment.ulid)}
                                layoutId={`collection-card-${assignment.ulid}`}
                                className="group flex items-center justify-between rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all active:scale-[0.98] active:bg-slate-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                                            assignment.status === 'overdue' ? 'bg-error-50 text-error-500' : 'bg-warning-50 text-warning-500'
                                        }`}
                                    >
                                        {assignment.status === 'overdue' ? <AlertCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black tracking-tight text-slate-900">{assignment.collection.name}</h4>
                                            {assignment.billing_source === 'property_owner' ? (
                                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-purple-700 uppercase ring-1 ring-purple-100/50">
                                                    Property Owner
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-blue-700 uppercase ring-1 ring-blue-100/50">
                                                    Estate
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            Due{' '}
                                            {new Date(assignment.due_date).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black tracking-tight text-slate-900">
                                        {formatCurrency(assignment.amount_due - assignment.amount_paid)}
                                    </div>
                                    <div className="mt-1 flex justify-end">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${getStatusStyles(assignment.status)}`}
                                        >
                                            {assignment.status}
                                        </span>
                                    </div>
                                </div>
                            </MotionLink>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-slate-50/50 py-12 text-center ring-1 ring-slate-100 ring-inset">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-success-500 shadow-sm">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">All caught up!</p>
                            <p className="mt-1 text-xs text-slate-500">You have no outstanding dues.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Recently Paid Section */}
            {summary.paid.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Paid History</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {filteredPaid.slice(0, 3).map((assignment) => (
                            <Link
                                key={assignment.id}
                                href={show.url(assignment.ulid)}
                                className="flex items-center justify-between rounded-[2rem] bg-white p-5 opacity-70 shadow-sm ring-1 ring-slate-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-500">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900">{assignment.collection.name}</h4>
                                            {assignment.billing_source === 'property_owner' ? (
                                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-purple-700 uppercase ring-1 ring-purple-100/50">
                                                    Property Owner
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-blue-700 uppercase ring-1 ring-blue-100/50">
                                                    Estate
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            {assignment.period || 'One-time'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">{formatCurrency(assignment.amount_paid)}</div>
                                    <p className="text-[10px] font-bold tracking-widest text-success-500 uppercase">Paid</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
