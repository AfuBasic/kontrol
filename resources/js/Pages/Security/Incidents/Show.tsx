import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    Lock,
    MapPin,
    MessageSquare,
    Send,
    Trash2,
    Wrench,
    X,
    ZoomIn,
} from 'lucide-react';
import React, { useState } from 'react';

import Modal from '@/Components/Modal';
import SecurityLayout from '@/Layouts/SecurityLayout';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incident: Incident;
    comments: PaginatedData<IncidentComment>;
};

const statusSteps: Array<{ key: IncidentStatus; label: string; desc: string }> = [
    { key: 'pending', label: 'Pending', desc: 'Awaiting review' },
    { key: 'acknowledged', label: 'Acknowledged', desc: 'Received & logged' },
    { key: 'resolving', label: 'Resolving', desc: 'Work is active' },
    { key: 'solved', label: 'Solved', desc: 'Proposed solved' },
    { key: 'closed', label: 'Closed', desc: 'Case closed' },
];

const getStatusStyles = (status: IncidentStatus) => {
    switch (status) {
        case 'pending':
            return { bg: 'bg-amber-500', text: 'text-amber-700', icon: <Clock className="h-4 w-4 text-white" /> };
        case 'acknowledged':
            return { bg: 'bg-blue-500', text: 'text-blue-700', icon: <Eye className="h-4 w-4 text-white" /> };
        case 'resolving':
            return { bg: 'bg-indigo-500', text: 'text-indigo-700', icon: <Wrench className="h-4 w-4 text-white" /> };
        case 'solved':
            return { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: <CheckCircle2 className="h-4 w-4 text-white" /> };
        case 'closed':
            return { bg: 'bg-slate-500', text: 'text-slate-700', icon: <CheckCircle2 className="h-4 w-4 text-white" /> };
        default:
            return { bg: 'bg-slate-500', text: 'text-slate-700', icon: <Clock className="h-4 w-4 text-white" /> };
    }
};

export default function Show({ incident, comments }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const isReporter = incident.reporter.id === authUser?.id;
    const reporterName = isReporter ? 'you' : incident.reporter?.name || 'Deleted User';

    const currentStatusIdx = statusSteps.findIndex((s) => s.key === incident.status);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
            router.delete(`/security/incidents/${incident.hashid}`);
        }
    };

    const statusStyle = getStatusStyles(incident.status);
    const categoryLabel = typeof incident.category === 'object' ? incident.category.label : incident.category;

    return (
        <>
            <Head title={`Incident Details — ${incident.title}`} />

            <div className="flex flex-col gap-5">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/security/incidents"
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Workspace
                    </Link>

                    {isReporter && incident.status === 'pending' && (
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Report
                        </button>
                    )}
                </div>

                {/* Primary Card details */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-500">
                            {categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-500">
                            Priority: {incident.priority}
                        </span>
                        {incident.is_private && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 border border-rose-200/50 px-1.5 py-0.5 text-[8px] font-black uppercase text-rose-700">
                                <Lock className="h-2 w-2" />
                                Internal
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-base font-black leading-snug text-slate-900">{incident.title}</h1>
                        <p className="mt-2 text-[11.5px] font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {incident.body}
                        </p>
                    </div>

                    {incident.location && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{incident.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400">
                        <span>Reported by {reporterName}</span>
                        <span>•</span>
                        <span>{format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Resolution Pipeline</h2>
                    <div className="relative pl-6 space-y-5 border-l border-slate-100 ml-2.5">
                        {statusSteps.map((step, idx) => {
                            const isCurrent = step.key === incident.status;
                            const isPast = idx <= currentStatusIdx;

                            return (
                                <div key={step.key} className="relative">
                                    <span
                                        className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                                            isCurrent
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                                : isPast
                                                  ? 'bg-slate-200 border-slate-200 text-slate-500'
                                                  : 'bg-white border-slate-200 text-slate-350'
                                        }`}
                                    >
                                        {isPast && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {step.label}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                                            {step.desc}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Evidence Attachment */}
                {incident.attachment_url && (
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Evidence File</h2>
                        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            {incident.attachment_type === 'video' ? (
                                <video src={incident.attachment_url} className="w-full max-h-56 object-cover" controls />
                            ) : (
                                <div className="group relative cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                                    <img src={incident.attachment_url} alt="Attachment" className="w-full max-h-56 object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            {incident.attachment_url && incident.attachment_type !== 'video' && (
                <Modal isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} maxWidth="2xl">
                    <div className="relative p-2 bg-slate-950 flex flex-col items-center">
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-950 transition z-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img src={incident.attachment_url} alt="Full evidence view" className="max-h-[80vh] w-auto object-contain rounded-lg mt-10" />
                    </div>
                </Modal>
            )}
        </>
    );
}
