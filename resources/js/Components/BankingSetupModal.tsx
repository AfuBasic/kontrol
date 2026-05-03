import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { X, Building2, Search, ChevronDown, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Bank {
    name: string;
    code: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    banks: Bank[];
    currentSettings: {
        bank_name: string | null;
        bank_code: string | null;
        account_number: string | null;
        account_name: string | null;
    };
}

export default function BankingSetupModal({ isOpen, onClose, banks, currentSettings }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bank_name: currentSettings.bank_name || '',
        bank_code: currentSettings.bank_code || '',
        account_number: currentSettings.account_number || '',
        account_name: currentSettings.account_name || '',
    });

    const [bankQuery, setBankQuery] = useState('');
    const [resolvingBank, setResolvingBank] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(!!currentSettings.account_name);

    const filteredBanks = bankQuery === '' ? banks : banks.filter((bank) => bank.name.toLowerCase().includes(bankQuery.toLowerCase()));

    const handleResolveBank = async () => {
        if (data.account_number.length !== 10 || !data.bank_code) return;

        setResolvingBank(true);
        setResolveError(null);
        try {
            const response = await axios.post('/admin/settlement/resolve', {
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
        post('/admin/settlement/update', {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    // Reset verification if details change
    useEffect(() => {
        if (data.account_number !== currentSettings.account_number || data.bank_code !== currentSettings.bank_code) {
            setIsVerified(false);
        } else {
            setIsVerified(!!currentSettings.account_name);
        }
    }, [data.account_number, data.bank_code]);

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="absolute top-6 right-6">
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="p-8 sm:p-10">
                                    <div className="mb-8 flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-2xl font-black tracking-tight text-slate-900">
                                                Settlement Account
                                            </Dialog.Title>
                                            <p className="text-sm font-medium text-slate-500">Where should we send your collected funds?</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                                    <div className="relative w-full cursor-default overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
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
                                                                                active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900',
                                                                            )
                                                                        }
                                                                        value={bank}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                                                                                <span
                                                                                    className={cn(
                                                                                        'block truncate font-bold',
                                                                                        selected ? 'text-emerald-700' : 'text-slate-900',
                                                                                    )}
                                                                                >
                                                                                    {bank.name}
                                                                                </span>
                                                                                {selected ? (
                                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-600">
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
                                                        className="block w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                                                    />
                                                    {resolvingBank && (
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
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
                                        </div>

                                        {/* Verified Account Name */}
                                        <AnimatePresence>
                                            {data.account_name && (
                                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black tracking-widest text-emerald-600/60 uppercase">
                                                                Verified Account Name
                                                            </p>
                                                            <p className="text-sm font-black text-slate-900">{data.account_name}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={processing || !isVerified}
                                                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {processing ? 'Saving details...' : 'Confirm & Save Account'}
                                            </button>
                                            <p className="mt-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                Secured & Settled via Paystack
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
