import { Head, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import {
    InboxIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
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

            <div className="relative mx-auto max-w-7xl px-4 py-8 text-[#F2F3F6] space-y-8">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">ACQUISITION FUNNEL</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-[#F2F3F6]">
                        Strategic <span className="font-light text-[#9297A8]">Acquisitions</span>
                    </h1>
                    <p className="text-sm text-[#9297A8] mt-2">Review, approve, or request further information on partner-submitted estates.</p>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="flex flex-wrap items-center gap-1.5 border-b border-[rgba(255,255,255,0.06)] pb-4"
                >
                    <button
                        onClick={() => router.get('/zeus/partner-requests', {}, { preserveState: true })}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                            !filters.status
                                ? 'bg-[#6C5DFD] text-white shadow-sm'
                                : 'bg-[#12141C] text-[#9297A8] hover:text-[#F2F3F6]'
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
                                    ? 'bg-[#6C5DFD] text-white shadow-sm'
                                    : 'bg-[#12141C] text-[#9297A8] hover:text-[#F2F3F6]'
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
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#12141C] border-b border-[rgba(255,255,255,0.08)] text-xs font-semibold uppercase tracking-wider text-[#9297A8]">
                                <tr>
                                    <th className="px-6 py-4">Proposed Estate</th>
                                    <th className="px-6 py-4">Partner Agent</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                {partnerRequests.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-[#9297A8]">
                                            <InboxIcon className="mx-auto h-12 w-12 text-gray-700 mb-4" />
                                            <p className="font-semibold text-[#F2F3F6]">No partner requests found</p>
                                            <p className="text-xs text-gray-550 mt-1">Acquisition proposals from portal members will appear here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    partnerRequests.data.map((request) => (
                                        <tr key={request.id} className="hover:bg-[#12141C]/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-bold text-[#F2F3F6] text-[14px]">{request.estate_name}</p>
                                                    <p className="text-[#9297A8] text-xs mt-0.5">
                                                        {request.chairman_name} · {request.chairman_phone}
                                                    </p>
                                                    <p className="text-gray-550 text-[11px] mt-1">
                                                        {request.state}, {request.lga} · {request.number_of_houses || 0} Houses
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-bold text-[#F2F3F6] text-xs">{request.partner?.name}</p>
                                                    <p className="text-[#9297A8] text-[10px] mt-0.5">
                                                        Commission: {request.partner?.commission_rate}%
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                                                        request.status === 'approved' || request.status === 'estate_created'
                                                            ? 'bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20'
                                                            : request.status === 'rejected'
                                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                            : request.status === 'info_requested'
                                                            ? 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20'
                                                            : 'bg-[#6C5DFD]/10 text-[#6C5DFD] border border-[#6C5DFD]/20'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        request.status === 'approved' || request.status === 'estate_created'
                                                            ? 'bg-[#34D399]'
                                                            : request.status === 'rejected'
                                                            ? 'bg-rose-500'
                                                            : request.status === 'info_requested'
                                                            ? 'bg-[#F5A623]'
                                                            : 'bg-[#6C5DFD]'
                                                    }`} />
                                                    {request.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!request.estate && ['submitted', 'reviewing', 'info_requested'].includes(request.status) && (
                                                        <button
                                                            onClick={() => approve(request.id)}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#34D399] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#34D399]/90 transition-colors active:scale-95 animate-pulse"
                                                        >
                                                            <CheckCircleIcon className="h-4 w-4" />
                                                            Approve
                                                        </button>
                                                    )}
                                                    {request.status !== 'rejected' && request.status !== 'estate_created' && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal(request, 'info')}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 py-2 text-xs font-semibold text-[#9297A8] hover:text-[#F2F3F6] transition-colors"
                                                            >
                                                                <ExclamationTriangleIcon className="h-4 w-4 text-[#F5A623]" />
                                                                Request Info
                                                            </button>
                                                            <button
                                                                onClick={() => openModal(request, 'reject')}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-[#12141C] px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-md rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl relative text-[#F2F3F6]"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-[#9297A8] hover:text-[#F2F3F6] transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>

                            <h3 className="text-lg font-bold text-[#F2F3F6]">
                                {modalType === 'reject' ? 'Reject Acquisition' : 'Request Acquisition Info'}
                            </h3>
                            <p className="mt-1 text-sm text-[#9297A8]">{activeRequest.estate_name}</p>

                            {modalType === 'reject' ? (
                                <form onSubmit={submitReject} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#9297A8] mb-1.5">Rejection Reason</label>
                                        <textarea
                                            value={rejectForm.data.rejection_reason}
                                            onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                            placeholder="Provide a clear explanation for this rejection..."
                                            required
                                        />
                                        {rejectForm.errors.rejection_reason && (
                                            <p className="mt-1 text-xs text-rose-500">{rejectForm.errors.rejection_reason}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 py-2.5 text-xs font-semibold text-[#9297A8] hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={rejectForm.processing}
                                            className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={submitInfo} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#9297A8] mb-1.5">Info Request Message</label>
                                        <textarea
                                            value={infoForm.data.info_request_message}
                                            onChange={(e) => infoForm.setData('info_request_message', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                            placeholder="What additional document or verification detail do you need?"
                                            required
                                        />
                                        {infoForm.errors.info_request_message && (
                                            <p className="mt-1 text-xs text-rose-500">{infoForm.errors.info_request_message}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 py-2.5 text-xs font-semibold text-[#9297A8] hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={infoForm.processing}
                                            className="rounded-xl bg-[#6C5DFD] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6C5DFD]/90 transition-colors"
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