import React, { useState } from 'react';
import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin, Megaphone, Paperclip, Sliders, Trash2, User, X, ZoomIn } from 'lucide-react';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import IncidentStatusBadge from '@/Components/Incidents/IncidentStatusBadge';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import IncidentTimeline from '@/Components/Incidents/IncidentTimeline';
import OfficialUpdates from '@/Components/Incidents/OfficialUpdates';
import IncidentDiscussion from '@/Components/Incidents/IncidentDiscussion';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData } from '@/types';

type AdminUser = {
    id: number;
    name: string;
};

type ActivityEvent = {
    id: number;
    description: string;
    created_at: string;
    causer: { name: string } | null;
};

interface Props {
    incident: Incident;
    official_comments?: IncidentComment[];
    discussion_comments?: PaginatedData<IncidentComment>;
    comments?: PaginatedData<IncidentComment>;
    admins: AdminUser[];
    statuses: Array<{ value: string; label: string }>;
    categories: Array<{ value: string; label: string }>;
    activities?: ActivityEvent[];
}

export default function Show({
    incident,
    official_comments = [],
    discussion_comments,
    comments,
    admins,
    statuses,
    categories,
    activities = [],
}: Props) {
    const { confirm } = useAdminConfirmation();
    const { errors: pageErrors } = usePage().props;
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [officialBody, setOfficialBody] = useState('');
    const [submittingOfficial, setSubmittingOfficial] = useState(false);
    const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

    // Form for quick admin status/assignee/priority updates
    const {
        data,
        setData,
        patch,
        processing,
        errors,
    } = useForm({
        status: incident.status,
        assigned_to: incident.assignee?.id || '',
        priority: incident.priority || 'medium',
        category: typeof incident.category === 'object' ? (incident.category as any).value : incident.category,
        is_private: incident.is_private,
        notes: '',
    });

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

    const handleStatusTransition = (nextStatus: IncidentStatus) => {
        confirm({
            title: `Advance status to ${nextStatus.toUpperCase()}?`,
            message: `Are you sure you want to transition this incident to ${nextStatus}? Relevant estate parties will be notified.`,
            confirmLabel: 'Update Status',
            onConfirm: () => {
                router.patch(`/admin/incidents/${incident.hashid}/status`, { status: nextStatus }, { preserveScroll: true });
            },
        });
    };

    const handleSaveSidebarSettings = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/incidents/${incident.hashid}/status`, {
            preserveScroll: true,
        });
    };

    const handlePostOfficialUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!officialBody.trim() || submittingOfficial) return;

        setSubmittingOfficial(true);
        router.post(
            `/admin/incidents/${incident.hashid}/comments`,
            { body: officialBody.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setOfficialBody(''),
                onFinish: () => setSubmittingOfficial(false),
            },
        );
    };

    const handleDiscussionComment = (body: string, parentId?: number | null) => {
        setSubmittingDiscussion(true);
        router.post(
            `/admin/incidents/${incident.hashid}/comments`,
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

    const handleDelete = () => {
        confirm({
            title: 'Permanently Delete Incident?',
            message: 'This incident case file and all comments will be removed from the system. This cannot be undone.',
            confirmLabel: 'Delete Case',
            onConfirm: () => router.delete(`/admin/incidents/${incident.hashid}`),
        });
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <Head title={`Admin Case File - ${incident.title}`} />

            {/* Back Navigation & Case Management Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <Link
                    href="/admin/incidents"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Incident Board</span>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Case</span>
                    </button>
                </div>
            </div>

            {/* Main Console Grid */}
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                {/* Left 8 Cols: Incident Case Narrative & Comments */}
                <div className="space-y-6 lg:col-span-8">
                    {/* Primary Case File Card */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                        {/* Status and Action Ribbon */}
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <IncidentCategoryLabel category={incident.category} size="sm" showBadge />
                                {incident.reference_code && (
                                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{incident.reference_code}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <IncidentStatusBadge status={incident.status} size="md" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl leading-snug font-black tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                            {incident.title}
                        </h1>

                        {/* Description */}
                        <div className="mt-4 text-sm leading-relaxed font-normal whitespace-pre-line text-slate-700 sm:text-base dark:text-slate-300">
                            {incident.body}
                        </div>

                        {/* Photo / Media Attachment */}
                        {incident.attachment_url && (
                            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Attached Evidence
                                </h4>
                                <div
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="group relative inline-block max-w-sm cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950"
                                >
                                    <img
                                        src={incident.attachment_url}
                                        alt="Evidence Preview"
                                        className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/30 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        <ZoomIn className="h-4 w-4" /> Expand Image
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            <div className="flex flex-wrap items-center gap-4">
                                {incident.location && (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        {incident.location}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    Reported {formatDate(incident.created_at)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Reported by {incident.reporter?.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Actionable Lifecycle Stepper */}
                    {!isClosed && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950 dark:bg-slate-900">
                            <h3 className="mb-3 text-xs font-black tracking-wider text-indigo-900 uppercase dark:text-indigo-200">
                                Advance Case Lifecycle Stage
                            </h3>
                            <div className="flex flex-wrap items-center gap-2.5">
                                {incident.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => handleStatusTransition('acknowledged')}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-95"
                                    >
                                        Acknowledge Incident
                                    </button>
                                )}
                                {(incident.status === 'pending' || incident.status === 'acknowledged') && (
                                    <button
                                        type="button"
                                        onClick={() => handleStatusTransition('resolving')}
                                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95"
                                    >
                                        Begin Resolution
                                    </button>
                                )}
                                {incident.status === 'resolving' && (
                                    <button
                                        type="button"
                                        onClick={() => handleStatusTransition('solved')}
                                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                                    >
                                        Mark as Solved
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Official Broadcast Posting Box */}
                    {!isClosed && (
                        <div className="rounded-2xl border-2 border-indigo-200 bg-white p-5 dark:border-indigo-900/60 dark:bg-slate-900">
                            <div className="mb-3 flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">
                                    Publish Official Estate Update
                                </h3>
                            </div>
                            <form onSubmit={handlePostOfficialUpdate} className="space-y-3" noValidate>
                                <textarea
                                    value={officialBody}
                                    onChange={(e) => setOfficialBody(e.target.value)}
                                    placeholder="Publish official notice or dispatch information (marked as official estate communication)..."
                                    rows={3}
                                    disabled={submittingOfficial}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                />
                                {pageErrors.body && <p className="text-xs font-semibold text-rose-600">{String(pageErrors.body)}</p>}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!officialBody.trim() || submittingOfficial}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Megaphone className="h-3.5 w-3.5" />
                                        <span>{submittingOfficial ? 'Publishing...' : 'Broadcast to Residents'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Official Updates List */}
                    <OfficialUpdates updates={official_comments} />

                    {/* Resident Discussion Thread */}
                    <Deferred data="comments" fallback={<div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}>
                        <IncidentDiscussion
                            comments={discussionData}
                            canComment={!isClosed}
                            onSubmitComment={handleDiscussionComment}
                            submitting={submittingDiscussion}
                        />
                    </Deferred>
                </div>

                {/* Right 4 Cols: Operations Sidebar Controls & Lifecycle */}
                <div className="space-y-6 lg:col-span-4">
                    {/* Management Controls Card */}
                    <form
                        onSubmit={handleSaveSidebarSettings}
                        className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900"
                        noValidate
                    >
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <Sliders className="h-4 w-4 text-slate-400" />
                            <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Case Settings</h3>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                                {Object.entries(errors).map(([field, message]) => (
                                    <p key={field}>{String(message)}</p>
                                ))}
                            </div>
                        )}

                        {/* Status Select */}
                        <div>
                            <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as IncidentStatus)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            >
                                {statuses.map((st) => (
                                    <option key={st.value} value={st.value}>
                                        {st.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.status}</p>}
                        </div>

                        {/* Priority Select */}
                        <div>
                            <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">Priority</label>
                            <select
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value as any)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                            {errors.priority && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.priority}</p>}
                        </div>

                        {/* Assignee Select */}
                        <div>
                            <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Assigned Admin / Handler
                            </label>
                            <select
                                value={data.assigned_to}
                                onChange={(e) => setData('assigned_to', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            >
                                <option value="">Unassigned</option>
                                {admins.map((adm) => (
                                    <option key={adm.id} value={adm.id}>
                                        {adm.name}
                                    </option>
                                ))}
                            </select>
                            {errors.assigned_to && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.assigned_to}</p>}
                        </div>

                        {/* Category Select */}
                        <div>
                            <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">Category</label>
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.category}</p>}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                {processing ? 'Updating...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>

                    {/* Timeline Sidebar with Activity History */}
                    <Deferred data="activities" fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}>
                        <IncidentTimeline incident={incident} activities={activities} />
                    </Deferred>
                </div>
            </div>

            {/* Fullscreen Lightbox */}
            {isLightboxOpen && incident.attachment_url && (
                <div
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
                >
                    <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black">
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img src={incident.attachment_url} alt="Incident Evidence" className="max-h-[85vh] w-auto object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
}
