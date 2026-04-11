import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowLeft, Mail, Phone, Calendar, Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { index as approvalIndex, approve as approvalApprove, reject as approvalReject } from '@/actions/App/Http/Controllers/Admin/ResidentApprovalController';
import { index as residentsIndex } from '@/actions/App/Http/Controllers/Admin/ResidentController';

// Wayfinder actions are used for routing

interface Resident {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    status: 'pending';
    created_at: string;
}

interface PaginatedResidents {
    data: Resident[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(approvalIndex.url(), { search }, { preserveState: true });
    };

    const handleApprove = (id: number) => {
        if (!confirm('Are you sure you want to approve this resident?')) return;
        setProcessingId(id);
        router.post(approvalApprove.url({ id }), {}, {
            onFinish: () => setProcessingId(null),
        });
    };

    const handleReject = (id: number) => {
        if (!confirm('Are you sure you want to reject this application? This will permanently remove the request.')) return;
        setProcessingId(id);
        router.post(approvalReject.url({ id }), {}, {
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <AdminLayout>
            <Head title="Pending Residents" />

            <div className="mb-8 flex items-center gap-4">
                <Link
                    href={residentsIndex.url()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Pending Resident Applications</h1>
                    <p className="mt-1 text-gray-500">Review and approve residents who signed up via the invite link.</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                </form>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {residents.data.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Resident Details</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence mode="popLayout">
                                {residents.data.map((resident) => (
                                    <motion.tr
                                        layout
                                        key={resident.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold">
                                                    {resident.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{resident.name}</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                                                        <MapPin className="h-3 w-3" />
                                                        {resident.unit_number || 'Unit not specified'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {resident.email}
                                                </div>
                                                {resident.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        {resident.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {resident.created_at}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleReject(resident.id)}
                                                    disabled={processingId === resident.id}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-xs hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                                                    title="Reject Application"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(resident.id)}
                                                    disabled={processingId === resident.id}
                                                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Approve
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                            <Check className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No pending applications</h3>
                        <p className="mt-1 text-gray-500">All resident signups have been processed.</p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {residents.total > 15 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {residents.data.length} of {residents.total} applications
                    </p>
                    <div className="flex gap-2">
                        {residents.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'bg-primary-600 text-white'
                                        : link.url
                                            ? 'bg-white text-gray-600 shadow-xs ring-1 ring-gray-200 hover:bg-gray-50'
                                            : 'cursor-not-allowed opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
