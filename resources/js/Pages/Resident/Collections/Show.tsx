import { Head, Link } from '@inertiajs/react';
import { Wallet, ChevronLeft, Calendar, Info, ShieldCheck, ArrowUpRight, ExternalLink } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/Resident/CollectionController';
import CollectionPaymentController from '@/actions/App/Http/Controllers/Web/CollectionPaymentController';
import ResidentLayout from '@/Layouts/ResidentLayout';

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
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
    paid_at: string | null;
    collection: Collection;
};

type Props = {
    assignment: Assignment;
};

export default function CollectionShow({ assignment }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            case 'overdue': return 'bg-rose-100 text-rose-700';
            case 'grace': return 'bg-blue-100 text-blue-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    // The payment URL will be the web billing page
    const paymentUrl = CollectionPaymentController.show.url(assignment.ulid);

    return (
        <div className="flex flex-col gap-8 pb-32">
            <Head title={assignment.collection.name} />

            {/* Back Button */}
            <section className="px-1">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dues
                </Link>
            </section>

            {/* Main Info Card */}
            <section>
                <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] ${
                            assignment.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                            <Wallet className="h-10 w-10" />
                        </div>
                        
                        <span className={`mb-3 rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase ${getStatusStyles(assignment.status)}`}>
                            {assignment.status}
                        </span>
                        
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">{assignment.collection.name}</h1>
                        <p className="mt-2 text-slate-500 font-medium max-w-[250px]">
                            {assignment.collection.description || 'Estate levy for the current period.'}
                        </p>

                        <div className="mt-8 flex w-full flex-col gap-4 rounded-3xl bg-slate-50 p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Due</span>
                                <span className="text-xl font-black text-slate-900">{formatCurrency(assignment.amount_due)}</span>
                            </div>
                            {assignment.amount_paid > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paid Already</span>
                                    <span className="text-sm font-black text-emerald-600">-{formatCurrency(assignment.amount_paid)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</span>
                                <span className="text-2xl font-black text-[#1F6FDB]">{formatCurrency(assignment.amount_due - assignment.amount_paid)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Details Grid */}
            <section className="grid grid-cols-2 gap-4">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <Calendar className="h-5 w-5 text-slate-400 mb-3" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Due Date</p>
                    <p className="mt-1 font-black text-slate-900 tracking-tight">
                        {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <Info className="h-5 w-5 text-slate-400 mb-3" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Billing Cycle</p>
                    <p className="mt-1 font-black text-slate-900 tracking-tight uppercase">
                        {assignment.period || 'One-time'}
                    </p>
                </div>
            </section>

            {/* Payment Section */}
            <section>
                {assignment.status !== 'paid' ? (
                    <div className="space-y-4">
                        <a
                            href={paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-[#1F6FDB] py-6 text-lg font-black text-white shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                        >
                            Pay Now
                            <ExternalLink className="h-5 w-5" />
                        </a>
                        <div className="flex items-center justify-center gap-2 px-6 text-center">
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Secure external payment via Paystack
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[2rem] bg-emerald-50 p-8 text-center ring-1 ring-inset ring-emerald-100">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-emerald-900">Payment Completed</h3>
                        <p className="mt-1 text-sm font-medium text-emerald-600">
                            Thank you! This obligation has been fully settled on {new Date(assignment.paid_at!).toLocaleDateString()}.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

CollectionShow.layout = (page: any) => <ResidentLayout children={page} />;

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
