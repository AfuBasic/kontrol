import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin, Megaphone, Paperclip, Shield, Trash2, User, X, ZoomIn } from 'lucide-react';
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

export default function Show({ incident, official_comments = [], discussion_comments, comments }: Props) {
    const { confirm } = useAdminConfirmation();
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [officialUpdateText, setOfficialUpdateText] = useState('');
    const [submittingOfficial, setSubmittingOfficial] = useState(false);
    const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

    const isReporter = incident.reporter.id === authUser?.id;
    const isClosed = incident.status === 'closed';

    const discussionData = discussion_comments ||
        comments || {
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
            },
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
            },
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

            <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
                {/* Secondary Navigation */}
                <div className="mb-4 flex items-center justify-between gap-3">
                    <Link
                        href="/security/incidents"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Incident Log</span>
                    </Link>

                    {isReporter && incident.status === 'pending' && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Report</span>
                        </button>
                    )}
                </div>

                {/* 2-Column Responsive Workspace */}
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
                    {/* Main Column */}
                    <div className="space-y-4 sm:space-y-5 lg:col-span-8">
                        {/* Primary Incident Case Summary Surface */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs ring-1 ring-slate-100/60 sm:p-6">
                            {/* Context & Status Row */}
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <IncidentCategoryLabel category={incident.category} size="sm" showBadge={false} />
                                </div>
                                <IncidentStatusBadge status={incident.status} size="sm" />
                            </div>

                            {/* Title */}
                            <h1 className="text-lg leading-snug font-black tracking-tight text-slate-900 sm:text-xl">
                                {incident.title}
                            </h1>

                            {/* Description */}
                            <div className="mt-3 text-xs leading-relaxed font-normal whitespace-pre-line text-slate-700 sm:text-sm">
                                {incident.body}
                            </div>

                            {/* Attached Evidence Attachment */}
                            {incident.attachment_url && (
                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Evidence Attachment
                                    </h4>
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="group relative inline-block max-w-xs cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:border-indigo-400"
                                    >
                                        <img
                                            src={incident.attachment_url}
                                            alt="Incident evidence"
                                            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-slate-900/40 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                            <ZoomIn className="h-3.5 w-3.5" /> Expand
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Secondary Metadata Section */}
                            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
                                {incident.priority && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                incident.priority === 'critical'
                                                    ? 'bg-rose-500'
                                                    : incident.priority === 'high'
                                                      ? 'bg-amber-500'
                                                      : 'bg-slate-400'
                                            }`}
                                        />
                                        <span className="capitalize">{incident.priority} priority</span>
                                    </span>
                                )}

                                {incident.reference_code && (
                                    <span className="font-mono text-[11px] font-bold text-slate-400">
                                        {incident.reference_code}
                                    </span>
                                )}

                                {incident.location && (
                                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span>{incident.location}</span>
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-1 text-slate-500">
                                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span>{formatDate(incident.created_at)}</span>
                                </span>

                                <span className="inline-flex items-center gap-1 text-slate-500">
                                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span>Reported by {incident.reporter?.name || 'Resident'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Official Security Update Composer Form */}
                        {!isClosed && (
                            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs ring-1 ring-slate-100/60 sm:p-5">
                                <div className="mb-2.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                            <Shield className="h-3.5 w-3.5" />
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-900">
                                            Official Security Update
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-400">
                                        Verified Security Broadcast
                                    </span>
                                </div>

                                <p className="mb-3 text-xs text-slate-500">
                                    Share a verified security update or checkpoint action visible to residents.
                                </p>

                                <form onSubmit={handlePostOfficialUpdate} className="space-y-3" noValidate>
                                    <textarea
                                        value={officialUpdateText}
                                        onChange={(e) => setOfficialUpdateText(e.target.value)}
                                        placeholder="Share a security update..."
                                        rows={2}
                                        disabled={submittingOfficial}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!officialUpdateText.trim() || submittingOfficial}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Megaphone className="h-3.5 w-3.5" />
                                            <span>{submittingOfficial ? 'Publishing...' : 'Post Update'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Official Advisories & Dispatches Display */}
                        <OfficialUpdates updates={official_comments} />

                        {/* General Resident Discussion Thread */}
                        <IncidentDiscussion
                            comments={discussionData}
                            canComment={!isClosed}
                            onSubmitComment={handleDiscussionComment}
                            submitting={submittingDiscussion}
                        />
                    </div>

                    {/* Timeline & Lifecycle Sidebar */}
                    <div className="space-y-4 lg:col-span-4">
                        <IncidentTimeline incident={incident} />
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {isLightboxOpen && incident.attachment_url && (
                <div
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
                >
                    <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black">
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <img src={incident.attachment_url} alt="Incident Evidence Fullscreen" className="max-h-[85vh] w-auto object-contain" />
                    </div>
                </div>
            )}
        </>
    );
}
