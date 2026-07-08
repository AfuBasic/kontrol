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
    ArrowUpRight,
    Tag,
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

    const [activeSection, setActiveSection] = useState('blueprint');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['blueprint', 'audience', 'limits'];
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

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

    // Asynchronous state for residents
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
            gradient: 'from-[#6C5DFD]/10 to-[#A78BFA]/10 text-[#6C5DFD] border-[#6C5DFD]/20',
        },
        {
            id: 'estate',
            title: 'Estate Level',
            description: 'Apply discount to all residents of a selected estate',
            icon: Building2,
            gradient: 'from-[#34D399]/10 to-teal-500/10 text-[#34D399] border-[#34D399]/20',
        },
        {
            id: 'resident',
            title: 'Resident Level',
            description: 'Grant exclusive discount to a specific resident account',
            icon: User,
            gradient: 'from-[#A78BFA]/10 to-pink-500/10 text-[#A78BFA] border-[#A78BFA]/20',
        },
    ];

    const sectionNav = [
        { id: 'blueprint', label: 'Blueprint' },
        { id: 'audience', label: 'Audience Scope' },
        { id: 'limits', label: 'Limits & Constraints' },
    ];

    return (
        <ZeusLayout>
            <Head title="Create Coupon – Zeus Console" />

            <div className="relative mx-auto max-w-7xl px-4 py-8 text-[#F2F3F6]">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Back button */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
                    <a
                        href="/zeus/coupons"
                        className="group inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#9297A8] uppercase transition-all hover:text-[#F2F3F6]"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Coupons
                    </a>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">
                            COUPON MANAGER
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-[#F2F3F6]">
                        Create <span className="font-light text-[#9297A8]">Coupon</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed font-medium text-[#9297A8]">
                        Design a targeted platform incentive. Distribute custom percentage or fixed-amount discounts mapped to estates, individual users, or global audiences.
                    </p>
                </motion.div>

                {/* Main 2-Column Layout */}
                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Left Sticky Progress Nav (1.5 cols) */}
                    <div className="hidden lg:block lg:col-span-2 sticky top-24 space-y-3">
                        <p className="text-[10px] font-bold tracking-wider text-[#9297A8] uppercase mb-4">Steps</p>
                        <div className="flex flex-col gap-3">
                            {sectionNav.map((s) => {
                                const isActive = activeSection === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => scrollToSection(s.id)}
                                        className={`text-left text-xs font-bold transition-all border-l-2 pl-3 py-1 ${
                                            isActive
                                                ? 'border-[#6C5DFD] text-[#F2F3F6] font-black scale-102'
                                                : 'border-transparent text-[#9297A8] hover:text-[#F2F3F6]'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Middle Form Panel (6.5 cols) */}
                    <div className="lg:col-span-6 space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* SECTION 1: BLUEPRINT */}
                            <motion.section
                                id="blueprint"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C5DFD]/15 text-[#6C5DFD]">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[#F2F3F6]">Coupon Blueprint</h2>
                                        <p className="text-xs text-[#9297A8]">Basic configurations and code creation</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Campaign Name & Code Row */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                                Coupon Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.campaign_name}
                                                onChange={(e) => {
                                                    setData('campaign_name', e.target.value);
                                                    validateField('campaign_name', e.target.value);
                                                }}
                                                placeholder="e.g. Year End Promotion"
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3.5 text-sm text-[#F2F3F6] placeholder:text-gray-600 focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] focus:outline-none transition-all"
                                                required
                                            />
                                            {(localErrors.campaign_name || errors.campaign_name) && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                                                    {localErrors.campaign_name || errors.campaign_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                                Coupon Code
                                            </label>
                                            <motion.div
                                                animate={codeTrigger ? { scale: [1, 1.02, 1] } : {}}
                                                className="relative flex overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD] transition-all"
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
                                                    className="w-full bg-transparent px-4 py-3.5 font-mono text-sm tracking-widest text-[#F2F3F6] uppercase placeholder:text-gray-600 focus:outline-none"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateRandomCode}
                                                    className="flex cursor-pointer items-center gap-1.5 border-l border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 text-xs font-bold text-[#6C5DFD] transition hover:text-white"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5" /> Auto
                                                </button>
                                            </motion.div>
                                            {(localErrors.code || errors.code) && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                                                    {localErrors.code || errors.code}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe what this coupon does..."
                                            rows={2}
                                            className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3.5 text-sm text-[#F2F3F6] placeholder:text-gray-600 focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] focus:outline-none transition-all"
                                        />
                                    </div>

                                    {/* Discount Configuration (Segmented Toggle & Input Connected) */}
                                    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0B10]/50 p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Discount Model</span>
                                            {/* Segmented Toggle */}
                                            <div className="flex gap-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] p-1 w-56">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData((d) => ({ ...d, type: 'percentage', value: '' }));
                                                        setLocalErrors((prev) => ({ ...prev, value: '' }));
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                                                        data.type === 'percentage'
                                                            ? 'bg-[#6C5DFD] text-[#F2F3F6] shadow-sm'
                                                            : 'text-[#9297A8] hover:text-[#F2F3F6]'
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
                                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                                                        data.type === 'fixed'
                                                            ? 'bg-[#6C5DFD] text-[#F2F3F6] shadow-sm'
                                                            : 'text-[#9297A8] hover:text-[#F2F3F6]'
                                                    }`}
                                                >
                                                    <Coins className="h-3.5 w-3.5" /> Fixed
                                                </button>
                                            </div>
                                        </div>

                                        {/* Value Input and Quick Select chips grouped together */}
                                        <div className="space-y-3">
                                            <div className="relative flex overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD] transition-all">
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
                                                    className="w-full bg-transparent py-3.5 pr-4 text-sm font-semibold text-[#F2F3F6] placeholder:text-gray-600 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            {(localErrors.value || errors.value) && (
                                                <p className="text-xs font-semibold text-rose-500">{localErrors.value || errors.value}</p>
                                            )}

                                            {/* Quick Select directly underneath input */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {data.type === 'percentage'
                                                    ? quickPercentages.map((val) => (
                                                          <button
                                                              key={val}
                                                              type="button"
                                                              onClick={() => {
                                                                  setData('value', val.toString());
                                                                  validateField('value', val.toString());
                                                              }}
                                                              className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-3 py-1.5 text-xs font-bold text-[#9297A8] hover:border-[#6C5DFD] hover:text-[#6C5DFD] transition-all"
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
                                                              className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-3 py-1.5 text-xs font-bold text-[#9297A8] hover:border-[#6C5DFD] hover:text-[#6C5DFD] transition-all"
                                                          >
                                                              ₦{val.toLocaleString()}
                                                          </button>
                                                      ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>

                            {/* SECTION 2: TARGET AUDIENCE */}
                            <motion.section
                                id="audience"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34D399]/15 text-[#34D399]">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[#F2F3F6]">Target Audience Scope</h2>
                                        <p className="text-xs text-[#9297A8]">Define who has eligibility to redeem this coupon code</p>
                                    </div>
                                </div>

                                {/* Audience Cards with uniform designs and checks */}
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
                                                className={`group relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD]/5 shadow-md'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] hover:border-gray-700'
                                                }`}
                                            >
                                                <div
                                                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${scope.gradient}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-sm font-bold text-[#F2F3F6] transition-colors group-hover:text-[#6C5DFD]">
                                                    {scope.title}
                                                </h3>
                                                <p className="mt-1.5 text-xs leading-relaxed font-medium text-[#9297A8]">
                                                    {scope.description}
                                                </p>
                                                {isSelected && (
                                                    <span className="absolute top-4 right-4 text-[#6C5DFD]">
                                                        <CheckCircle2 className="h-5 w-5 rounded-full bg-[#0A0B10] text-[#6C5DFD]" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Search triggers */}
                                <AnimatePresence mode="wait">
                                    {data.scope === 'estate' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                                Target Estate
                                            </label>

                                            {selectedEstateName ? (
                                                <div className="flex items-center justify-between rounded-xl border border-[#34D399]/20 bg-[#34D399]/5 px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-[#34D399]" />
                                                        <span className="text-sm font-bold text-[#34D399]">{selectedEstateName}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={clearEstateSelection}
                                                        className="cursor-pointer rounded-lg p-1 text-[#9297A8] hover:bg-gray-800 hover:text-[#F2F3F6]"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEstateModalOpen(true)}
                                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-[#0A0B10] py-6 text-sm font-bold text-[#9297A8] transition-all hover:border-[#6C5DFD] hover:text-[#6C5DFD]"
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                    Choose target estate
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
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                                                Target Residents
                                            </label>

                                            {selectedResidents.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedResidents.map((r) => (
                                                            <span
                                                                key={r.id}
                                                                className="inline-flex items-center gap-1.5 rounded-full border border-[#A78BFA]/20 bg-[#A78BFA]/10 py-1 pr-1.5 pl-3 text-xs font-bold text-[#A78BFA]"
                                                            >
                                                                {r.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeResident(r.id)}
                                                                    className="cursor-pointer rounded-full p-0.5 text-[#A78BFA] hover:bg-[#A78BFA]/20"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsResidentModalOpen(true)}
                                                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#6C5DFD] hover:underline"
                                                    >
                                                        + Add more residents
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsResidentModalOpen(true)}
                                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-[#0A0B10] py-6 text-sm font-bold text-[#9297A8] transition-all hover:border-[#6C5DFD] hover:text-[#6C5DFD]"
                                                >
                                                    <User className="h-4 w-4" />
                                                    Choose target residents
                                                </button>
                                            )}
                                            {(localErrors.user_ids || errors.user_ids) && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">{localErrors.user_ids || errors.user_ids}</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.section>

                            {/* SECTION 3: LIMITS & CONSTRAINTS */}
                            <motion.section
                                id="limits"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A78BFA]/15 text-[#A78BFA]">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[#F2F3F6]">Constraints & Limits</h2>
                                        <p className="text-xs text-[#9297A8]">Expiration and total coupon usage controls</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Toggleable Expiration */}
                                    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0B10] p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-[#F2F3F6]">Expiration Date</h3>
                                                <p className="mt-0.5 text-xs text-[#9297A8]">Auto-expire coupon after a date.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHasExpiry(!hasExpiry);
                                                    setData('expires_at', '');
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                                    hasExpiry ? 'bg-[#6C5DFD]' : 'bg-gray-800'
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
                                                    <div className="relative flex overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD]">
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
                                                            className="w-full bg-transparent px-3 py-3 text-sm text-[#F2F3F6] focus:outline-none"
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
                                                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#34D399]"
                                                >
                                                    <InfinityIcon className="h-4 w-4" /> Coupon lifespan is permanent
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Toggleable Limit */}
                                    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0B10] p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-[#F2F3F6]">Usage Limit</h3>
                                                <p className="mt-0.5 text-xs text-[#9297A8]">Limit total redeems allowed.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHasLimit(!hasLimit);
                                                    setData('usage_limit', '');
                                                    setLocalErrors((prev) => ({ ...prev, usage_limit: '' }));
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                                    hasLimit ? 'bg-[#6C5DFD]' : 'bg-gray-800'
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
                                                    <div className="relative flex overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD]">
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
                                                            placeholder="100"
                                                            className="w-full bg-transparent px-3 py-3 text-sm text-[#F2F3F6] focus:outline-none"
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
                                                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#34D399]"
                                                >
                                                    <InfinityIcon className="h-4 w-4" /> Unlimited redemption uses
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Plan Constraints */}
                                    <div className="mt-4 md:col-span-2 space-y-4">
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-bold text-[#F2F3F6]">Plan Constraints</h3>
                                            <p className="text-xs text-[#9297A8] mt-0.5">Restrict coupon eligibility to specific subscriptions.</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setData('eligible_plans', [])}
                                                className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                                                    data.eligible_plans.length === 0
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD] text-white shadow-xs'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] text-[#9297A8] hover:text-[#F2F3F6]'
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
                                                className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                                                    data.eligible_plans.length > 0
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD] text-white shadow-xs'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] text-[#9297A8] hover:text-[#F2F3F6]'
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
                                                    className="overflow-hidden border-t border-[rgba(255,255,255,0.06)] pt-4"
                                                >
                                                    <label className="mb-2.5 block text-[11px] font-bold tracking-wider text-[#9297A8] uppercase">
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
                                                                            ? 'border-[#6C5DFD] bg-[#6C5DFD]/5'
                                                                            : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] hover:bg-[#12141C]'
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
                                                                                    ? 'border-[#6C5DFD] bg-[#6C5DFD] text-white'
                                                                                    : 'border-gray-700 bg-transparent'
                                                                            }`}
                                                                        >
                                                                            {isChecked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-[#F2F3F6]">
                                                                            {plan.name}
                                                                        </span>
                                                                        <span className="mt-1 block text-[10px] font-medium text-[#9297A8]">
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
                                className="flex gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6"
                            >
                                <a
                                    href="/zeus/coupons"
                                    className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] py-4 text-center text-sm font-bold text-[#9297A8] transition hover:bg-gray-800"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 cursor-pointer rounded-2xl bg-[#6C5DFD] py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#6C5DFD]/90 active:scale-[0.98] disabled:opacity-60"
                                >
                                    {processing ? 'Creating coupon...' : 'Create Coupon'}
                                </button>
                            </motion.div>
                        </form>
                    </div>

                    {/* Right Sticky Preview Panel (3.5 cols) */}
                    <div className="lg:col-span-4 sticky top-24 space-y-6">
                        <p className="text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">Live Preview</p>

                        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl relative overflow-hidden">
                            {/* Glow accent */}
                            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#6C5DFD]/10 blur-2xl" />

                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[9px] font-bold tracking-wider text-[#6C5DFD] bg-[#6C5DFD]/10 px-2.5 py-1 rounded-full uppercase">
                                    INCENTIVE PASS
                                </span>
                                <Tag className="h-4 w-4 text-[#6C5DFD]" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-[#9297A8]">Campaign Name</p>
                                    <p className="text-lg font-bold text-[#F2F3F6] truncate">
                                        {data.campaign_name || 'Draft Campaign'}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0B10] p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-medium text-[#9297A8] uppercase tracking-wider">Coupon Code</p>
                                        <p className="text-sm font-mono font-bold tracking-widest text-[#F2F3F6] mt-0.5">
                                            {data.code || 'CODE-PENDING'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-medium text-[#9297A8] uppercase tracking-wider">Benefit</p>
                                        <p className="text-base font-black text-[#34D399] mt-0.5">
                                            {data.value
                                                ? data.type === 'percentage'
                                                    ? `${data.value}% OFF`
                                                    : `₦${Number(data.value).toLocaleString()} OFF`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 text-xs text-[#9297A8] border-t border-[rgba(255,255,255,0.06)] pt-4">
                                    <div className="flex justify-between">
                                        <span>Audience Scope</span>
                                        <span className="font-bold text-[#F2F3F6] capitalize">{data.scope}</span>
                                    </div>

                                    {data.scope === 'estate' && selectedEstateName && (
                                        <div className="flex justify-between">
                                            <span>Estate</span>
                                            <span className="font-bold text-[#F2F3F6] truncate max-w-[150px]">
                                                {selectedEstateName}
                                            </span>
                                        </div>
                                    )}

                                    {data.scope === 'resident' && selectedResidents.length > 0 && (
                                        <div className="flex justify-between">
                                            <span>Residents</span>
                                            <span className="font-bold text-[#F2F3F6]">
                                                {selectedResidents.length} Selected
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Lifespan</span>
                                        <span className="font-bold text-[#F2F3F6]">
                                            {hasExpiry && data.expires_at ? data.expires_at : 'Permanent'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Usage Limit</span>
                                        <span className="font-bold text-[#F2F3F6]">
                                            {hasLimit && data.usage_limit ? `${data.usage_limit} uses` : 'Unlimited'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Plans Constraints</span>
                                        <span className="font-bold text-[#F2F3F6] truncate max-w-[150px]">
                                            {data.eligible_plans.length === 0
                                                ? 'All Plans'
                                                : `${data.eligible_plans.length} plan(s)`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-[#F2F3F6]">Select Target Estate</h3>
                                    <p className="mt-0.5 text-xs text-[#9297A8]">
                                        Choose which estate this coupon code applies to.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEstateModalOpen(false);
                                        setEstateQuery('');
                                    }}
                                    className="cursor-pointer rounded-lg p-1.5 text-[#9297A8] transition hover:bg-gray-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative mb-4 flex overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD] transition-all">
                                <span className="flex items-center pl-4 text-slate-400">
                                    <Search className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    value={estateQuery}
                                    onChange={(e) => setEstateQuery(e.target.value)}
                                    placeholder="Search by estate name..."
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-[#F2F3F6] placeholder:text-gray-600 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                {filteredEstates.length === 0 ? (
                                    <div className="py-8 text-center text-[#9297A8]">
                                        <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-700" />
                                        <p className="text-sm font-bold text-[#F2F3F6]">No estates found</p>
                                        <p className="mt-0.5 text-xs">Try a different search term.</p>
                                    </div>
                                ) : (
                                    filteredEstates.map((estate) => (
                                        <div
                                            key={estate.id}
                                            onClick={() => {
                                                selectEstate(estate);
                                                setIsEstateModalOpen(false);
                                            }}
                                            className="group flex cursor-pointer items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] p-3.5 transition hover:border-[#6C5DFD] hover:bg-[#6C5DFD]/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C5DFD]/10 text-[#6C5DFD]">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-[#F2F3F6] transition-colors group-hover:text-[#6C5DFD]">
                                                    {estate.name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-[#6C5DFD] transition-colors">
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
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-[#F2F3F6]">Select Target Resident</h3>
                                    <p className="mt-0.5 text-xs text-[#9297A8]">
                                        Choose which resident account this coupon applies to.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResidentModalOpen(false);
                                        setResidentQuery('');
                                    }}
                                    className="cursor-pointer rounded-lg p-1.5 text-[#9297A8] transition hover:bg-gray-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative mb-4 flex overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] focus-within:border-[#6C5DFD] focus-within:ring-1 focus-within:ring-[#6C5DFD] transition-all">
                                <span className="flex items-center pl-4 text-slate-400">
                                    <Search className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    value={residentQuery}
                                    onChange={(e) => setResidentQuery(e.target.value)}
                                    placeholder="Search by resident name or email..."
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-[#F2F3F6] placeholder:text-gray-600 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                {isSearchingResidents ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((n) => (
                                            <div
                                                key={n}
                                                className="flex animate-pulse items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] p-3.5 bg-[#0A0B10]"
                                            >
                                                <div className="h-9 w-9 rounded-lg bg-gray-800" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-24 rounded bg-gray-800" />
                                                    <div className="h-3 w-36 rounded bg-gray-800" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : modalResidents.length === 0 ? (
                                    <div className="py-8 text-center text-[#9297A8]">
                                        <User className="mx-auto mb-2 h-8 w-8 text-gray-700" />
                                        <p className="text-sm font-bold text-[#F2F3F6]">No residents found</p>
                                        <p className="mt-0.5 text-xs text-[#9297A8]">Try a different search term.</p>
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
                                                        ? 'border-[#6C5DFD] bg-[#6C5DFD]/5'
                                                        : 'border-[rgba(255,255,255,0.08)] hover:border-[#6C5DFD] hover:bg-[#6C5DFD]/5 bg-[#0A0B10]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                                                            isSelected
                                                                ? 'bg-[#6C5DFD] text-white'
                                                                : 'bg-[#6C5DFD]/10 text-[#6C5DFD]'
                                                        }`}
                                                    >
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-[#F2F3F6] transition-colors group-hover:text-[#6C5DFD]">
                                                            {resident.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs text-[#9297A8]">{resident.email}</span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#6C5DFD]' : 'text-[#6C5DFD]/80'}`}
                                                >
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.08)] pt-4 mt-4">
                                <span className="text-xs text-[#9297A8]">{selectedResidents.length} resident(s) selected</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResidentModalOpen(false);
                                        setResidentQuery('');
                                    }}
                                    className="cursor-pointer rounded-xl bg-[#6C5DFD] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#6C5DFD]/90"
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
