import {
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    CreditCardIcon,
    UsersIcon,
    CalendarIcon,
    BanknotesIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    SparklesIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import * as InvoiceController from '@/actions/App/Http/Controllers/Admin/InvoiceController';
import Spinner from '@/Components/Spinner';
import Toast from '@/Components/Toast';
import AdminLayout from '@/Layouts/AdminLayout';

type PaymentTransaction = {
    id: number;
    paystack_reference: string | null;
    status: 'pending' | 'success' | 'failed';
    amount: number;
    attempt_count: number;
    error_code: string | null;
    error_message: string | null;
    recorded_at: string | null;
    verified_at: string | null;
    created_at: string;
    metadata: {
        authorization_url?: string;
        access_code?: string;
        original_reference?: string;
    } | null;
};

type Invoice = {
    ulid: string;
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    resident_count: number;
    billing_period_start: string;
    billing_period_end: string;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    paid_at?: string;
    created_at: string;
    last_sent_email_at?: string;
    paystack_reference?: string;
    plan?: {
        name: string;
        price: number;
    };
    payment_transactions: PaymentTransaction[];
};

type Props = {
    invoice: Invoice;
};

// --- V3: DOPE BUT COMPACT COMPONENTS ---

const BackgroundAura = () => (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary-400 blur-[120px]"
        />
        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-[10%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500 blur-[100px]"
        />
    </div>
);

const MiniStamp = ({ status }: { status: string }) => {
    const isPaid = status === 'paid';
    const isOverdue = status === 'overdue';
    const isPending = status === 'pending';

    return (
        <motion.div
            initial={{ scale: 1.8, opacity: 0, rotate: 25, y: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 12, y: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 0.4 }}
            className={`pointer-events-none absolute top-4 right-4 z-20 rotate-12 transform border-2 px-3 py-0.5 text-xs font-black tracking-[0.2em] uppercase select-none sm:top-8 sm:right-8 sm:border-3 sm:px-5 sm:py-1.5 sm:text-lg ${
                isPaid
                    ? 'border-emerald-500/40 text-emerald-500/60'
                    : isOverdue
                      ? 'border-red-500/40 text-red-500/60'
                      : 'border-blue-500/40 text-blue-500/60'
            }`}
            style={{ fontFamily: 'serif' }}
        >
            {status}
        </motion.div>
    );
};

type StatCardProps = {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
    delay: number;
};

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }: StatCardProps) => {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            border: 'border-blue-100',
        },
        green: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            border: 'border-emerald-100',
        },
        purple: {
            bg: 'bg-violet-50',
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
            border: 'border-violet-100',
        },
        amber: {
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            border: 'border-amber-100',
        },
        red: {
            bg: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            border: 'border-red-100',
        },
    };

    const classes = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`relative overflow-hidden rounded-2xl border ${classes.border} ${classes.bg} p-6`}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/50 blur-3xl" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {subValue && <p className="mt-1 text-sm text-gray-500">{subValue}</p>}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${classes.iconBg} ${classes.iconColor}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </motion.div>
    );
};

