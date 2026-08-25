import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    MapPin,
    Paperclip,
    Trash2,
    User,
    X,
    ZoomIn,
} from 'lucide-react';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import IncidentStatusBadge from '@/Components/Incidents/IncidentStatusBadge';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import CurrentResponseSection from '@/Components/Incidents/CurrentResponseSection';
import CaseProgress from '@/Components/Incidents/CaseProgress';
import CaseTimeline from '@/Components/Incidents/CaseTimeline';
import OfficialUpdates from '@/Components/Incidents/OfficialUpdates';
import IncidentDiscussion from '@/Components/Incidents/IncidentDiscussion';
import CaseDetailsSection from '@/Components/Incidents/CaseDetailsSection';
import ResolveIncidentModal from '@/Components/Incidents/ResolveIncidentModal';
import AddOfficialUpdateModal from '@/Components/Incidents/AddOfficialUpdateModal';
import EditCaseDetailsModal from '@/Components/Incidents/EditCaseDetailsModal';
import type { Incident, IncidentComment, IncidentPriority, PaginatedData } from '@/types/incidents';

type AdminUser = {
    id: number;
    name: string;
    email: string;
};

type ActivityEvent = {
    id: number;
    description: string;
    created_at: string;
    created_at_human?: string;
    causer: { name: string } | null;
};

