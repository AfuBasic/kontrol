import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { Landmark, Search, ChevronDown, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import { twMerge } from 'tailwind-merge';
import ResidentLayout from '@/Layouts/ResidentLayout';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Bank {
    name: string;
    code: string;
}

interface Props {
    settlement: {
        bank_name: string | null;
        bank_code: string | null;
        account_number: string | null;
        account_name: string | null;
        paystack_subaccount_code: string | null;
    };
    banks: Bank[];
}

export default function Settlement({ settlement, banks = [] }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        bank_name: settlement.bank_name || '',
        bank_code: settlement.bank_code || '',
        account_number: settlement.account_number || '',
        account_name: settlement.account_name || '',
    });

    const [bankQuery, setBankQuery] = useState('');
    const [resolvingBank, setResolvingBank] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(!!settlement.account_name);

    const filteredBanks = bankQuery === '' ? banks : banks.filter((bank) => bank.name.toLowerCase().includes(bankQuery.toLowerCase()));

    const handleResolveBank = async () => {
        if (data.account_number.length !== 10 || !data.bank_code) return;

        setResolvingBank(true);
        setResolveError(null);
        try {
            const response = await axios.post('/resident/property-owner/settlement/resolve', {
                account_number: data.account_number,
                bank_code: data.bank_code,
            });
            if (response.data.success) {
                setData('account_name', response.data.account_name);
                setIsVerified(true);
            }
        } catch (error: any) {
            setResolveError(error.response?.data?.message || 'Could not verify account. Please check the details.');
            setData('account_name', '');
            setIsVerified(false);
        } finally {
            setResolvingBank(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/resident/property-owner/settlement', {
            preserveScroll: true,
        });
    };

    // Reset verification if details change
    useEffect(() => {
        if (data.account_number !== settlement.account_number || data.bank_code !== settlement.bank_code) {
            setIsVerified(false);
        } else {
            setIsVerified(!!settlement.account_name);
        }
    }, [data.account_number, data.bank_code]);

    return (
        <div className="mx-auto max-w-2xl pb-16">
            <Head title="Settlement Account" />

            <div className="mb-8 flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Settlement Account</h1>
                    <p className="mt-1 text-sm text-slate-500">Configure your bank account details for receiving direct payments from occupants.</p>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Landmark className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900">Settlement Bank Details</h2>
                        <p className="text-xs font-semibold text-slate-500">Payments will be routed directly to this account via Paystack.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {(errors as any).message && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                            <div className="flex items-center gap-3 text-rose-800">
                                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                                <div className="text-sm font-bold">{(errors as any).message}</div>
                            </div>
                        </div>
                    )}
                    {/* Bank Selection */}
                    <div>
                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Select Bank</label>
                        <Combobox
                            value={banks.find((b) => b.code === data.bank_code) || null}
                            onChange={(bank: any) => {
                                setData((d) => ({
                                    ...d,
                                    bank_code: bank?.code || '',
                                    bank_name: bank?.name || '',
                                }));
                                setIsVerified(false);
                            }}
                        >
                            <div className="relative mt-2">
                                <div className="relative w-full cursor-default overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                                    <ComboboxInput
                                        className="w-full border-none py-3.5 pr-10 pl-12 text-sm font-bold text-slate-900 focus:ring-0 focus:outline-none"
                                        displayValue={(bank: any) => bank?.name || ''}
                                        onChange={(event) => setBankQuery(event.target.value)}
                                        placeholder="Search for a bank..."
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </ComboboxButton>
                                </div>
                                <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                    afterLeave={() => setBankQuery('')}
                                >
                                    <ComboboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white py-2 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                        {filteredBanks.length === 0 && bankQuery !== '' ? (
                                            <div className="relative cursor-default px-4 py-2 font-medium text-slate-500 select-none">
                                                No banks found.
                                            </div>
                                        ) : (
                                            filteredBanks.map((bank) => (
                                                <ComboboxOption
                                                    key={bank.code}
                                                    className={({ active }) =>
                                                        cn(
                                                            'relative cursor-default py-3 pr-4 pl-12 transition-colors select-none',
                                                            active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-900',
                                                        )
                                                    }
                                                    value={bank}
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span
                                                                className={cn(
                                                                    'block truncate font-bold',
                                                                    selected ? 'text-indigo-700' : 'text-slate-900',
                                                                )}
                                                            >
                                                                {bank.name}
                                                            </span>
                                                            {selected ? (
                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-600">
                                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </ComboboxOption>
                                            ))
                                        )}
                                    </ComboboxOptions>
                                </Transition>
                            </div>
                        </Combobox>
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Account Number</label>
                        <div className="mt-2 flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={data.account_number}
                                    onChange={(e) => {
                                        setData('account_number', e.target.value.replace(/\D/g, ''));
                                        setIsVerified(false);
                                    }}
                                    placeholder="10-digit number"
                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                />
                                {resolvingBank && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleResolveBank}
                                disabled={data.account_number.length !== 10 || !data.bank_code || resolvingBank || isVerified}
                                className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-30"
                            >
                                Verify
                            </button>
                        </div>
                        {resolveError && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {resolveError}
                            </p>
                        )}
                        {errors.account_number && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.account_number}
                            </p>
                        )}
                    </div>

                    {/* Verified Account Name */}
                    {data.account_name && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-indigo-600/60 uppercase">Verified Account Name</p>
                                    <p className="text-sm font-black text-slate-900">{data.account_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {settlement.paystack_subaccount_code && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Paystack Subaccount Code</p>
                                    <p className="font-mono text-sm font-bold text-slate-700">{settlement.paystack_subaccount_code}</p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                                    Active Routing
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                        <button
                            type="submit"
                            disabled={processing || !isVerified}
                            className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                        >
                            {processing ? 'Saving details...' : 'Confirm & Save Account'}
                        </button>
                        <p className="mt-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Secured & Settled via Paystack
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

Settlement.layout = (page: React.ReactNode) => <ResidentLayout children={page} />;