export default function InvoiceDetailPage({ invoice }: Props) {
    const isPaid = invoice.status === 'paid';
    const isOverdue = invoice.status === 'overdue';
    const isPending = invoice.status === 'pending';
    const overdueDays = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86400000);

    // Calculate email cooldown
    const lastSentAt = invoice.last_sent_email_at ? new Date(invoice.last_sent_email_at) : null;
    const cooldownMs = lastSentAt ? Math.max(0, 60000 - (Date.now() - lastSentAt.getTime())) : 0;
    const [cooldownTime, setCooldownTime] = useState(cooldownMs);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // Loading states
    const [payLoading, setPayLoading] = useState(false);
    const [confirmPaymentLoading, setConfirmPaymentLoading] = useState(false);
    const [sendInvoiceLoading, setSendInvoiceLoading] = useState(false);

    // Cooldown timer effect
    React.useEffect(() => {
        if (cooldownTime <= 0) return;

        const timer = setInterval(() => {
            setCooldownTime((prev) => Math.max(0, prev - 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldownTime]);

    const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const handlePayment = () => {
        setPayLoading(true);
        router.post(
            InvoiceController.pay.url(invoice.ulid),
            {},
            {
                onSuccess: () => {
                    setPayLoading(false);
                    showToastMessage('Redirecting to payment gateway...', 'success');
                },
                onError: () => {
                    setPayLoading(false);
                    showToastMessage('Failed to initialize payment. Please try again.', 'error');
                },
            },
        );
    };

    const handleConfirmPayment = () => {
        setConfirmPaymentLoading(true);
        router.post(
            InvoiceController.confirmPayment.url(invoice.ulid),
            {},
            {
                onSuccess: () => {
                    setConfirmPaymentLoading(false);
                    showToastMessage('Payment verified and confirmed successfully!', 'success');
                },
                onError: () => {
                    setConfirmPaymentLoading(false);
                    showToastMessage('Failed to verify payment. Please try again.', 'error');
                },
            },
        );
    };

    const handleSendInvoice = () => {
        setSendInvoiceLoading(true);
        router.post(
            InvoiceController.sendInvoice.url(invoice.ulid),
            {},
            {
                onSuccess: () => {
                    setSendInvoiceLoading(false);
                    showToastMessage('Invoice email sent successfully!', 'success');
                },
                onError: () => {
                    setSendInvoiceLoading(false);
                    showToastMessage('Failed to send invoice email. Please try again.', 'error');
                },
            },
        );
    };

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/50">
                <BackgroundAura />

                <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:py-12 lg:px-8">
                    {/* Back Link */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <Link
                            href={InvoiceController.index.url()}
                            className="group flex items-center gap-2 font-semibold text-slate-500 transition-all hover:text-primary-600"
                        >
                            <div className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-xs transition-colors group-hover:border-primary-200 group-hover:bg-primary-50">
                                <ArrowLeftIcon className="h-4 w-4" />
                            </div>
                            <span className="text-sm">Invoice List</span>
                        </Link>
                    </motion.div>

                    {/* Stat Cards Grid */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Amount Due" value={invoice.formatted_amount} icon={BanknotesIcon} color="green" delay={0.05} />
                        <StatCard title="Residents Billed" value={invoice.resident_count.toString()} icon={UsersIcon} color="blue" delay={0.1} />
                        <StatCard
                            title="Status"
                            value={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            icon={isPaid ? CheckCircleIcon : isOverdue ? XCircleIcon : ClockIcon}
                            color={isPaid ? 'green' : isOverdue ? 'red' : 'purple'}
                            delay={0.15}
                        />
                        <StatCard
                            title="Due Date"
                            value={new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            subValue={isOverdue ? `${overdueDays} days overdue` : 'Upcoming'}
                            icon={CalendarIcon}
                            color={isOverdue ? 'amber' : 'blue'}
                            delay={0.2}
                        />
                    </div>

                    <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-12">
                        {/* THE "DOPE" INVOICE SHEET (CONSOLIDATED) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.99, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="group relative lg:col-span-8"
                        >
                            {/* Glass Container */}
                            <div className="zeus-grain relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
                                <MiniStamp status={invoice.status} />

                                {/* Header Section */}
                                <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 border-b border-slate-100 p-6 pb-4 sm:p-10">
                                    <div className="max-w-xs">
                                        <div className="mb-6 flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 rotate-[-4deg] items-center justify-center rounded-xl bg-slate-950 shadow-lg shadow-sm transition-transform group-hover:rotate-0">
                                                <DocumentTextIcon className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">Kontrol.</span>
                                        </div>

                                        <p className="mb-1 text-[10px] font-black tracking-[0.2em] text-primary-500 uppercase">Invoice Reference</p>
                                        <h2 className="mb-4 text-2xl leading-none font-black tracking-tight text-gray-900 sm:mb-6 sm:text-3xl">
                                            #{invoice.invoice_number}
                                        </h2>

                                        <div className="flex gap-4">
                                            <div>
                                                <p className="mb-1 text-[9px] font-black tracking-widest text-gray-300 uppercase">Billing Period</p>
                                                <p className="text-xs leading-tight font-bold text-gray-600">
                                                    {new Date(invoice.billing_period_start).toLocaleDateString()}
                                                    <span className="mx-1 text-gray-300">→</span>
                                                    {new Date(invoice.billing_period_end).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="mb-1 text-[10px] font-black tracking-widest text-gray-400 uppercase">Grand Total</p>
                                        <p className="text-3xl leading-none font-black tracking-tighter text-primary-600 sm:text-4xl">
                                            {invoice.formatted_amount}
                                        </p>
                                    </div>
                                </div>

                                {/* Body / Line Items */}
                                <div className="relative z-10 p-6 pt-8 sm:p-10">
                                    <div className="mb-6 flex items-center justify-between gap-4">
                                        <h3 className="flex items-center gap-2 text-sm font-black tracking-widest text-gray-900 uppercase">
                                            <SparklesIcon className="h-4 w-4 text-primary-500" />
                                            Billables
                                        </h3>
                                        <div className="h-px flex-1 bg-linear-to-r from-slate-100 to-transparent" />
                                    </div>

                                    <div className="space-y-4">
                                        {/* Main Item */}
                                        <div className="group/item flex cursor-default items-center justify-between rounded-2xl border border-white bg-white/50 p-4 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 sm:p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-xl bg-primary-100 p-2.5 text-primary-600 transition-transform group-hover/item:scale-110">
                                                    <UsersIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold text-gray-900 sm:text-base">
                                                        {invoice.plan?.name || 'Estate Plan'}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-gray-400 sm:text-xs">
                                                        Serving {invoice.resident_count} registered residents
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900 sm:text-base">
                                                    ₦{((invoice.plan?.price || 0) / 100).toLocaleString()}
                                                </p>
                                                <p className="mt-1 text-[9px] font-black tracking-widest text-gray-300 uppercase">per resident</p>
                                            </div>
                                        </div>

                                        {/* Perks */}
                                        <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-4">
                                            <div className="flex items-center gap-3 opacity-50">
                                                <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                                                <p className="text-xs font-bold text-slate-500">Global Security Node Support</p>
                                            </div>
                                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-600">
                                                COVERED
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subtotal Stack */}
                                    <div className="mt-10 flex justify-end sm:mt-12">
                                        <div className="w-full space-y-3 sm:w-64">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Net Total</span>
                                                <span className="text-sm font-extrabold text-gray-900">{invoice.formatted_amount}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Platform VAT</span>
                                                <span className="text-sm font-extrabold text-gray-900">₦0.00</span>
                                            </div>
                                            <div className="border-t border-slate-100 pt-3">
                                                <div className="group/total relative flex items-center justify-between overflow-hidden rounded-2xl bg-slate-900 p-4 shadow-xl shadow-slate-200">
                                                    <div className="absolute inset-0 bg-slate-950 opacity-0 transition-opacity group-hover/total:opacity-10" />
                                                    <span className="relative z-10 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Payable Total
                                                    </span>
                                                    <span className="relative z-10 text-xl font-black text-white">{invoice.formatted_amount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="animate-shimmer h-2 bg-linear-to-r from-primary-600 via-indigo-600 to-primary-600"
                                    style={{ backgroundSize: '200% 100%' }}
                                />
                            </div>
                        </motion.div>

                        {/* Sidebar: Mobile Friendly Neon Hub */}
                        <div className="space-y-6 sm:space-y-8 lg:col-span-4">
                            {/* Primary Action Card */}
                            {!isPaid && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`group relative overflow-hidden rounded-3xl p-px shadow-2xl ${
                                        isOverdue ? 'bg-linear-to-br from-red-500 to-orange-500' : 'bg-linear-to-br from-primary-500 to-indigo-600'
                                    }`}
                                >
                                    <div className="relative z-10 rounded-[1.45rem] bg-white p-6 sm:p-8">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div
                                                className={`rounded-xl p-2 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}
                                            >
                                                <CreditCardIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-sm font-black tracking-widest text-gray-900 uppercase">
                                                {isOverdue ? 'Action Required' : 'Authorization'}
                                            </h3>
                                        </div>

                                        <p className="mb-8 text-xs leading-relaxed font-bold text-slate-400">
                                            {isOverdue
                                                ? `Settle this overdue balance of ${invoice.formatted_amount} to prevent security lockout.`
                                                : 'Authorize this transaction via Paystack. Secured and encrypted 256-bit gateway.'}
                                        </p>

                                        <button
                                            onClick={handlePayment}
                                            disabled={payLoading}
                                            className={`group relative h-14 w-full rounded-2xl text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                                                isOverdue ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-slate-950 shadow-sm hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="flex items-center justify-center gap-3">
                                                {payLoading ? (
                                                    <>
                                                        <Spinner size="md" color="white" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Process {invoice.formatted_amount}
                                                        <ArrowPathIcon className="h-4 w-4 opacity-20" />
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirm Payment Card (shows if pending + has transactions) */}
                            {!isPaid && invoice.payment_transactions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 p-px shadow-xl"
                                >
                                    <div className="relative z-10 rounded-[1.45rem] bg-white p-6 sm:p-8">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                                <ShieldCheckIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-sm font-black tracking-widest text-gray-900 uppercase">Confirm Payment</h3>
                                        </div>

                                        <p className="mb-8 text-xs leading-relaxed font-bold text-slate-400">
                                            If your payment went through but the callback didn't complete, click below to verify and confirm.
                                        </p>

                                        <button
                                            onClick={handleConfirmPayment}
                                            disabled={confirmPaymentLoading}
                                            className="group relative h-14 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            <span className="flex items-center justify-center gap-3">
                                                {confirmPaymentLoading ? (
                                                    <>
                                                        <Spinner size="md" color="white" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        Verify Payment
                                                        <ShieldCheckIcon className="h-4 w-4" />
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Neon Transaction Feed */}
                            {invoice.payment_transactions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
                                >
                                    <h4 className="mb-8 text-[10px] font-black tracking-[0.25em] text-gray-300 uppercase">Audit Records</h4>

                                    <div className="relative">
                                        <div className="absolute top-1 bottom-1 left-3 w-[2px] rounded-full bg-slate-50" />

                                        <div className="space-y-8">
                                            {invoice.payment_transactions.map((txn, idx) => (
                                                <motion.div
                                                    key={txn.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="relative pl-10"
                                                >
                                                    <div
                                                        className={`shadow-glow absolute top-1.5 left-3 h-4 w-4 -translate-x-1/2 rounded-full border-[3.5px] border-white shadow-sm transition-all ${
                                                            txn.status === 'success'
                                                                ? 'bg-emerald-400 shadow-emerald-200'
                                                                : txn.status === 'failed'
                                                                  ? 'bg-red-400 shadow-red-100'
                                                                  : 'bg-amber-400 shadow-amber-100'
                                                        }`}
                                                    />

                                                    <div className="flex flex-col">
                                                        <div className="flex items-start justify-between">
                                                            <p
                                                                className={`text-[10px] font-black tracking-widest uppercase ${
                                                                    txn.status === 'success'
                                                                        ? 'text-emerald-500'
                                                                        : txn.status === 'failed'
                                                                          ? 'text-red-500'
                                                                          : 'text-amber-500'
                                                                }`}
                                                            >
                                                                {txn.status === 'success'
                                                                    ? 'Confirmed'
                                                                    : txn.status === 'failed'
                                                                      ? 'Rejected'
                                                                      : 'Awaiting'}
                                                            </p>
                                                            <span className="text-[9px] font-black text-gray-300">
                                                                {new Date(txn.created_at).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 truncate text-[11px] font-extrabold text-gray-800">
                                                            {txn.paystack_reference || 'REF PENDING'}
                                                        </p>
                                                        <p className="mt-1 text-[9px] font-bold tracking-tighter text-gray-400 uppercase">
                                                            {new Date(txn.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Send Invoice Button */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                                className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-purple-500 to-indigo-600 p-px shadow-xl"
                            >
                                <div className="relative z-10 rounded-[1.45rem] bg-white p-6 sm:p-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-purple-50 p-2 text-purple-600 transition-transform group-hover:scale-110">
                                                <DocumentTextIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-sm font-black tracking-widest text-gray-900 uppercase">Send Invoice</h3>
                                        </div>
                                        {lastSentAt && (
                                            <p className="text-[9px] font-bold text-gray-400">
                                                Last sent: {lastSentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>

                                    <p className="mb-8 text-xs leading-relaxed font-bold text-slate-400">
                                        Send this invoice to the estate&apos;s email address with the PDF attached.
                                    </p>

                                    <button
                                        onClick={handleSendInvoice}
                                        disabled={sendInvoiceLoading || cooldownTime > 0}
                                        className={`group relative h-14 w-full rounded-2xl text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98] ${
                                            cooldownTime > 0
                                                ? 'cursor-not-allowed bg-gray-400 opacity-60 shadow-gray-200'
                                                : 'bg-purple-600 shadow-purple-200 hover:bg-purple-700'
                                        } disabled:cursor-not-allowed`}
                                    >
                                        <span className="flex items-center justify-center gap-3">
                                            {sendInvoiceLoading ? (
                                                <>
                                                    <Spinner size="md" color="white" />
                                                    Sending...
                                                </>
                                            ) : cooldownTime > 0 ? (
                                                <>
                                                    Wait {Math.ceil(cooldownTime / 1000)}s
                                                    <ClockIcon className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Send Invoice Email
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Support Node */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group relative overflow-hidden rounded-3xl bg-slate-900 p-6"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-125">
                                    <InformationCircleIcon className="h-12 w-12 text-white" />
                                </div>
                                <h4 className="mb-3 text-[10px] font-black tracking-widest text-primary-400 uppercase">Billing Assistance</h4>
                                <p className="mb-6 text-[11px] leading-relaxed font-bold text-slate-400">
                                    Need help with this transaction or a manual VAT receipt?
                                </p>
                                <Link
                                    href="#"
                                    className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-white uppercase transition-colors hover:text-primary-400"
                                >
                                    Open Support Ticket
                                    <ArrowLeftIcon className="h-3 w-3 rotate-180" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 12s linear infinite; }

                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                .animate-shimmer { animation: shimmer 4s infinite linear; }

                .shadow-glow { box-shadow: 0 0 10px currentColor; }
            `,
                }}
            />
        </>
    );
}