interface Props {
    incident: Incident;
    require_resolution_notes?: boolean;
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
    require_resolution_notes = false,
    official_comments = [],
    discussion_comments,
    comments,
    admins,
    statuses,
    categories,
    activities = [],
}: Props) {
    const { confirm } = useAdminConfirmation();

    // Modals
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [isAddUpdateModalOpen, setIsAddUpdateModalOpen] = useState(false);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);

    // Loading states
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [submittingOfficial, setSubmittingOfficial] = useState(false);
    const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
    const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

    const isClosed = incident.status === 'closed';

    const discussionData =
        discussion_comments ||
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

    // Sequential Lifecycle Transitions
    const handleAcknowledge = () => {
        confirm({
            title: 'Acknowledge Incident?',
            message:
                'Acknowledging this case confirms initial review and notifies the reporter. Response SLA will be updated accordingly.',
            confirmLabel: 'Acknowledge Case',
            onConfirm: () => {
                setIsUpdatingStatus(true);
                router.put(
                    `/admin/incidents/${incident.hashid}/status`,
                    { status: 'acknowledged' },
                    {
                        preserveScroll: true,
                        onFinish: () => setIsUpdatingStatus(false),
                    }
                );
            },
        });
    };

    const handleBeginResolution = () => {
        confirm({
            title: 'Begin Incident Resolution?',
            message:
                'This will mark the incident as actively in progress and inform relevant estate teams that field work has begun.',
            confirmLabel: 'Begin Resolution',
            onConfirm: () => {
                setIsUpdatingStatus(true);
                router.put(
                    `/admin/incidents/${incident.hashid}/status`,
                    { status: 'resolving' },
                    {
                        preserveScroll: true,
                        onFinish: () => setIsUpdatingStatus(false),
                    }
                );
            },
        });
    };

    const handleConfirmResolve = (resolutionNotes: string) => {
        setIsUpdatingStatus(true);
        router.put(
            `/admin/incidents/${incident.hashid}/status`,
            {
                status: 'solved',
                resolution_notes: resolutionNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsResolveModalOpen(false);
                },
                onFinish: () => setIsUpdatingStatus(false),
            }
        );
    };

    // Official Update Submission
    const handlePostOfficialUpdate = (body: string) => {
        setSubmittingOfficial(true);
        router.post(
            `/admin/incidents/${incident.hashid}/comments`,
            { body },
            {
                preserveScroll: true,
                onSuccess: () => setIsAddUpdateModalOpen(false),
                onFinish: () => setSubmittingOfficial(false),
            }
        );
    };

    // Resident Discussion Comment Submission
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
            }
        );
    };

    // Save Case Details (Priority, Assignee, Category, Privacy - WITHOUT status)
    const handleSaveCaseDetails = (updatedData: {
        priority?: IncidentPriority;
        assigned_to?: string | number | null;
        category?: string;
        is_private?: boolean;
    }) => {
        setIsSubmittingDetails(true);
        router.put(
            `/admin/incidents/${incident.hashid}/status`,
            updatedData,
            {
                preserveScroll: true,
                onSuccess: () => setIsEditDetailsModalOpen(false),
                onFinish: () => setIsSubmittingDetails(false),
            }
        );
    };

    // Delete Case
    const handleDelete = () => {
        confirm({
            title: 'Permanently Delete Incident?',
            message:
                'This incident case file, evidence, and all comments will be permanently removed. This action cannot be undone.',
            confirmLabel: 'Delete Case',
            type: 'danger',
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
            <Head title={`Incident Workspace - #${incident.reference_code || incident.hashid}`} />

            {/* Back Navigation & Global Actions Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <Link
                    href="/admin/incidents"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Incidents</span>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Case</span>
                    </button>
                </div>
            </div>

            {/* 2-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12">
                {/* Main Left Column: Mobile order: 1. Header -> 2. Current Response -> 3. Progress -> 4. Timeline -> 5. Official Updates -> 6. Discussion */}
                <div className="space-y-5 sm:space-y-6 lg:col-span-8">
                    {/* 1. Incident Header Card */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <IncidentCategoryLabel category={incident.category} size="sm" showBadge />
                                {incident.reference_code && (
                                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {incident.reference_code}
                                    </span>
                                )}
                            </div>

                            <IncidentStatusBadge status={incident.status} size="md" />
                        </div>

                        {/* Title */}
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                            {incident.title}
                        </h1>

                        {/* Description */}
                        <div className="mt-4 text-sm sm:text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {incident.body}
                        </div>

                        {/* Attached Evidence */}
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

                        {/* Reporter & Location Meta */}
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
                                    Reported by {incident.reporter?.name || 'Resident'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Current Response & Authoritative Next Action */}
                    <CurrentResponseSection
                        incident={incident}
                        onAcknowledge={handleAcknowledge}
                        onBeginResolution={handleBeginResolution}
                        onOpenResolveModal={() => setIsResolveModalOpen(true)}
                        isUpdatingStatus={isUpdatingStatus}
                    />

                    {/* 3. Case Lifecycle Progress Indicator */}
                    <CaseProgress incident={incident} />

                    {/* 4. Unified Case Timeline */}
                    <Deferred
                        data="activities"
                        fallback={
                            <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                        }
                    >
                        <CaseTimeline incident={incident} activities={activities} />
                    </Deferred>

                    {/* 5. Official Updates (with progressive sheet composer) */}
                    <OfficialUpdates
                        updates={official_comments}
                        onAddUpdate={() => setIsAddUpdateModalOpen(true)}
                        canAddUpdate={!isClosed}
                    />

                    {/* 6. Resident Discussion */}
                    <Deferred
                        data="discussion_comments"
                        fallback={
                            <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                        }
                    >
                        <IncidentDiscussion
                            comments={discussionData}
                            canComment={!isClosed}
                            onSubmitComment={handleDiscussionComment}
                            submitting={submittingDiscussion}
                        />
                    </Deferred>

                    {/* Mobile-only 7. Case Details (stacked at bottom for mobile) */}
                    <div className="block lg:hidden">
                        <CaseDetailsSection
                            incident={incident}
                            onEdit={() => setIsEditDetailsModalOpen(true)}
                            canEdit={!isClosed}
                        />
                    </div>
                </div>

                {/* Right Rail (Desktop only): Case Details */}
                <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-6">
                    <CaseDetailsSection
                        incident={incident}
                        onEdit={() => setIsEditDetailsModalOpen(true)}
                        canEdit={!isClosed}
                    />
                </div>
            </div>

            {/* Modals & Dialogs */}
            <ResolveIncidentModal
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                onResolve={handleConfirmResolve}
                incident={incident}
                requireResolutionNotes={require_resolution_notes}
                isSubmitting={isUpdatingStatus}
            />

            <AddOfficialUpdateModal
                isOpen={isAddUpdateModalOpen}
                onClose={() => setIsAddUpdateModalOpen(false)}
                onSubmitUpdate={handlePostOfficialUpdate}
                incident={incident}
                isSubmitting={submittingOfficial}
            />

            <EditCaseDetailsModal
                isOpen={isEditDetailsModalOpen}
                onClose={() => setIsEditDetailsModalOpen(false)}
                onSave={handleSaveCaseDetails}
                incident={incident}
                admins={admins}
                categories={categories}
                isSubmitting={isSubmittingDetails}
            />

            {/* Fullscreen Lightbox */}
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
                            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img
                            src={incident.attachment_url}
                            alt="Incident Evidence"
                            className="max-h-[85vh] w-auto object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
