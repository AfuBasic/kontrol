import { Head, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
    TicketIcon, 
    TrashIcon, 
    SparklesIcon, 
    BuildingOfficeIcon, 
    UserIcon, 
    GlobeAltIcon, 
    CalendarIcon, 
    ListBulletIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Estate {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Coupon {
    id: number;
    code: string;
    estate: { id: number; name: string } | null;
    user: { id: number; name: string; email: string } | null;
    type: 'percentage' | 'fixed';
    value: number;
    formatted_value: string;
    expires_at: string | null;
    usage_limit: number | null;
    used_count: number;
}

interface PaginatedCoupons {
    data: Coupon[];
    links: any[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    coupons: PaginatedCoupons;
    estates: Estate[];
    residents: User[];
}

export default function CouponsIndex({ coupons, estates, residents }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        type: 'percentage',
        value: '',
        scope: 'global',
        estate_id: '',
        user_id: '',
        expires_at: '',
        usage_limit: '',
    });

    function generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'ZEU-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('code', code);
    }

    function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/coupons', {
            onSuccess: () => {
                reset();
                setIsCreateOpen(false);
            },
        });
    }

    function handleDeleteClick(coupon: Coupon) {
        setSelectedCoupon(coupon);
        setDeleteModalOpen(true);
    }

    function handleDeleteConfirm() {
        if (!selectedCoupon) return;
        setIsDeleting(true);
        router.delete(`/zeus/coupons/${selectedCoupon.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setSelectedCoupon(null);
            },
        });
    }

    return (
        <ZeusLayout>
            <Head title="Coupons Management" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-8 flex items-end justify-between gap-6"
            >
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Billing System</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Platform <span className="font-light text-slate-400">Coupons</span>
                    </h1>
                </div>
                <button
                    onClick={() => {
                        reset();
                        setIsCreateOpen(!isCreateOpen);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95 cursor-pointer"
                >
                    {isCreateOpen ? 'Cancel' : 'New Coupon'}
                </button>
            </motion.div>

            {/* Create Coupon Form Panel */}
            <AnimatePresence>
                {isCreateOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                                Create a Subscription Coupon
                            </h3>
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Code Input */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Coupon Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={data.code}
                                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                                placeholder="ZEU-SUMMER"
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateRandomCode}
                                                className="rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                                            >
                                                Auto
                                            </button>
                                        </div>
                                        {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
                                    </div>

                                    {/* Type Selector */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Discount Type</label>
                                        <select
                                            value={data.type}
                                            onChange={e => setData('type', e.target.value as 'percentage' | 'fixed')}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₦)</option>
                                        </select>
                                        {errors.type && <p className="text-xs text-rose-500 mt-1">{errors.type}</p>}
                                    </div>

                                    {/* Discount Value */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                            Discount Value {data.type === 'percentage' ? '(%)' : '(₦)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.value}
                                            onChange={e => setData('value', e.target.value)}
                                            placeholder={data.type === 'percentage' ? '15' : '500'}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.value && <p className="text-xs text-rose-500 mt-1">{errors.value}</p>}
                                    </div>

                                    {/* Expiration Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expires At (Optional)</label>
                                        <input
                                            type="date"
                                            value={data.expires_at}
                                            onChange={e => setData('expires_at', e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.expires_at && <p className="text-xs text-rose-500 mt-1">{errors.expires_at}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Scope Selector */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Scope</label>
                                        <select
                                            value={data.scope}
                                            onChange={e => {
                                                setData(d => ({
                                                    ...d,
                                                    scope: e.target.value,
                                                    estate_id: '',
                                                    user_id: ''
                                                }));
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="global">Global (All Residents)</option>
                                            <option value="estate">Estate Level (Specific Estate)</option>
                                            <option value="resident">Resident Level (Specific Resident)</option>
                                        </select>
                                        {errors.scope && <p className="text-xs text-rose-500 mt-1">{errors.scope}</p>}
                                    </div>

                                    {/* Estate selector - show if scope === estate */}
                                    {data.scope === 'estate' && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Estate</label>
                                            <select
                                                value={data.estate_id}
                                                onChange={e => setData('estate_id', e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Select Target Estate...</option>
                                                {estates.map(estate => (
                                                    <option key={estate.id} value={estate.id}>{estate.name}</option>
                                                ))}
                                            </select>
                                            {errors.estate_id && <p className="text-xs text-rose-500 mt-1">{errors.estate_id}</p>}
                                        </div>
                                    )}

                                    {/* Resident selector - show if scope === resident */}
                                    {data.scope === 'resident' && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Resident</label>
                                            <select
                                                value={data.user_id}
                                                onChange={e => setData('user_id', e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Select Target Resident...</option>
                                                {residents.map(resident => (
                                                    <option key={resident.id} value={resident.id}>{resident.name} ({resident.email})</option>
                                                ))}
                                            </select>
                                            {errors.user_id && <p className="text-xs text-rose-500 mt-1">{errors.user_id}</p>}
                                        </div>
                                    )}

                                    {/* Usage Limit */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usage Limit (Optional)</label>
                                        <input
                                            type="number"
                                            value={data.usage_limit}
                                            onChange={e => setData('usage_limit', e.target.value)}
                                            placeholder="100"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.usage_limit && <p className="text-xs text-rose-500 mt-1">{errors.usage_limit}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition cursor-pointer"
                                    >
                                        {processing ? 'Saving...' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coupons List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <ListBulletIcon className="h-5 w-5 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">All Active Coupons</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3.5">Code</th>
                                <th className="px-6 py-3.5">Discount</th>
                                <th className="px-6 py-3.5">Target Scope</th>
                                <th className="px-6 py-3.5">Usage</th>
                                <th className="px-6 py-3.5">Expires</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {coupons.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <TicketIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                        <p className="font-semibold">No coupons found</p>
                                        <p className="text-xs">Generate a coupon using the "New Coupon" button above.</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.data.map(coupon => {
                                    // Determine Scope badge
                                    let scopeBadge = (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                                            <GlobeAltIcon className="h-3 w-3" /> Global
                                        </span>
                                    );
                                    if (coupon.estate) {
                                        scopeBadge = (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/10" title={coupon.estate.name}>
                                                <BuildingOfficeIcon className="h-3 w-3" /> Estate
                                            </span>
                                        );
                                    } else if (coupon.user) {
                                        scopeBadge = (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-600/10" title={coupon.user.name}>
                                                <UserIcon className="h-3 w-3" /> Resident
                                            </span>
                                        );
                                    }

                                    return (
                                        <tr key={coupon.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 tracking-wider">
                                                {coupon.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                                                    coupon.type === 'percentage' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                    {coupon.formatted_value}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {scopeBadge}
                                                    {coupon.estate && <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{coupon.estate.name}</span>}
                                                    {coupon.user && <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{coupon.user.name}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <span className="font-semibold text-slate-800">{coupon.used_count}</span>
                                                {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' (unlimited)'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {coupon.expires_at ? (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon className="h-4 w-4" /> {coupon.expires_at}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteClick(coupon)}
                                                    className="inline-flex items-center rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                                >
                                                    <TrashIcon className="h-4.5 w-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Pagination */}
                {coupons.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/20">
                        <span className="text-xs text-slate-500 font-medium">
                            Page {coupons.current_page} of {coupons.last_page}
                        </span>
                        <div className="flex gap-2">
                            {coupons.prev_page_url && (
                                <button
                                    onClick={() => router.visit(coupons.prev_page_url!)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Previous
                                </button>
                            )}
                            {coupons.next_page_url && (
                                <button
                                    onClick={() => router.visit(coupons.next_page_url!)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Coupon"
                message={`Are you sure you want to permanently delete coupon "${selectedCoupon?.code}"? This action cannot be undone.`}
                confirmText={isDeleting ? 'Deleting...' : 'Delete Coupon'}
                cancelText="Cancel"
                isDanger={true}
            />
        </ZeusLayout>
    );
}
