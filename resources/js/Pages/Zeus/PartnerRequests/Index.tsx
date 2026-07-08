import { Head, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import {
    InboxIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentListIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface PartnerRequest {
    id: number;
    estate_name: string;
    chairman_name: string;
    chairman_email: string;
    chairman_phone: string;
    status: string;
    number_of_houses: number | null;
    state: string | null;
    lga: string | null;
    notes: string | null;
    rejection_reason: string | null;
    info_request_message: string | null;
    created_at: string;
    partner?: { id: number; name: string; email: string; commission_rate: string };
    estate?: { id: number; ulid: string; name: string } | null;
}

interface Props {
    partnerRequests: {
        data: PartnerRequest[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status: string };
    statusOptions: { value: string; label: string }[];
}

export default function PartnerRequestsIndex({ partnerRequests, filters, statusOptions }: Props) {
    const [activeRequest, setActiveRequest] = useState<PartnerRequest | null>(null);
    const [modalType, setModalType] = useState<'reject' | 'info' | null>(null);

    const rejectForm = useForm({ rejection_reason: '' });
    const infoForm = useForm({ info_request_message: '' });

    const openModal = (request: PartnerRequest, type: 'reject' | 'info') => {
        setActiveRequest(request);
        setModalType(type);
        rejectForm.reset();
        infoForm.reset();
    };

    const closeModal = () => {
        setActiveRequest(null);
        setModalType(null);
    };

    const approve = (id: number) => {
        if (confirm('Are you sure you want to approve this request and create the estate?')) {
            router.post(`/zeus/partner-requests/${id}/approve`, {}, { preserveScroll: true });
        }
    };

    const submitReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;
        rejectForm.post(`/zeus/partner-requests/${activeRequest.id}/reject`, {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const submitInfo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;
        infoForm.post(`/zeus/partner-requests/${activeRequest.id}/request-info`, {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    return (
        <ZeusLayout>
            <Head title="Partner Requests - Zeus" />

            <div className="space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-1.5 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
                        <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Strategic Acquisition</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">
                        Strategic <span className="font-light text-gray-500">Acquisitions</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Review, approve, or request further information on partner-submitted estates.</p>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-4"
                >
                    <button
                        onClick={() => router.get('/zeus/partner-requests', {}, { preserveState: true })}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                            !filters.status
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All Requests
                    </button>
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => router.get('/zeus/partner-requests', { status: option.value }, { preserveState: true })}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide capitalize transition-all ${
                                filters.status === option.value
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </motion.div>

                {/* Requests Table Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 text-left">Proposed Estate</th>
                                    <th className="px-6 py-4 text-left">Partner Agent</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partnerRequests.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                                            <InboxIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                            <p className="font-medium">No partner requests found</p>
                                            <p className="text-xs text-gray-400 mt-1">Requests submitted by partner portal members will appear here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    partnerRequests.data.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-[14px]">{request.estate_name}</p>
                                                    <p className="text-gray-500 text-xs mt-0.5">
                                                        {request.chairman_name} · {request.chairman_phone}
                                                    </p>
                                                    <p className="text-gray-400 text-[11px] mt-1">
                                                        {request.state}, {request.lga} · {request.number_of_houses || 0} Houses
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">{request.partner?.name}</p>
                                                    <p className="text-gray-400 text-[10px] mt-0.5">
                                                        Commission: {request.partner?.commission_rate}%
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        request.status === 'approved' || request.status === 'estate_created'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : request.status === 'rejected'
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : request.status === 'info_requested'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-indigo-50 text-indigo-700'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        request.status === 'approved' || request.status === 'estate_created'
                                                            ? 'bg-emerald-500'
                                                            : request.status === 'rejected'
                                                            ? 'bg-rose-500'
                                                            : request.status === 'info_requested'
                                                            ? 'bg-amber-500'
                                                            : 'bg-indigo-500'
                                                    }`} />
                                                    {request.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!request.estate && ['submitted', 'reviewing', 'info_requested'].includes(request.status) && (
                                                        <button
                                                            onClick={() => approve(request.id)}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors active:scale-95"
                                                        >
                                                            <CheckCircleIcon className="h-4 w-4" />
                                                            Approve
                                                        </button>
                                                    )}
                                                    {request.status !== 'rejected' && request.status !== 'estate_created' && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal(request, 'info')}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-250 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-95"
                                                            >
                                                                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                                                                Request Info
                                                            </button>
                                                            <button
                                                                onClick={() => openModal(request, 'reject')}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors active:scale-95"
                                                            >
                                                                <XCircleIcon className="h-4 w-4 text-rose-500" />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Modals Panel */}
            <AnimatePresence>
                {activeRequest && modalType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>

                            <h3 className="text-lg font-bold text-gray-900">
                                {modalType === 'reject' ? 'Reject Acquisition' : 'Request Acquisition Info'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">{activeRequest.estate_name}</p>

                            {modalType === 'reject' ? (
                                <form onSubmit={submitReject} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rejection Reason</label>
                                        <textarea
                                            value={rejectForm.data.rejection_reason}
                                            onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Provide a clear explanation for this rejection..."
                                            required
                                        />
                                        {rejectForm.errors.rejection_reason && (
                                            <p className="mt-1 text-xs text-rose-600">{rejectForm.errors.rejection_reason}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={rejectForm.processing}
                                            className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors disabled:opacity-60"
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={submitInfo} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Info Request Message</label>
                                        <textarea
                                            value={infoForm.data.info_request_message}
                                            onChange={(e) => infoForm.setData('info_request_message', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            placeholder="What additional document or verification detail do you need?"
                                            required
                                        />
                                        {infoForm.errors.info_request_message && (
                                            <p className="mt-1 text-xs text-rose-600">{infoForm.errors.info_request_message}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={infoForm.processing}
                                            className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-60"
                                        >
                                            Send Request
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ZeusLayout>
    );
}