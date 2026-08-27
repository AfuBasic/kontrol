import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Calendar, Users, ArrowLeft, Save, Search, CheckCircle2, Check, User, ChevronDown, MapPin } from 'lucide-react';
import { useState, useMemo } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import MoneyInput from '@/Components/MoneyInput';
import AdminLayout from '@/Layouts/AdminLayout';

type Resident = {
    id: number;
    name: string;
    email: string;
    is_property_owner?: boolean;
};

type ZoneOption = {
    id: number;
    name: string;
};

type Props = {
    residents: Resident[];
    zones: ZoneOption[];
    context?: {
        is_zone_scoped?: boolean;
    };
};

export default function CreateCollection({ residents, zones = [], context }: Props) {
    const isZoneScoped = context?.is_zone_scoped ?? false;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        amount: '',
        billing_type: 'one_time',
        recurring_interval: 'monthly',
        start_date: '',
        due_at: '',
        due_day: 1,
        grace_days: 0,
        late_fee: '',
        applies_to: isZoneScoped ? 'zone' : 'all',
        targets: [] as number[],
        zones: isZoneScoped && zones[0] ? [zones[0].id] : ([] as number[]),
    });

    const [searchQuery, setSearchQuery] = useState('');

    const filteredResidents = useMemo(() => {
        return residents.filter(
            (r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.email.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [residents, searchQuery]);

    const toggleZone = (id: number) => {
        const current = [...data.zones];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setData('zones', current);
    };

    const toggleResident = (id: number) => {
        const current = [...data.targets];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setData('targets', current);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <>
            <Head title="New Collection" />

            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Collections
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">New Collection</h1>
                    <p className="mt-1 text-slate-500">Define a new due, levy, or recurring bill for residents.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    {/* Basic Information */}
                    <div className="rounded-3xl sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                                <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Basic Information</h2>
                        </div>

                        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Collection Name</label>
                                <input
                                    type="text"
                                    autoCorrect="on"
                                    autoCapitalize="sentences"
                                    spellCheck={true}
                                    autoComplete="on"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                    placeholder="e.g., Annual Security Levy"
                                    required
                                />
                                {errors.name && <p className="mt-2 text-sm font-bold text-red-500">{errors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Description</label>
                                <textarea
                                    autoCorrect="on"
                                    autoCapitalize="sentences"
                                    spellCheck={true}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                    placeholder="Briefly explain what this collection is for..."
                                />
                                {errors.description && <p className="mt-2 text-sm font-bold text-red-500">{errors.description}</p>}
                            </div>

                            <div>
                                <MoneyInput
                                    label="Amount (₦)"
                                    value={data.amount}
                                    onChange={(val) => setData('amount', val)}
                                    error={errors.amount}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Billing Type</label>
                                <div className="relative">
                                    <select
                                        value={data.billing_type}
                                        onChange={(e) => setData('billing_type', e.target.value as any)}
                                        className="block w-full appearance-none rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                    >
                                        <option value="one_time">One-time Payment</option>
                                        <option value="recurring">Recurring Bill</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-6 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule & Penalties */}
                    <div className="rounded-3xl sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Schedule & Rules</h2>
                        </div>

                        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                            {data.billing_type === 'recurring' && (
                                <div>
                                    <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Interval</label>
                                    <div className="relative">
                                        <select
                                            value={data.recurring_interval}
                                            onChange={(e) => setData('recurring_interval', e.target.value)}
                                            className="block w-full appearance-none rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-6 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Start Date</label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                    required
                                />
                                {errors.start_date && <p className="mt-2 text-sm font-bold text-red-500">{errors.start_date}</p>}
                            </div>

                            {data.billing_type === 'one_time' ? (
                                <div>
                                    <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Due Date</label>
                                    <input
                                        type="date"
                                        value={data.due_at}
                                        onChange={(e) => setData('due_at', e.target.value)}
                                        className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                        required
                                    />
                                    {errors.due_at && <p className="mt-2 text-sm font-bold text-red-500">{errors.due_at}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                        Due Day (of Month)
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={data.due_day}
                                        onChange={(e) => setData('due_day', parseInt(e.target.value))}
                                        className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                        min="1"
                                        max="28"
                                        required
                                    />
                                    {errors.due_day && <p className="mt-2 text-sm font-bold text-red-500">{errors.due_day}</p>}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                    Grace Period (Days)
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={data.grace_days}
                                    onChange={(e) => setData('grace_days', parseInt(e.target.value))}
                                    className="block w-full rounded-2xl border-0 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                    min="0"
                                />
                            </div>

                            <div>
                                <MoneyInput
                                    label="Late Fee (₦ - Optional)"
                                    value={data.late_fee}
                                    onChange={(val) => setData('late_fee', val)}
                                    error={errors.late_fee}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Targeting */}
                    <div className="rounded-3xl sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Target Audience</h2>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <select
                                    value={data.applies_to}
                                    onChange={(e) => setData('applies_to', e.target.value as any)}
                                    className="w-full sm:w-auto appearance-none rounded-xl border-0 bg-slate-100 py-2.5 pr-10 pl-4 text-xs font-black tracking-widest text-slate-600 uppercase ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1F6FDB]"
                                >
                                    {!isZoneScoped && <option value="all">Everyone</option>}
                                    {!isZoneScoped && <option value="property_owner">Property Owners</option>}
                                    <option value="zone">Specific Zones</option>
                                    <option value="target">Specific List</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {data.applies_to === 'zone' ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    {zones.length === 0 ? (
                                        <div className="rounded-3xl bg-amber-50 p-8 text-center ring-1 ring-amber-100">
                                            <p className="text-sm font-bold text-amber-800">
                                                No zones have been created yet. Add a zone first to target collections geographically.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {zones.map((zone) => {
                                                const isSelected = data.zones.includes(zone.id);
                                                return (
                                                    <button
                                                        key={zone.id}
                                                        type="button"
                                                        onClick={() => toggleZone(zone.id)}
                                                        className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                                                            isSelected
                                                                ? 'bg-white text-[#1F6FDB] shadow-sm ring-1 ring-[#1F6FDB]/30'
                                                                : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? 'bg-blue-50' : 'bg-slate-200/50'}`}
                                                            >
                                                                <MapPin className={`h-5 w-5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                                                            </div>
                                                            <p className="text-sm font-black tracking-tight">{zone.name}</p>
                                                        </div>
                                                        <div
                                                            className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                                                                isSelected
                                                                    ? 'border-[#1F6FDB] bg-[#1F6FDB] text-white'
                                                                    : 'border-slate-300 bg-white'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            ) : data.applies_to === 'target' ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative mb-6">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                                            <Search className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="block w-full rounded-2xl border-0 bg-slate-50 py-4 pr-6 pl-14 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]"
                                            placeholder="Search residents by name or email..."
                                        />
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
                                        <div className="grid gap-3">
                                            {filteredResidents.map((resident) => {
                                                const isSelected = data.targets.includes(resident.id);
                                                return (
                                                    <button
                                                        key={resident.id}
                                                        type="button"
                                                        onClick={() => toggleResident(resident.id)}
                                                        className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                                                            isSelected
                                                                ? 'bg-white text-[#1F6FDB] shadow-sm ring-1 ring-[#1F6FDB]/30'
                                                                : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? 'bg-blue-50' : 'bg-slate-200/50'}`}
                                                            >
                                                                <User className={`h-5 w-5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-black tracking-tight">{resident.name}</p>
                                                                    {resident.is_property_owner && (
                                                                        <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold tracking-wider whitespace-nowrap text-purple-700 uppercase ring-1 ring-purple-100/50">
                                                                            Property Owner
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400">{resident.email}</p>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                                <CheckCircle2 className="h-6 w-6 text-blue-500" />
                                                            </motion.div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
                                        <p className="text-xs font-bold text-slate-500">{data.targets.length} residents selected</p>
                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                            <AnimatePresence mode="popLayout">
                                                {/* Search-specific Select All */}
                                                {searchQuery &&
                                                    filteredResidents.length > 0 &&
                                                    !filteredResidents.every((r) => data.targets.includes(r.id)) && (
                                                        <motion.button
                                                            key="select-matches"
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            type="button"
                                                            onClick={() => {
                                                                const newTargets = Array.from(
                                                                    new Set([...data.targets, ...filteredResidents.map((r) => r.id)]),
                                                                );
                                                                setData('targets', newTargets);
                                                            }}
                                                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-black tracking-widest text-[#1F6FDB] uppercase transition-colors hover:bg-blue-100"
                                                        >
                                                            Select {filteredResidents.length} Matches
                                                        </motion.button>
                                                    )}

                                                {/* Global Select All */}
                                                {data.targets.length < residents.length && !searchQuery && (
                                                    <motion.button
                                                        key="select-all"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        type="button"
                                                        onClick={() =>
                                                            setData(
                                                                'targets',
                                                                residents.map((r) => r.id),
                                                            )
                                                        }
                                                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-widest text-[#1F6FDB] uppercase transition-colors hover:bg-slate-200"
                                                    >
                                                        Select All ({residents.length})
                                                    </motion.button>
                                                )}

                                                {/* Global Unselect All */}
                                                {data.targets.length > 0 && (
                                                    <motion.button
                                                        key="unselect-all"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        type="button"
                                                        onClick={() => setData('targets', [])}
                                                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-colors hover:bg-rose-100"
                                                    >
                                                        Unselect All
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="rounded-2xl sm:rounded-3xl bg-blue-50/50 p-6 sm:p-8 text-center ring-1 ring-blue-100"
                                >
                                    <p className="text-xs sm:text-sm font-bold text-blue-700">
                                        {data.applies_to === 'property_owner'
                                            ? 'This collection will apply to all current and future property owners of the estate.'
                                            : 'This collection will apply to all current and future residents of the estate.'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 sm:gap-6 pt-4">
                        <Link
                            href={index.url()}
                            className="w-full sm:w-auto text-center py-2 sm:py-0 text-sm font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl sm:rounded-[1.5rem] bg-[#1F6FDB] px-8 sm:px-12 py-4 sm:py-5 text-sm font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:bg-slate-800 hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            {processing ? 'Creating Collection...' : 'Create Collection'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateCollection.layout = (page: any) => <AdminLayout children={page} />;
