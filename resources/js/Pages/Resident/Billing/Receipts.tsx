import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
    ArrowLeftIcon,
    ArrowTopRightOnSquareIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import ResidentLayout from '@/Layouts/ResidentLayout';

type Invoice = {
    ulid: string;
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    status: 'pending' | 'paid' | 'overdue' | 'failed';
    due_date: string;
    created_at: string;
};

type Props = {
    recentInvoices?: {
        data: Invoice[];
        next_page_url: string | null;
        total: number;
    };
    invoices?: {
        data: Invoice[];
        next_page_url: string | null;
        total: number;
    };
    subscription?: {
        status: string;
        plan_name?: string;
    };
};

const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ReceiptsPage({ invoices, recentInvoices }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const invoiceData = invoices || recentInvoices || { data: [], next_page_url: null, total: 0 };

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const paidInvoiceCount = invoiceData.data.filter((invoice) => invoice.status === 'paid').length;
    const openInvoiceCount = invoiceData.data.filter((invoice) => invoice.status !== 'paid').length;
    const receiptCountLabel = `${invoiceData.total} ${invoiceData.total === 1 ? 'receipt' : 'receipts'}`;

    const openWebApp = async () => {
        let url = `${window.location.origin}/resident/billing/receipts`;
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url({ destination: 'receipts' } as any));
            const data = await response.json();
            if (data.magic_url) {
                url = data.magic_url;
            }
        } catch (error) {
            console.error('Failed to generate magic URL', error);
        }

        if (isNative) {
            try {
                await Browser.open({ url });
            } catch (e) {
                console.warn('Capacitor Browser open failed, fallback to window.open', e);
                window.open(url, '_system');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    const loadMore = () => {
        if (invoiceData.next_page_url && !isLoadingMore) {
            setIsLoadingMore(true);
            router.get(
                invoiceData.next_page_url,
                {},
                {
                    preserveScroll: true,
                    only: invoices ? ['invoices'] : ['recentInvoices'],
                    // @ts-expect-error - merge is Inertia v2 feature
                    merge: true,
                    onFinish: () => setIsLoadingMore(false),
                },
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <Head title="Receipts & Payments" />

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href={ResidentBillingController.index.url()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        aria-label="Back to Billing Hub"
                    >
                        <ArrowLeftIcon className="h-5 w-5" strokeWidth={2.2} />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase leading-tight">Billing destination</p>
                        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Receipts & Payments</h1>
                    </div>

                    {isNative && (
                        <button
                            type="button"
                            onClick={openWebApp}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                            title="Open in Web Browser"
                        >
                            <span className="hidden sm:inline">Browser</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Transaction Records</span>
                            <p className="mt-1 text-sm font-bold text-slate-950">{receiptCountLabel}</p>
                        </div>
                        {invoiceData.data.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                <span>{paidInvoiceCount} settled</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span>{openInvoiceCount} pending/failed</span>
                            </div>
                        )}
                    </div>

                    {invoiceData.data.length > 0 ? (
                        <>
                            <ul className="divide-y divide-slate-100">
                                {invoiceData.data.map((invoice) => {
                                    const paid = invoice.status === 'paid';
                                    const overdue = invoice.status === 'overdue' || invoice.status === 'failed';
                                    return (
                                        <li key={invoice.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                        paid ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {paid ? (
                                                        <CheckCircleIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    ) : overdue ? (
                                                        <ExclamationTriangleIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    ) : (
                                                        <ClockIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-950">{invoice.formatted_amount}</p>
                                                    <p className="mt-0.5 break-all text-xs leading-5 text-slate-500">
                                                        {formatDate(invoice.created_at)} · {invoice.invoice_number}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${
                                                    paid
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : overdue
                                                          ? 'bg-rose-50 text-rose-700'
                                                          : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {paid ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {invoiceData.next_page_url && (
                                <div className="border-t border-slate-100 p-4 sm:p-6">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 text-[11px] font-black tracking-[0.16em] text-slate-600 uppercase transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoadingMore ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                        ) : (
                                            <>
                                                Load More Invoices
                                                <ChevronDownIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-8">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <SparklesIcon className="h-5 w-5" strokeWidth={2} />
                            </span>
                            <p className="mt-3 text-sm font-black text-slate-950">No transaction records yet</p>
                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Invoices and payment receipts will appear here after completed transactions.</p>
                        </div>
                    )}
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[11px] font-bold text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Payments secured by Gateway
                </p>
            </main>
        </div>
    );
}

ReceiptsPage.layout = (page: ReactNode) => (
    <ResidentLayout hideHeader hideNav className="bg-[#f6f8fb]">
        {page}
    </ResidentLayout>
);
