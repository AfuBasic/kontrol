import {
    ArrowLeftIcon,
    UserIcon,
    BuildingOfficeIcon,
    XMarkIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ClockIcon,
    CreditCardIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { index as settlementIndex } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/SettlementController';
import ConfirmationModal from '@/Components/ConfirmationModal';

interface TargetItem {
    type: 'user' | 'property';
    id: number;
    name: string;
}

interface Props {
    residents: Array<{ id: number; name: string }>;
    properties: Array<{ id: number; name: string }>;
    hasSettlementAccount: boolean;
}

export default function Create({ residents, properties, hasSettlementAccount }: Props) {
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedTargets, setSelectedTargets] = useState<TargetItem[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        amount: '',
        billing_type: 'one_time' as 'one_time' | 'recurring',
        recurring_interval: 'monthly' as 'monthly' | 'weekly' | 'yearly',
        start_date: new Date().toISOString().split('T')[0],
        due_at: '',
        due_day: 1,
        grace_days: 0,
        late_fee: '',
        applies_to: 'all' as 'all' | 'target',
        include_creator: false,
        targets: [] as Array<{ type: 'user' | 'property'; id: number }>,
    });

    const filteredResidents = useMemo(() => residents.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())), [residents, search]);

    const filteredProperties = useMemo(() => properties.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [properties, search]);

    const handleIncludeCreatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setShowConfirmModal(true);
        } else {
            setData('include_creator', false);
        }
    };

    const handleConfirmInclude = () => {
        setData('include_creator', true);
        setShowConfirmModal(false);
    };

    const handleCancelInclude = () => {
        setData('include_creator', false);
        setShowConfirmModal(false);
    };

    const formatMoney = (val: string | number) => {
        if (!val && val !== 0) return '';
        const stringVal = val.toString().replace(/,/g, '');
        const parts = stringVal.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const rawValue = input.replace(/[^0-9.]/g, '');
        const parts = rawValue.split('.');
        const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
        setData('amount', cleanValue);
    };

    const handleLateFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const rawValue = input.replace(/[^0-9.]/g, '');
        const parts = rawValue.split('.');
        const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
        setData('late_fee', cleanValue);
    };

    const isSelected = (type: 'user' | 'property', id: number) => selectedTargets.some((t) => t.type === type && t.id === id);

    const toggleTarget = (item: TargetItem) => {
        let updated: TargetItem[];
        if (isSelected(item.type, item.id)) {
            updated = selectedTargets.filter((t) => !(t.type === item.type && t.id === item.id));
        } else {
            updated = [...selectedTargets, item];
        }
        setSelectedTargets(updated);
        setData(
            'targets',
            updated.map((t) => ({ type: t.type, id: t.id })),
        );
    };

    const removeTarget = (item: TargetItem) => toggleTarget(item);

    // Date calculations for shortcuts avoiding timezone shift issues
    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodayDate = () => formatDateLocal(new Date());
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return formatDateLocal(tomorrow);
    };
    const getNextWeekDate = () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return formatDateLocal(nextWeek);
    };
    const getFirstOfNextMonthDate = () => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return formatDateLocal(nextMonth);
    };
    const getEndOfMonthDate = () => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return formatDateLocal(endOfMonth);
    };

    // Step navigations & validation
    const isStep1Valid = data.name.trim() !== '' && data.amount !== '' && Number(data.amount) > 0;
    const isStep2Valid = data.billing_type === 'one_time' ? data.due_at !== '' : data.start_date !== '' && data.due_day >= 1 && data.due_day <= 28;
    const isStep3Valid = data.applies_to === 'all' || selectedTargets.length > 0;

    const nextStep = () => {
        if (step === 1 && isStep1Valid) setStep(2);
        else if (step === 2 && isStep2Valid) setStep(3);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return;
        post(store.url());
    };

    return (
        <div className="mx-auto max-w-2xl pb-24">
            <Head title="Create Bill Collection" />

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Link
                    href={index.url()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">Create Custom Bill</h1>
                    <p className="text-xs font-bold text-slate-500">Charge rent or service fees to your occupants.</p>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="mb-8 flex items-center justify-between rounded-3xl bg-white p-4 shadow-xs ring-1 ring-slate-100">
                {[
                    { number: 1, label: 'Bill Basics', icon: CreditCardIcon },
                    { number: 2, label: 'Schedule', icon: ClockIcon },
                    { number: 3, label: 'Audience', icon: UserGroupIcon },
                ].map((s) => {
                    const isActive = step === s.number;
                    const isCompleted = step > s.number;
                    return (
                        <div key={s.number} className="flex flex-1 items-center justify-center gap-2 first:justify-start last:justify-end">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : isCompleted
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-slate-50 text-slate-400'
                                }`}
                            >
                                {isCompleted ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : <s.icon className="h-4 w-4" />}
                            </div>
                            <span
                                className={`hidden text-xs font-black tracking-wide sm:inline ${
                                    isActive ? 'font-bold text-slate-900' : 'text-slate-400'
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                    {/* STEP 1: BILL BASICS */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
                        >
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Step 1: Bill details</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Specify basic details about the charges.</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    Bill Name / Title
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                    placeholder="e.g. June Rent, Utility Fee"
                                />
                                {errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    Billing Description
                                </label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="mt-2 block w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                    placeholder="Provide any context about this charge sheet..."
                                />
                                {errors.description && <p className="mt-1 text-xs font-bold text-rose-600">{errors.description}</p>}
                            </div>

                            {/* Amount */}
                            <div>
                                <label htmlFor="amount" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    Amount
                                </label>
                                <div className="relative mt-2">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <span className="text-sm font-bold text-slate-400">₦</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="amount"
                                        required
                                        value={formatMoney(data.amount)}
                                        onChange={handleAmountChange}
                                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-9 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                        placeholder="50,000"
                                    />
                                </div>
                                {errors.amount && <p className="mt-1 text-xs font-bold text-rose-600">{errors.amount}</p>}
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-6">
                                <button
                                    type="button"
                                    disabled={!isStep1Valid}
                                    onClick={nextStep}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                >
                                    Continue
                                    <ArrowRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: BILLING TYPE & SCHEDULE */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
                        >
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Step 2: Frequency & Schedule</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Define when and how often residents will be charged.</p>
                            </div>

                            {/* Billing Type Toggle */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase">Billing Frequency</label>
                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('billing_type', 'one_time')}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all ${
                                            data.billing_type === 'one_time'
                                                ? 'border-indigo-600 bg-indigo-50/20'
                                                : 'border-slate-200 bg-slate-50 hover:bg-white'
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-slate-900">One-time Bill</span>
                                        <span className="mt-1 text-[10px] text-slate-400">Single collection with a fixed due date</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('billing_type', 'recurring')}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all ${
                                            data.billing_type === 'recurring'
                                                ? 'border-indigo-600 bg-indigo-50/20'
                                                : 'border-slate-200 bg-slate-50 hover:bg-white'
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-slate-900">Recurring Collection</span>
                                        <span className="mt-1 text-[10px] text-slate-400">Automatically generates bills at intervals</span>
                                    </button>
                                </div>
                            </div>

                            {/* One-Time Billing Fields */}
                            {data.billing_type === 'one_time' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                    {/* Due Date */}
                                    <div className="min-w-0">
                                        <label htmlFor="due_at" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            id="due_at"
                                            required
                                            min={getTomorrowDate()}
                                            value={data.due_at}
                                            onChange={(e) => setData('due_at', e.target.value)}
                                            className="mt-2 block w-full max-w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                        />
                                        {/* Friendly Date Shortcuts */}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('due_at', getTomorrowDate())}
                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all ${
                                                    data.due_at === getTomorrowDate()
                                                        ? 'bg-indigo-500 text-white ring-indigo-500'
                                                        : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                Tomorrow
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('due_at', getNextWeekDate())}
                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all ${
                                                    data.due_at === getNextWeekDate()
                                                        ? 'bg-indigo-500 text-white ring-indigo-500'
                                                        : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                Next Week
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('due_at', getEndOfMonthDate())}
                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all ${
                                                    data.due_at === getEndOfMonthDate()
                                                        ? 'bg-indigo-500 text-white ring-indigo-500'
                                                        : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                End of Month
                                            </button>
                                        </div>
                                        {errors.due_at && <p className="mt-1 text-xs font-bold text-rose-600">{errors.due_at}</p>}
                                    </div>
                                </motion.div>
                            )}

                            {/* Recurring Billing Fields */}
                            {data.billing_type === 'recurring' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {/* Start Date */}
                                        <div className="min-w-0">
                                            <label htmlFor="start_date" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                Billing Start Date
                                            </label>
                                            <input
                                                type="date"
                                                id="start_date"
                                                required
                                                min={getTodayDate()}
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                className="mt-2 block w-full max-w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                            />
                                            {/* Start Date Shortcuts */}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('start_date', getTodayDate())}
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-all ${
                                                        data.start_date === getTodayDate()
                                                            ? 'bg-indigo-500 text-white ring-indigo-500'
                                                            : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                    }`}
                                                >
                                                    Today
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('start_date', getTomorrowDate())}
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-all ${
                                                        data.start_date === getTomorrowDate()
                                                            ? 'bg-indigo-500 text-white ring-indigo-500'
                                                            : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                    }`}
                                                >
                                                    Tomorrow
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('start_date', getFirstOfNextMonthDate())}
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-all ${
                                                        data.start_date === getFirstOfNextMonthDate()
                                                            ? 'bg-indigo-500 text-white ring-indigo-500'
                                                            : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50/50'
                                                    }`}
                                                >
                                                    1st of Next Month
                                                </button>
                                            </div>
                                            {errors.start_date && <p className="mt-1 text-xs font-bold text-rose-600">{errors.start_date}</p>}
                                        </div>

                                        {/* Billing Interval */}
                                        <div>
                                            <label
                                                htmlFor="recurring_interval"
                                                className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
                                            >
                                                Billing Interval
                                            </label>
                                            <select
                                                id="recurring_interval"
                                                value={data.recurring_interval}
                                                onChange={(e) => setData('recurring_interval', e.target.value as 'monthly' | 'weekly' | 'yearly')}
                                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                            >
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                            {errors.recurring_interval && (
                                                <p className="mt-1 text-xs font-bold text-rose-600">{errors.recurring_interval}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        {/* Due Day */}
                                        <div>
                                            <label htmlFor="due_day" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                Due Day (of month)
                                            </label>
                                            <input
                                                type="number" inputMode="numeric" pattern="[0-9]*"
                                                id="due_day"
                                                required
                                                min="1"
                                                max="28"
                                                value={data.due_day}
                                                onChange={(e) => setData('due_day', Number(e.target.value))}
                                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                                placeholder="1"
                                            />
                                            {errors.due_day && <p className="mt-1 text-xs font-bold text-rose-600">{errors.due_day}</p>}
                                        </div>

                                        {/* Grace Period */}
                                        <div>
                                            <label htmlFor="grace_days" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                Grace Period (Days)
                                            </label>
                                            <input
                                                type="number" inputMode="numeric" pattern="[0-9]*"
                                                id="grace_days"
                                                min="0"
                                                value={data.grace_days}
                                                onChange={(e) => setData('grace_days', Number(e.target.value))}
                                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                                placeholder="0"
                                            />
                                            {errors.grace_days && <p className="mt-1 text-xs font-bold text-rose-600">{errors.grace_days}</p>}
                                        </div>

                                        {/* Late Fee */}
                                        <div>
                                            <label htmlFor="late_fee" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                Late Fee (Optional)
                                            </label>
                                            <div className="relative mt-2">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <span className="text-sm font-bold text-slate-400">₦</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="late_fee"
                                                    value={formatMoney(data.late_fee)}
                                                    onChange={handleLateFeeChange}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-9 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                                    placeholder="500"
                                                />
                                            </div>
                                            {errors.late_fee && <p className="mt-1 text-xs font-bold text-rose-600">{errors.late_fee}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!isStep2Valid}
                                    onClick={nextStep}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                >
                                    Continue
                                    <ArrowRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: AUDIENCE & SUMMARY REVIEW */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
                        >
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Step 3: Audience & Summary Review</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Select billing targets and confirm options before publishing.</p>
                            </div>

                            {/* Target Audience */}
                            <div>
                                <label htmlFor="applies_to" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    Target Audience
                                </label>
                                <select
                                    id="applies_to"
                                    value={data.applies_to}
                                    onChange={(e) => setData('applies_to', e.target.value as 'all' | 'target')}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                >
                                    <option value="all">All My Residents</option>
                                    <option value="target">Specific Targets</option>
                                </select>
                                {errors.applies_to && <p className="mt-1 text-xs font-bold text-rose-600">{errors.applies_to}</p>}
                            </div>

                            {/* Include Creator (Property Owner) */}
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                <label className="relative flex cursor-pointer items-center rounded-full">
                                    <input
                                        type="checkbox"
                                        id="include_creator"
                                        checked={data.include_creator}
                                        onChange={handleIncludeCreatorChange}
                                        className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all before:content-[''] checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none"
                                    />
                                    {data.include_creator && (
                                        <span className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white">
                                            <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                                        </span>
                                    )}
                                </label>
                                <div>
                                    <label htmlFor="include_creator" className="block cursor-pointer text-xs font-bold text-slate-900">
                                        Include me (Property Owner)
                                    </label>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                        Assign this bill to yourself as well as your residents.
                                    </p>
                                </div>
                            </div>

                            {/* Target List Checklist */}
                            <AnimatePresence>
                                {data.applies_to === 'target' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            {/* Search */}
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    placeholder="Search residents or properties..."
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                                />
                                            </div>

                                            {/* Checkboxes list */}
                                            <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50">
                                                {filteredResidents.length === 0 && filteredProperties.length === 0 ? (
                                                    <p className="py-8 text-center text-xs font-bold text-slate-400">No matches found</p>
                                                ) : (
                                                    <>
                                                        {filteredResidents.length > 0 && (
                                                            <div>
                                                                <p className="sticky top-0 bg-slate-100 px-4 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                                    Residents
                                                                </p>
                                                                {filteredResidents.map((r) => {
                                                                    const selected = isSelected('user', r.id);
                                                                    return (
                                                                        <button
                                                                            key={r.id}
                                                                            type="button"
                                                                            onClick={() => toggleTarget({ type: 'user', id: r.id, name: r.name })}
                                                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white ${selected ? 'bg-indigo-50/60' : ''}`}
                                                                        >
                                                                            <div
                                                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}
                                                                            >
                                                                                {selected && (
                                                                                    <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
                                                                                )}
                                                                            </div>
                                                                            <UserIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                                                                            <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {filteredProperties.length > 0 && (
                                                            <div>
                                                                <p className="sticky top-0 bg-slate-100 px-4 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                                    Properties
                                                                </p>
                                                                {filteredProperties.map((p) => {
                                                                    const selected = isSelected('property', p.id);
                                                                    return (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => toggleTarget({ type: 'property', id: p.id, name: p.name })}
                                                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white ${selected ? 'bg-emerald-50/60' : ''}`}
                                                                        >
                                                                            <div
                                                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}
                                                                            >
                                                                                {selected && (
                                                                                    <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
                                                                                )}
                                                                            </div>
                                                                            <BuildingOfficeIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                                                                            <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Selected Chips */}
                                            {selectedTargets.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                                                    {selectedTargets.map((target, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-xs ring-1 ring-slate-200"
                                                        >
                                                            {target.type === 'user' ? (
                                                                <UserIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                            ) : (
                                                                <BuildingOfficeIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                            )}
                                                            {target.name}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTarget(target)}
                                                                className="ml-0.5 text-slate-400 hover:text-rose-500"
                                                            >
                                                                <XMarkIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-rose-500">Select at least one target above.</p>
                                            )}
                                            {errors.targets && <p className="mt-1 text-xs font-bold text-rose-600">{errors.targets}</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Summary Review Card */}
                            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                                <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Billing Summary Review</h4>
                                <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-bold text-slate-800">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Bill Title</p>
                                        <p className="mt-0.5 text-sm font-black text-slate-900">{data.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Amount Due</p>
                                        <p className="mt-0.5 text-sm font-black text-indigo-600">₦{Number(data.amount).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Billing Frequency</p>
                                        <p className="mt-0.5 font-black text-slate-900 capitalize">{data.billing_type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        {data.billing_type === 'one_time' ? (
                                            <>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Due Date</p>
                                                <p className="mt-0.5 font-black text-slate-900">{data.due_at || '—'}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Schedule</p>
                                                <p className="mt-0.5 font-black text-slate-900 capitalize">
                                                    {data.recurring_interval} (Starts {data.start_date || '—'}, Due Day {data.due_day})
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {data.billing_type === 'recurring' && (
                                        <>
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Grace Period</p>
                                                <p className="mt-0.5 font-black text-slate-900">{data.grace_days} Days</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Late Fee Override</p>
                                                <p className="mt-0.5 font-black text-slate-900">
                                                    {data.late_fee ? `₦${Number(data.late_fee).toLocaleString()}` : 'None'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Recipients Scope</p>
                                        <p className="mt-0.5 font-black text-slate-900">
                                            {data.applies_to === 'all'
                                                ? `All Managed Residents${data.include_creator ? ' + Yourself' : ''}`
                                                : `${selectedTargets.length} selected target(s)${data.include_creator ? ' + Yourself' : ''}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings/Reminders */}
                            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-[11px] font-medium text-amber-800">
                                <CheckCircleIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-500" />
                                <div>
                                    <p className="font-bold text-amber-900">Please confirm all details.</p>
                                    <p className="mt-0.5 text-amber-700/90">
                                        Billing invoices will be automatically generated and sent to target residents accordingly.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !isStep3Valid}
                                    className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                >
                                    {processing ? 'Publishing...' : 'Publish Bill'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={handleCancelInclude}
                onConfirm={handleConfirmInclude}
                title="Include Yourself?"
                message="This means you'll also have to pay the bill. Do you agree?"
                confirmLabel="Yes, Agree"
                cancelLabel="Cancel"
                type="info"
            />

            <ConfirmationModal
                isOpen={!hasSettlementAccount}
                onClose={() => router.visit(index.url())}
                onConfirm={() => router.visit(settlementIndex.url())}
                title="Settlement Account Required"
                message="Setup your settlement account before creating a collection. This ensures that payments collected from your residents are correctly remitted to your bank account."
                confirmLabel="Setup Settlement Account"
                cancelLabel="Go Back"
                type="info"
            />
        </div>
    );
}
