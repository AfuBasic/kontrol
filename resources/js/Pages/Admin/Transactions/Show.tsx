import { Head, Link } from '@inertiajs/react';

import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

interface Props {
    transaction: {
        reference_number: string;
        type_label: string;
        amount: number;
        status_label: string;
    };
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

export default function TransactionsShow({ transaction }: Props) {
    return (
        <>
            <Head title={`Transaction ${transaction.reference_number}`} />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <Link href={TransactionController.index.url()} className="text-sm font-semibold text-[#1F6FDB]">
                    ← Back to Transactions
                </Link>
                <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Transaction</p>
                    <h1 className="mt-2 text-2xl font-black text-slate-900">{transaction.reference_number}</h1>
                    <p className="mt-4 text-3xl font-black text-[#0A3D91]">{formatCurrency(transaction.amount)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                        {transaction.type_label} · {transaction.status_label}
                    </p>
                </div>
            </div>
        </>
    );
}
