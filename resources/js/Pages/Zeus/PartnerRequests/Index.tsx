import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

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
        router.post(`/zeus/partner-requests/${id}/approve`, {}, { preserveScroll: true });
    };

    const submitReject = () => {
        if (!activeRequest) return;
        rejectForm.post(`/zeus/partner-requests/${activeRequest.id}/reject`, {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const submitInfo = () => {
        if (!activeRequest) return;
        infoForm.post(`/zeus/partner-requests/${activeRequest.id}/request-info`, {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    return (
        <ZeusLayout>
            <Head title="Partner Requests - Zeus" />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Partner Requests</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review and process partner-submitted estate acquisitions.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => router.get('/zeus/partner-requests', {}, { preserveState: true })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${!filters.status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                        All
                    </button>
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => router.get('/zeus/partner-requests', { status: option.value }, { preserveState: true })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${filters.status === option.value ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-[#0f1423]/80">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                                <th className="px-6 py-3 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate</th>
                                <th className="px-6 py-3 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Partner</th>
                                <th className="px-6 py-3 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {partnerRequests.data.map((request) => (
                                <tr key={request.id}>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-white">{request.estate_name}</p>
                                        <p className="text-xs text-slate-500">{request.chairman_name} · {request.chairman_email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {request.partner?.name}
                                        <span className="block text-xs text-slate-400">{request.partner?.commission_rate}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-violet-700 uppercase dark:bg-violet-500/10 dark:text-violet-300">
                                            {request.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {!request.estate && ['submitted', 'reviewing', 'info_requested'].includes(request.status) && (
                                                <button
                                                    onClick={() => approve(request.id)}
                                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {request.status !== 'rejected' && request.status !== 'estate_created' && (
                                                <>
                                                    <button
                                                        onClick={() => openModal(request, 'info')}
                                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                                    >
                                                        Request Info
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(request, 'reject')}
                                                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:border-rose-500/30 dark:text-rose-400"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {activeRequest && modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {modalType === 'reject' ? 'Reject Partner Request' : 'Request More Info'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{activeRequest.estate_name}</p>

                        {modalType === 'reject' ? (
                            <div className="mt-4">
                                <textarea
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="Reason for rejection..."
                                />
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                    <button onClick={submitReject} disabled={rejectForm.processing} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <textarea
                                    value={infoForm.data.info_request_message}
                                    onChange={(e) => infoForm.setData('info_request_message', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="What additional information do you need?"
                                />
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                    <button onClick={submitInfo} disabled={infoForm.processing} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ZeusLayout>
    );
}