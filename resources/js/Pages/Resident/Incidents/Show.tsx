import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    Globe,
    Lock,
    MapPin,
    MessageSquare,
    Paperclip,
    Shield,
    ThumbsUp,
    Trash2,
    User,
    X,
    ZoomIn,
} from 'lucide-react';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';
import IncidentStatusBadge from '@/Components/Incidents/IncidentStatusBadge';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import IncidentTimeline from '@/Components/Incidents/IncidentTimeline';
import OfficialUpdates from '@/Components/Incidents/OfficialUpdates';
import IncidentDiscussion from '@/Components/Incidents/IncidentDiscussion';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { Incident, IncidentComment, PaginatedData, SharedData } from '@/types';

interface Props {
    incident: Incident;
    official_comments?: IncidentComment[];
    discussion_comments?: PaginatedData<IncidentComment>;
    comments?: PaginatedData<IncidentComment>;
    canClose: boolean;
}

export default function Show({
    incident,
    official_comments = [],
    discussion_comments,
    comments,
    canClose,
}: Props) {
    const { confirm } = useResidentConfirmation();
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const isReporter = incident.reporter.id === authUser?.id;
    const isClosed = incident.status === 'closed';

    const discussionData = discussion_comments || comments || {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 30,
        total: 0,
        first_page_url: '',
        last_page_url: '',
        next_page_url: null,
        prev_page_url: null,
        path: '',
        from: null,
        to: null,
        links: [],
    };

    const handleUpvote = () => {
        if (isReporter || isClosed) return;
        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            { preserveScroll: true }
        );
    };

    const handleClose = async () => {
        if (!canClose) return;

        const confirmed = await confirm({
            title: 'Close this Incident?',
            message:
                'Are you satisfied that this issue has been fully resolved? Closing it will archive this case.',
            confirmText: 'Yes, Close Incident',
            cancelText: 'Keep Open',
            type: 'default',
        });

        if (confirmed) {
            router.post(`/resident/incidents/${incident.hashid}/close`, {}, { preserveScroll: true });
        }
    };

    const handleDelete = async () => {
        if (!isReporter || incident.status !== 'pending') return;

        const confirmed = await confirm({
            title: 'Delete Incident Report?',
            message: 'This report will be permanently removed. This action cannot be undone.',
            confirmText: 'Delete Report',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (confirmed) {
            router.delete(`/resident/incidents/${incident.hashid}`);
        }
    };

    const handleSubmitComment = (body: string, parentId?: number | null) => {
        setSubmittingComment(true);
        router.post(
            `/resident/incidents/${incident.hashid}/comments`,
            {
                body,
                parent_id: parentId || undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingComment(false),
            }
        );
    };

    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <ResidentLayout>
            <Head title={`${incident.title} - Incident #${incident.reference_code || incident.hashid}`} />

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
                {/* Back Link & Navigation Bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/resident/incidents"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Incidents</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {isReporter && incident.status === 'pending' && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Report</span>
                            </button>
                        )}

                        {canClose && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark as Closed</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Column (Case File) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Status Header Card */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            {/* Category & Status Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <IncidentCategoryLabel
                                        category={incident.category}
                                        size="sm"
                                        showBadge
                                    />
                                    {incident.reference_code && (
                                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {incident.reference_code}
                                        </span>
                                    )}
                                </div>
                                <IncidentStatusBadge status={incident.status} size="md" />
                            </div>

                            {/* Incident Title */}
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                                {incident.title}
                            </h1>

                            {/* Description Body */}
                            <div className="mt-4 text-sm sm:text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                {incident.body}
                            </div>

                            {/* Photo / Media Evidence Lightbox Preview */}
                            {incident.attachment_url && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        Attached Evidence
                                    </h4>
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="group relative inline-block max-w-sm cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <img
                                            src={incident.attachment_url}
                                            alt="Incident evidence"
                                            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-bold">
                                            <ZoomIn className="w-4 h-4" /> Tap to expand
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata Footer */}
                            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    {incident.location && (
                                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            {incident.location}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        Reported on {formatDate(incident.created_at)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        {incident.reporter.name}
                                    </span>
                                </div>

                                {/* Subtle Community Signal (Upvotes) */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleUpvote}
                                        disabled={isReporter || isClosed}
                                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                                            incident.is_upvoted
                                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                                        } ${isReporter || isClosed ? 'opacity-70 cursor-default' : ''}`}
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span>
                                            {incident.upvotes_count || 0}{' '}
                                            {incident.upvotes_count === 1 ? 'affected' : 'affected'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Official Administrative Advisories */}
                        <OfficialUpdates updates={official_comments} />

                        {/* Community Discussion Thread */}
                        <IncidentDiscussion
                            comments={discussionData}
                            canComment={!isClosed}
                            onSubmitComment={handleSubmitComment}
                            submitting={submittingComment}
                        />
                    </div>

                    {/* Sidebar Column (Lifecycle Timeline) */}
                    <div className="lg:col-span-4 space-y-6">
                        <IncidentTimeline incident={incident} />
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && incident.attachment_url && (
                <div
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black"
                    >
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={incident.attachment_url}
                            alt="Incident Evidence Fullscreen"
                            className="max-h-[85vh] w-auto object-contain"
                        />
                    </div>
                </div>
            )}
        </ResidentLayout>
    );
}
