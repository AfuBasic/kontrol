import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
    Globe,
    Building2,
    User,
    Sparkles,
    Percent,
    Coins,
    Calendar,
    Hash,
    ArrowLeft,
    CheckCircle2,
    Check,
    Search,
    X,
    Clock,
    Infinity as InfinityIcon,
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Estate {
    id: number;
    name: string;
}

interface Resident {
    id: number;
    name: string;
    email: string;
}

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_interval: string;
}

interface Props {
    estates: Estate[];
    residents: Resident[];
    plans: Plan[];
}

export default function CreateCoupon({ estates, residents, plans }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        campaign_name: '',
        description: '',
        code: '',
        type: 'percentage',
        value: '',
        scope: 'global',
        estate_id: '',
        user_ids: [] as string[],
        eligible_plans: [] as string[],
        expires_at: '',
        usage_limit: '',
    });

    // Helper states for search
    const [estateQuery, setEstateQuery] = useState('');
    const [residentQuery, setResidentQuery] = useState('');
    const [selectedEstateName, setSelectedEstateName] = useState('');
    const [selectedResidents, setSelectedResidents] = useState<Resident[]>([]);

    // Modal open states
    const [isEstateModalOpen, setIsEstateModalOpen] = useState(false);
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);

    // Toggle states for optional fields
    const [hasExpiry, setHasExpiry] = useState(false);
    const [hasLimit, setHasLimit] = useState(false);

    // Code generate animation trigger
    const [codeTrigger, setCodeTrigger] = useState(false);

    // Client-side validation state
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const validateField = (field: string, value: any) => {
        let errorMsg = '';

        if (field === 'campaign_name') {
            if (!value || !value.trim()) {
                errorMsg = 'Coupon name is required.';
            } else if (value.trim().length < 3) {
                errorMsg = 'Coupon name must be at least 3 characters.';
            }
        }

        if (field === 'code') {
            if (!value || !value.trim()) {
                errorMsg = 'Coupon code is required.';
            } else if (!/^[A-Z0-9-]+$/.test(value)) {
                errorMsg = 'Coupon code must be uppercase alphanumeric (dashes allowed).';
            } else if (value.length < 3) {
                errorMsg = 'Coupon code must be at least 3 characters.';
            }
        }

        if (field === 'value') {
            const num = parseFloat(value);
            if (!value || isNaN(num) || num <= 0) {
                errorMsg = 'Discount value must be a positive number greater than 0.';
            } else if (data.type === 'percentage' && num > 100) {
                errorMsg = 'Percentage discount cannot be greater than 100%.';
            }
        }

        if (field === 'estate_id' && data.scope === 'estate' && !value) {
            errorMsg = 'Target Estate must be selected.';
        }

        if (field === 'user_ids' && data.scope === 'resident' && (!value || value.length === 0)) {
            errorMsg = 'At least one Target Resident must be selected.';
        }

        if (field === 'expires_at' && hasExpiry) {
            if (!value) {
                errorMsg = 'Expiration date is required.';
            } else {
                const date = new Date(value);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (date <= now) {
                    errorMsg = 'Expiration date must be a future date.';
                }
            }
        }

        if (field === 'usage_limit' && hasLimit) {
            const num = parseInt(value, 10);
            if (!value || isNaN(num) || num < 1) {
                errorMsg = 'Usage limit must be a positive integer greater than 0.';
            }
        }

        setLocalErrors((prev) => ({ ...prev, [field]: errorMsg }));
        return !errorMsg;
    };

    // Filtered lists
    const filteredEstates = useMemo(() => {
        if (!estateQuery.trim()) return estates.slice(0, 8);
        return estates.filter((e) => e.name.toLowerCase().includes(estateQuery.toLowerCase())).slice(0, 8);
    }, [estates, estateQuery]);

    // Asynchronous state for residents (handles 5,000+ users gracefully)
    const [modalResidents, setModalResidents] = useState<Resident[]>(residents);
    const [isSearchingResidents, setIsSearchingResidents] = useState(false);

    useEffect(() => {
        if (!isResidentModalOpen) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingResidents(true);
            try {
                const response = await axios.get('/zeus/coupons/search-residents', {
                    params: { q: residentQuery },
                });
                setModalResidents(response.data);
            } catch (err) {
                console.error('Error fetching residents:', err);
            } finally {
                setIsSearchingResidents(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [residentQuery, isResidentModalOpen]);

    function generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'KTRL-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setData('code', code);
        setLocalErrors((prev) => ({ ...prev, code: '' }));
        setCodeTrigger(true);
        setTimeout(() => setCodeTrigger(false), 500);
    }

    function selectEstate(estate: Estate) {
        setData('estate_id', estate.id.toString());
        setSelectedEstateName(estate.name);
        setEstateQuery('');
        setLocalErrors((prev) => ({ ...prev, estate_id: '' }));
    }

    function clearEstateSelection() {
        setData('estate_id', '');
        setSelectedEstateName('');
        validateField('estate_id', '');
    }

    function toggleResident(resident: Resident) {
        setSelectedResidents((prev) => {
            const exists = prev.some((r) => r.id === resident.id);
            const next = exists ? prev.filter((r) => r.id !== resident.id) : [...prev, resident];
            setData(
                'user_ids',
                next.map((r) => r.id.toString()),
            );
            setLocalErrors((p) => ({ ...p, user_ids: '' }));
            return next;
        });
    }

    function removeResident(id: number) {
        setSelectedResidents((prev) => {
            const next = prev.filter((r) => r.id !== id);
            setData(
                'user_ids',
                next.map((r) => r.id.toString()),
            );
            return next;
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validate all fields
        const isNameValid = validateField('campaign_name', data.campaign_name);
        const isCodeValid = validateField('code', data.code);
        const isValueValid = validateField('value', data.value);
        const isEstateValid = data.scope === 'estate' ? validateField('estate_id', data.estate_id) : true;
        const isResidentValid = data.scope === 'resident' ? validateField('user_ids', data.user_ids) : true;
        const isExpiryValid = hasExpiry ? validateField('expires_at', data.expires_at) : true;
        const isLimitValid = hasLimit ? validateField('usage_limit', data.usage_limit) : true;

        if (!isNameValid || !isCodeValid || !isValueValid || !isEstateValid || !isResidentValid || !isExpiryValid || !isLimitValid) {
            return;
        }

        // Build payload based on options selected
        const payload = { ...data };
        if (!hasExpiry) payload.expires_at = '';
        if (!hasLimit) payload.usage_limit = '';

        post('/zeus/coupons');
    }

    // Quick Select value sets
    const quickPercentages = [5, 10, 15, 20, 25, 50];
    const quickFixedValues = [500, 1000, 2000, 5000];

    const scopes = [
        {
            id: 'global',
            title: 'Global',
            description: 'Valid for all estates & residents on the platform',
            icon: Globe,
            gradient: 'from-indigo-500/10 to-purple-500/10 text-indigo-400 border-indigo-500/20',
        },
        {
            id: 'estate',
            title: 'Estate Level',
            description: 'Apply discount to all residents of a selected estate',
            icon: Building2,
            gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'resident',
            title: 'Resident Level',
            description: 'Grant exclusive discount to a specific resident account',
            icon: User,
            gradient: 'from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20',
        },
    ];

    return (
        <ZeusLayout>
            <Head title="Create Coupon" />

            {/* Premium Decorative Glow */}
            <div className="pointer-events-none absolute top-0 right-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[130px] duration-[8000ms]" />
            <div className="pointer-events-none absolute bottom-10 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-[110px]" />

            <div className="relative mx-auto max-w-4xl px-4 py-8">
                {/* Back button */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                    <a
                        href="/zeus/coupons"
                        className="group inline-flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Coupons
                    </a>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-indigo-500 uppercase dark:text-indigo-400">
                            Coupon Manager
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        Create <span className="font-light text-slate-400">Coupon</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                        Design a targeted platform incentive. Distribute custom percentage or fixed-amount discounts mapped to estates, individual
                        users, or global audiences.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* SECTION 1: BLUEPRINT */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800/80 dark:bg-[#0f1423] dark:shadow-2xl"
                    >
                        <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <Sparkles className="h-4 w-4" />
                            </span>
                            Coupon Blueprint
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Coupon Name */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Coupon Name
                                </label>
                                <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]">
                                    <input
                                        type="text"
                                        value={data.campaign_name}
                                        onChange={(e) => {
                                            setData('campaign_name', e.target.value);
                                            validateField('campaign_name', e.target.value);
                                        }}
                                        placeholder="e.g. Year End Promotion"
                                        className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                    />
                                </div>
                                {(localErrors.campaign_name || errors.campaign_name) && (
                                    <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.campaign_name || errors.campaign_name}</p>
                                )}
                            </div>

                            {/* Coupon Description */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Description (Optional)
                                </label>
                                <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]">
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Briefly describe what this coupon does..."
                                        rows={2}
                                        className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Code Input */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Coupon Code
                                </label>
                                <motion.div
                                    animate={codeTrigger ? { scale: [1, 1.02, 1] } : {}}
                                    className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]"
                                >
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setData('code', val);
                                            validateField('code', val);
                                        }}
                                        placeholder="e.g. ZEU-SUMMER"
                                        className="w-full bg-transparent px-4 py-3.5 font-mono text-sm tracking-widest text-slate-900 uppercase placeholder:text-slate-400 focus:outline-none dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateRandomCode}
                                        className="flex cursor-pointer items-center gap-1.5 border-l border-slate-200 bg-slate-100 px-4 text-xs font-bold text-indigo-500 transition hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        <Sparkles className="animate-spin-slow h-3.5 w-3.5" /> Auto
                                    </button>
                                </motion.div>
                                {(localErrors.code || errors.code) && (
                                    <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.code || errors.code}</p>
                                )}
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Discount Type
                                </label>
                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/50 bg-slate-100/80 p-1.5 dark:border-slate-800 dark:bg-[#080b13]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((d) => ({ ...d, type: 'percentage', value: '' }));
                                            setLocalErrors((prev) => ({ ...prev, value: '' }));
                                        }}
                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                                            data.type === 'percentage'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Percent className="h-3.5 w-3.5" /> Percentage
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((d) => ({ ...d, type: 'fixed', value: '' }));
                                            setLocalErrors((prev) => ({ ...prev, value: '' }));
                                        }}
                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                                            data.type === 'fixed'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Coins className="h-3.5 w-3.5" /> Fixed (₦)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Value Input */}
                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Discount Value {data.type === 'percentage' ? '(%)' : '(₦)'}
                                </label>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                    {data.type === 'percentage' ? 'Max 100%' : 'Amount in Naira'}
                                </span>
                            </div>
                            <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]">
                                <span className="flex items-center pr-2 pl-4 text-sm font-black text-slate-400">
                                    {data.type === 'percentage' ? '%' : '₦'}
                                </span>
                                <input
                                    type="number"
                                    value={data.value}
                                    onChange={(e) => {
                                        setData('value', e.target.value);
                                        validateField('value', e.target.value);
                                    }}
                                    placeholder={data.type === 'percentage' ? '15' : '1000'}
                                    className="w-full bg-transparent py-3.5 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                />
                            </div>
                            {(localErrors.value || errors.value) && (
                                <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.value || errors.value}</p>
                            )}

                            {/* Quick Select Buttons */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="mr-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Quick Select:</span>
                                {data.type === 'percentage'
                                    ? quickPercentages.map((val) => (
                                          <button
                                              key={val}
                                              type="button"
                                              onClick={() => {
                                                  setData('value', val.toString());
                                                  validateField('value', val.toString());
                                              }}
                                              className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-800 dark:text-slate-400"
                                          >
                                              {val}%
                                          </button>
                                      ))
                                    : quickFixedValues.map((val) => (
                                          <button
                                              key={val}
                                              type="button"
                                              onClick={() => {
                                                  setData('value', val.toString());
                                                  validateField('value', val.toString());
                                              }}
                                              className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-800 dark:text-slate-400"
                                          >
                                              ₦{val.toLocaleString()}
                                          </button>
                                      ))}
                            </div>
                        </div>
                    </motion.section>

                    {/* SECTION 2: TARGET AUDIENCE */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800/80 dark:bg-[#0f1423] dark:shadow-2xl"
                    >
                        <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <Globe className="h-4 w-4" />
                            </span>
                            Target Audience Scope
                        </h2>
                        <p className="mb-6 text-xs font-medium text-slate-400">Map this incentive to a specific audience group or user category.</p>

                        {/* Interactive Scope Selection Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {scopes.map((scope) => {
                                const Icon = scope.icon;
                                const isSelected = data.scope === scope.id;
                                return (
                                    <button
                                        key={scope.id}
                                        type="button"
                                        onClick={() => {
                                            setData((d) => ({
                                                ...d,
                                                scope: scope.id,
                                                estate_id: '',
                                                user_ids: [],
                                            }));
                                            clearEstateSelection();
                                            setSelectedResidents([]);
                                        }}
                                        className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 text-left transition-all ${
                                            isSelected
                                                ? 'border-indigo-500 bg-indigo-50/20 shadow-md shadow-indigo-500/5 dark:border-indigo-500 dark:bg-indigo-950/20'
                                                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-300 dark:bg-[#080b13] dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div
                                            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${scope.gradient}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-500 dark:text-white">
                                            {scope.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                            {scope.description}
                                        </p>
                                        {isSelected && (
                                            <span className="absolute top-4 right-4 text-indigo-500">
                                                <CheckCircle2 className="h-5 w-5 rounded-full bg-white text-indigo-500 dark:bg-[#0f1423] dark:text-indigo-400" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Triggers and Modals */}
                        <AnimatePresence mode="wait">
                            {data.scope === 'estate' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Target Estate
                                    </label>

                                    {selectedEstateName ? (
                                        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-indigo-500" />
                                                <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{selectedEstateName}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={clearEstateSelection}
                                                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEstateModalOpen(true)}
                                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/20 py-6 text-sm font-bold text-slate-500 transition-all hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-700 dark:bg-[#080b13]"
                                        >
                                            <Building2 className="h-4 w-4" />
                                            Click to Search & Choose Estate
                                        </button>
                                    )}
                                    {(localErrors.estate_id || errors.estate_id) && (
                                        <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.estate_id || errors.estate_id}</p>
                                    )}
                                </motion.div>
                            )}

                            {data.scope === 'resident' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Target Residents
                                    </label>

                                    {selectedResidents.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedResidents.map((r) => (
                                                    <span
                                                        key={r.id}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pr-1.5 pl-3 text-xs font-bold text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                    >
                                                        {r.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeResident(r.id)}
                                                            className="cursor-pointer rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-200"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsResidentModalOpen(true)}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                            >
                                                + Add more residents
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsResidentModalOpen(true)}
                                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/20 py-6 text-sm font-bold text-slate-500 transition-all hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-700 dark:bg-[#080b13]"
                                        >
                                            <User className="h-4 w-4" />
                                            Click to Search & Choose Residents
                                        </button>
                                    )}
                                    {(localErrors.user_ids || errors.user_ids) && (
                                        <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.user_ids || errors.user_ids}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>

                    {/* SECTION 3: LIFE & LIMITS */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800/80 dark:bg-[#0f1423] dark:shadow-2xl"
                    >
                        <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
                                <Clock className="h-4 w-4" />
                            </span>
                            Constraints & Limits
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Toggleable Expiration */}
                            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 dark:border-slate-800 dark:bg-[#080b13]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expiration Date</h3>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Determine if coupon should auto-expire.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasExpiry(!hasExpiry);
                                            setData('expires_at', '');
                                        }}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                            hasExpiry ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                hasExpiry ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {hasExpiry ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#0f1423]">
                                                <span className="flex items-center pl-4 text-slate-400">
                                                    <Calendar className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type="date"
                                                    value={data.expires_at}
                                                    onChange={(e) => {
                                                        setData('expires_at', e.target.value);
                                                        validateField('expires_at', e.target.value);
                                                    }}
                                                    className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 focus:outline-none dark:text-white"
                                                />
                                            </div>
                                            {(localErrors.expires_at || errors.expires_at) && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                                                    {localErrors.expires_at || errors.expires_at}
                                                </p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <InfinityIcon className="h-4 w-4" /> Coupon lifespan is permanent
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Toggleable Limit */}
                            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 dark:border-slate-800 dark:bg-[#080b13]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Usage Limit</h3>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Limit total number of times used.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasLimit(!hasLimit);
                                            setData('usage_limit', '');
                                            setLocalErrors((prev) => ({ ...prev, usage_limit: '' }));
                                        }}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                            hasLimit ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                hasLimit ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {hasLimit ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#0f1423]">
                                                <span className="flex items-center pl-4 text-slate-400">
                                                    <Hash className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type="number"
                                                    value={data.usage_limit}
                                                    onChange={(e) => {
                                                        setData('usage_limit', e.target.value);
                                                        validateField('usage_limit', e.target.value);
                                                    }}
                                                    placeholder="e.g. 100"
                                                    className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 focus:outline-none dark:text-white"
                                                />
                                            </div>
                                            {(localErrors.usage_limit || errors.usage_limit) && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                                                    {localErrors.usage_limit || errors.usage_limit}
                                                </p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <InfinityIcon className="h-4 w-4" /> Unlimited redemption uses
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Plan Constraints */}
                            <div className="mt-8 border-t border-slate-100 pt-6 md:col-span-2 dark:border-slate-800/80">
                                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Plan Constraints</h3>
                                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                    Choose if this coupon works with a specific plan or all plans.
                                </p>

                                <div className="mb-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('eligible_plans', [])}
                                        className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                                            data.eligible_plans.length === 0
                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f1423] dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        All Plans
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (data.eligible_plans.length === 0 && plans.length > 0) {
                                                setData('eligible_plans', [plans[0].id.toString()]);
                                            }
                                        }}
                                        className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                                            data.eligible_plans.length > 0
                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f1423] dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        Specific Plans
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {data.eligible_plans.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 overflow-hidden border-t border-slate-100 pt-4 dark:border-slate-800/80"
                                        >
                                            <label className="mb-2.5 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                                Select Eligible Plans
                                            </label>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {plans.map((plan) => {
                                                    const isChecked = data.eligible_plans.includes(plan.id.toString());
                                                    const intervalLabel =
                                                        plan.billing_interval === 'quarterly'
                                                            ? 'Quarterly'
                                                            : plan.billing_interval === 'semi-annually'
                                                              ? 'Semi-Annual'
                                                              : 'Annual';
                                                    return (
                                                        <label
                                                            key={plan.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all select-none ${
                                                                isChecked
                                                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                                                                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f1423] dark:hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            <div className="pt-0.5">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {
                                                                        const strId = plan.id.toString();
                                                                        setData(
                                                                            'eligible_plans',
                                                                            isChecked
                                                                                ? data.eligible_plans.filter((id) => id !== strId)
                                                                                : [...data.eligible_plans, strId],
                                                                        );
                                                                    }}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                                                        isChecked
                                                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                            : 'border-slate-300 bg-transparent dark:border-slate-700'
                                                                    }`}
                                                                >
                                                                    {isChecked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                    {plan.name}
                                                                </span>
                                                                <span className="mt-1 block text-[10px] font-medium text-slate-400">
                                                                    ₦{(plan.price / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })} ·{' '}
                                                                    {intervalLabel}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.section>

                    {/* Actions buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 border-t border-slate-100 pt-6 dark:border-slate-800/80"
                    >
                        <a
                            href="/zeus/coupons"
                            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f1423] dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 cursor-pointer rounded-2xl bg-linear-to-r from-indigo-500 to-violet-600 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 dark:shadow-indigo-500/10"
                        >
                            {processing ? 'Creating coupon...' : 'Create Coupon'}
                        </button>
                    </motion.div>
                </form>
            </div>

            {/* Search Estate Modal */}
            <AnimatePresence>
                {isEstateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsEstateModalOpen(false);
                                setEstateQuery('');
                            }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0f1423]"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Select Target Estate</h3>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Choose which estate this coupon code applies to.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEstateModalOpen(false);
                                        setEstateQuery('');
                                    }}
                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative mb-4 flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]">
                                <span className="flex items-center pl-4 text-slate-400">
                                    <Search className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    value={estateQuery}
                                    onChange={(e) => setEstateQuery(e.target.value)}
                                    placeholder="Search by estate name..."
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                {filteredEstates.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400">
                                        <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">No estates found</p>
                                        <p className="text-slate-555 mt-0.5 text-xs">Try a different search term.</p>
                                    </div>
                                ) : (
                                    filteredEstates.map((estate) => (
                                        <div
                                            key={estate.id}
                                            onClick={() => {
                                                selectEstate(estate);
                                                setIsEstateModalOpen(false);
                                            }}
                                            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-indigo-500 hover:bg-indigo-500/5 dark:border-slate-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 transition-colors group-hover:text-indigo-500 dark:text-slate-200">
                                                    {estate.name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-indigo-500 transition-colors group-hover:text-indigo-400">
                                                Select
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Search Resident Modal */}
            <AnimatePresence>
                {isResidentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsResidentModalOpen(false);
                                setResidentQuery('');
                            }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0f1423]"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Select Target Resident</h3>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Choose which resident account this coupon applies to.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResidentModalOpen(false);
                                        setResidentQuery('');
                                    }}
                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative mb-4 flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-[#080b13]">
                                <span className="flex items-center pl-4 text-slate-400">
                                    <Search className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    value={residentQuery}
                                    onChange={(e) => setResidentQuery(e.target.value)}
                                    placeholder="Search by resident name or email..."
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                {isSearchingResidents ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((n) => (
                                            <div
                                                key={n}
                                                className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800"
                                            >
                                                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                                                    <div className="h-3 w-36 rounded bg-slate-100 dark:bg-slate-800" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : modalResidents.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400">
                                        <User className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">No residents found</p>
                                        <p className="mt-0.5 text-xs text-slate-500">Try a different search term.</p>
                                    </div>
                                ) : (
                                    modalResidents.map((resident) => {
                                        const isSelected = selectedResidents.some((r) => r.id === resident.id);
                                        return (
                                            <div
                                                key={resident.id}
                                                onClick={() => toggleResident(resident)}
                                                className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition ${
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/5 dark:border-indigo-500/50'
                                                        : 'border-slate-100 hover:border-indigo-500 hover:bg-indigo-500/5 dark:border-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                                                            isSelected
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400'
                                                        }`}
                                                    >
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-slate-700 transition-colors group-hover:text-indigo-500 dark:text-slate-200">
                                                            {resident.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs text-slate-400">{resident.email}</span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'}`}
                                                >
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                <span className="text-xs text-slate-500">{selectedResidents.length} resident(s) selected</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResidentModalOpen(false);
                                        setResidentQuery('');
                                    }}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ZeusLayout>
    );
}
