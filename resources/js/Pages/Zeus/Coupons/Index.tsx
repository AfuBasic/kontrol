import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
    Ticket, 
    Trash2, 
    Building2, 
    User, 
    Globe, 
    Calendar,
    Plus,
    X
} from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

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
}

export default function CouponsIndex({ coupons }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Platform Coupons</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Create, distribute, and track subscription-payment coupons.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/zeus/coupons/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Add Coupon
                    </Link>
                </div>
            </div>

            {/* Coupons Table List */}
            <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f1423] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Target Scope</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Expires</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
                            {coupons.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 dark:text-slate-600">
                                        <Ticket className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-600" />
                                        <p className="text-lg font-black text-slate-900 dark:text-white">No coupons found</p>
                                        <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Generate a coupon using the "Add Coupon" button above.</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.data.map(coupon => {
                                    // Determine Scope badge
                                    let scopeBadge = (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/10">
                                            <Globe className="h-3.5 w-3.5" /> Global
                                        </span>
                                    );
                                    if (coupon.estate) {
                                        scopeBadge = (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400 ring-1 ring-blue-600/10" title={coupon.estate.name}>
                                                <Building2 className="h-3.5 w-3.5" /> Estate
                                            </span>
                                        );
                                    } else if (coupon.user) {
                                        scopeBadge = (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-400 ring-1 ring-purple-600/10" title={coupon.user.name}>
                                                <User className="h-3.5 w-3.5" /> Resident
                                            </span>
                                        );
                                    }

                                    return (
                                        <tr key={coupon.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                                                {coupon.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                                                    coupon.type === 'percentage' 
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {coupon.formatted_value}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {scopeBadge}
                                                    {coupon.estate && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">{coupon.estate.name}</span>}
                                                    {coupon.user && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">{coupon.user.name}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                <span className="font-bold text-slate-800 dark:text-white">{coupon.used_count}</span>
                                                {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' (unlimited)'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                                                {coupon.expires_at ? (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" /> {coupon.expires_at}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteClick(coupon)}
                                                    className="inline-flex items-center rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
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
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/20 dark:bg-slate-800/10">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Page {coupons.current_page} of {coupons.last_page}
                        </span>
                        <div className="flex gap-2">
                            {coupons.prev_page_url && (
                                <button
                                    onClick={() => router.visit(coupons.prev_page_url!)}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f1423] px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    Previous
                                </button>
                            )}
                            {coupons.next_page_url && (
                                <button
                                    onClick={() => router.visit(coupons.next_page_url!)}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f1423] px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
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
