import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowLeft, Mail, Phone, Calendar, Search, MapPin, Loader2, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    index as approvalIndex,
    approve as approvalApprove,
    reject as approvalReject,
} from '@/actions/App/Http/Controllers/Admin/ResidentApprovalController';
import { index as residentsIndex } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import ConfirmationModal from '@/Components/ConfirmationModal';

interface Resident {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    status: 'pending';
    created_at_human: string;
}

interface PaginatedResidents {
    data: Resident[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    current_page: number;
    total: number;
}

interface Props {
    residents: PaginatedResidents;
    filters: {
        search?: string;
    };
}

export default function ApprovalsIndex({ residents, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        residentId: number | null;
        residentName: string;
    }>({
        isOpen: false,
        type: 'approve',
        residentId: null,
        residentName: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(approvalIndex.url(), { search }, { preserveState: true });
    };

    const loadMore = () => {
        if (residents.next_page_url && !isLoadingMore) {
            setIsLoadingMore(true);
            router.get(
                residents.next_page_url,
                {},
                {
                    preserveScroll: true,
                    only: ['residents'],
                    // @ts-expect-error - merge is a new Inertia v2 feature
                    merge: true,
                    onFinish: () => setIsLoadingMore(false),
                },
            );
        }
    };

    const handleApprove = (resident: Resident) => {
        setModalConfig({
            isOpen: true,
            type: 'approve',
            residentId: resident.id,
            residentName: resident.name,
        });
    };

    const handleReject = (resident: Resident) => {
        setModalConfig({
            isOpen: true,
            type: 'reject',
            residentId: resident.id,
            residentName: resident.name,
        });
    };

    const confirmAction = () => {
        if (!modalConfig.residentId) return;

        const id = modalConfig.residentId;
        const action = modalConfig.type === 'approve' ? approvalApprove : approvalReject;

        setProcessingId(id);
        setModalConfig((prev) => ({ ...prev, isOpen: false }));

        router.post(
            action.url({ id }),
            {},
            {
                onFinish: () => setProcessingId(null),
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Pending Residents" />

            <div className="mb-8 flex items-start gap-4">
                <Link
                    href={residentsIndex.url()}
                    className="mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-900">Pending Resident Applications</h1>
                    <p className="mt-2 text-sm leading-relaxed font-medium text-slate-500">
                        Review and approve residents who signed up via the invite link.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 transition-all outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                </form>
            </div>

            {/* Responsive List Container */}
            <div className="space-y-4">
                {residents.data.length > 0 ? (
                    <>
                        {/* Mobile Card List (Hidden on Desktop) */}
                        <div className="flex flex-col gap-4 sm:hidden">
                            <AnimatePresence mode="popLayout">
                                {residents.data.map((resident) => (
                                    <motion.div
                                        layout
                                        key={resident.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm active:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-black text-blue-600 shadow-inner">
                                                    {resident.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black tracking-tight text-slate-900">{resident.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        <MapPin className="h-3 w-3" />
                                                        {resident.unit_number || 'Unit Pending'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-300 uppercase">{resident.created_at_human}</div>
                                        </div>

                                        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                {resident.email}
                                            </div>
                                            {resident.phone && (
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {resident.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-5 flex items-center gap-3">
                                            <button
                                                onClick={() => handleReject(resident)}
                                                disabled={processingId === resident.id}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 py-3.5 text-sm font-bold text-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <X className="h-4 w-4" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(resident)}
                                                disabled={processingId === resident.id}
                                                className="flex flex-2 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {processingId === resident.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                Approve
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Table (Hidden on Mobile) */}
                        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:block">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Resident Details
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Contact Info</th>
                                        <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Submitted</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <AnimatePresence mode="popLayout">
                                        {residents.data.map((resident) => (
                                            <motion.tr
                                                layout
                                                key={resident.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                                                            {resident.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{resident.name}</div>
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                                <MapPin className="h-3 w-3" />
                                                                {resident.unit_number || 'Unit Pending'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                            <Mail className="h-4 w-4 text-slate-400" />
                                                            {resident.email}
                                                        </div>
                                                        {resident.phone && (
                                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                                <Phone className="h-4 w-4 text-slate-400" />
                                                                {resident.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                        <Calendar className="h-4 w-4 text-slate-300" />
                                                        {resident.created_at_human}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                                    <div className="flex justify-end gap-2.5">
                                                        <button
                                                            onClick={() => handleReject(resident)}
                                                            disabled={processingId === resident.id}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 shadow-sm transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(resident)}
                                                            disabled={processingId === resident.id}
                                                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                                                        >
                                                            {processingId === resident.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="h-4 w-4" />
                                                            )}
                                                            Approve
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Strategy: Load More for Mobile, Traditional for Desktop */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-6 pb-12">
                            {residents.next_page_url ? (
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black tracking-tight text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 sm:hidden"
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            Load More Applications
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                residents.total > 0 && (
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase sm:hidden">All applications loaded</p>
                                )
                            )}

                            {/* Desktop Pagination */}
                            <div className="hidden w-full items-center justify-between sm:flex">
                                <p className="text-sm font-bold text-slate-500">
                                    Showing <span className="text-slate-900">{residents.data.length}</span> of{' '}
                                    <span className="text-slate-900">{residents.total}</span> entries
                                </p>
                                <div className="flex gap-2">
                                    {residents.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                                                link.active
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : link.url
                                                      ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                                      : 'cursor-not-allowed text-slate-400 opacity-30'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 transition-transform active:scale-95">
                            <Check className="h-10 w-10 text-slate-300" />
                            <div className="animate-spin-slow absolute -inset-2 rounded-full border-2 border-dashed border-slate-100" />
                        </div>
                        <h3 className="mt-8 text-xl font-black tracking-tight text-slate-900">No pending applications</h3>
                        <p className="mt-2 text-slate-500">All resident signups have been processed.</p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-6 text-sm font-bold text-blue-600 underline underline-offset-4 hover:text-blue-700"
                            >
                                Clear Search Results
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmAction}
                title={modalConfig.type === 'approve' ? 'Approve Resident' : 'Reject Application'}
                message={
                    modalConfig.type === 'approve'
                        ? `Are you sure you want to approve ${modalConfig.residentName}? They will be granted access to the estate portal immediately.`
                        : `Are you sure you want to reject ${modalConfig.residentName}'s application? This action cannot be undone and they will need to apply again.`
                }
                confirmLabel={modalConfig.type === 'approve' ? 'Approve' : 'Reject'}
                type={modalConfig.type === 'approve' ? 'info' : 'danger'}
                isLoading={processingId !== null}
            />
        </AdminLayout>
    );
}
