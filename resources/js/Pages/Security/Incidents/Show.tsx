import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    MapPin,
    Megaphone,
    Paperclip,
    Shield,
    Trash2,
    User,
    X,
    ZoomIn,
} from 'lucide-react';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import IncidentStatusBadge from '@/Components/Incidents/IncidentStatusBadge';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import IncidentTimeline from '@/Components/Incidents/IncidentTimeline';
import OfficialUpdates from '@/Components/Incidents/OfficialUpdates';
import IncidentDiscussion from '@/Components/Incidents/IncidentDiscussion';
import type { Incident, IncidentComment, PaginatedData, SharedData } from '@/types';

interface Props {
    incident: Incident;
    official_comments?: IncidentComment[];
    discussion_comments?: PaginatedData<IncidentComment>;
    comments?: PaginatedData<IncidentComment>;
}

export default function Show({
    incident,
    official_comments = [],
    discussion_comments,
    comments,
}: Props) {
    const { confirm } = useAdminConfirmation();
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [officialUpdateText, setOfficialUpdateText] = useState('');
    const [submittingOfficial, setSubmittingOfficial] = useState(false);
    const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

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

    const handleDelete = () => {
        if (!isReporter || incident.status !== 'pending') return;

        confirm({
            title: 'Delete Incident Report?',
            message: 'Are you sure you want to delete this incident report? This action cannot be undone.',
            confirmLabel: 'Delete report',
            onConfirm: () => router.delete(`/security/incidents/${incident.hashid}`),
        });
    };

    const handlePostOfficialUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!officialUpdateText.trim() || submittingOfficial) return;

        setSubmittingOfficial(true);
        router.post(
            `/security/incidents/${incident.hashid}/comments`,
            {
                body: officialUpdateText.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => setOfficialUpdateText(''),
                onFinish: () => setSubmittingOfficial(false),
            }
        );
    };

    const handleDiscussionComment = (body: string, parentId?: number | null) => {
        setSubmittingDiscussion(true);
        router.post(
            `/security/incidents/${incident.hashid}/comments`,
            {
                body,
                parent_id: parentId || undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingDiscussion(false),
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
        <>
            <Head title={`Security Case Log - ${incident.title}`} />

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
                {/* Back Link & Navigation */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/security/incidents"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Incident Log</span>
                    </Link>

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
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Case File Header Card */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
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
                                <div className="flex items-center gap-2">
                                    {incident.priority && (
                                        <span
                                            className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                                incident.priority === 'critical'
                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                    : incident.priority === 'high'
                                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            {incident.priority}
                                        </span>
                                    )}
                                    <IncidentStatusBadge status={incident.status} size="md" />
                                </div>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                                {incident.title}
                            </h1>

                            <div className="mt-4 text-sm sm:text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                {incident.body}
                            </div>

                            {/* Photo / Media Attachment */}
                            {incident.attachment_url && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        Evidence Attachment
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
                                            <ZoomIn className="w-4 h-4" /> Expand
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
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
                                        Logged {formatDate(incident.created_at)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        Reported by {incident.reporter.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Security Official Dispatch Posting Form */}
                        {!isClosed && (
                            <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-900/60 dark:bg-slate-900">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                                        Post Official Security Update
                                    </h3>
                                </div>
                                <form onSubmit={handlePostOfficialUpdate} className="space-y-3">
                                    <textarea
                                        value={officialUpdateText}
                                        onChange={(e) => setOfficialUpdateText(e.target.value)}
                                        placeholder="Type security patrol update, checkpoint actions, or dispatch notes (marked as official)..."
                                        rows={3}
                                        disabled={submittingOfficial}
                                        className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!officialUpdateText.trim() || submittingOfficial}
                                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            <Megaphone className="w-3.5 h-3.5" />
                                            <span>
                                                {submittingOfficial ? 'Publishing...' : 'Broadcast Dispatch'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Official Advisories Display */}
                        <OfficialUpdates updates={official_comments} />

                        {/* General Discussion Thread */}
                        <IncidentDiscussion
                            comments={discussionData}
                            canComment={!isClosed}
                            onSubmitComment={handleDiscussionComment}
                            submitting={submittingDiscussion}
                        />
                    </div>

                    {/* Timeline Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <IncidentTimeline incident={incident} />
                    </div>
                </div>
            </div>

            {/* Lightbox */}
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
        </>
    );
}
