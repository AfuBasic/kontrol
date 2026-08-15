import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ChevronLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    BriefcaseIcon,
    ChatBubbleLeftIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { type FormEvent, useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface User {
    id: number;
    name: string;
}

interface Note {
    id: number;
    body: string;
    type: string;
    created_at: string;
    creator_name: string;
}

interface TimelineEvent {
    id: number;
    event_type: string;
    description: string;
    created_at: string;
    creator_name: string | null;
}

interface Application {
    id: number;
    estate_name: string;
    contact_name: string | null;
    email: string;
    phone: string;
    address: string | null;
    state: string | null;
    lga: string | null;
    number_of_houses: number | null;
    source: string;
    status: string;
    notes: string | null;
    challenges: string | null;
    created_at: string;
    partner?: { id: number; name: string } | null;
    assignedTo: User | null;
    notes_list: Note[];
    timeline_events: TimelineEvent[];
}

interface Props {
    application: Application;
}

export default function ApplicationShow({ application }: Props) {
    const {
        data: noteData,
        setData: setNoteData,
        post: postNote,
        processing: processingNote,
        reset: resetNote,
    } = useForm({
        body: '',
    });

    const { patch: patchStatus, processing: processingStatus } = useForm({
        status: '',
    });

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; status: string }>({ isOpen: false, status: '' });
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; reason: string }>({ isOpen: false, reason: '' });

    function handleAddNote(e: FormEvent) {
        e.preventDefault();
        postNote(`/zeus/applications/${application.id}/notes`, {
            preserveScroll: true,
            onSuccess: () => resetNote(),
        });
    }

    function requestUpdateStatus(newStatus: string) {
        if (newStatus === 'rejected') {
            setRejectModal({ isOpen: true, reason: '' });
        } else {
            setConfirmModal({ isOpen: true, status: newStatus });
        }
    }

    function confirmUpdateStatus() {
        const newStatus = confirmModal.status;
        setConfirmModal({ isOpen: false, status: '' });

        setIsUpdatingStatus(true);
        if (newStatus === 'approved') {
            router.post(
                `/zeus/applications/${application.id}/approve`,
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setIsUpdatingStatus(false),
                },
            );
        } else {
            router.patch(
                `/zeus/applications/${application.id}/status`,
                { status: newStatus },
                {
                    preserveScroll: true,
                    onFinish: () => setIsUpdatingStatus(false),
                },
            );
        }
    }

    function confirmReject() {
        if (!rejectModal.reason.trim()) return;
        const reason = rejectModal.reason;
        setRejectModal({ isOpen: false, reason: '' });

        setIsUpdatingStatus(true);
        router.post(
            `/zeus/applications/${application.id}/reject`,
            { reason },
            {
                preserveScroll: true,
                onFinish: () => setIsUpdatingStatus(false),
            },
        );
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const availableStatuses = ['received', 'under_review', 'approved', 'rejected'];

    return (
        <ZeusLayout>
            <Head title={`${application.estate_name} | Zeus Applications`} />

            {/* Back Navigation */}
            <div className="mb-6">
                <Link
                    href="/zeus/applications"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back to Pipeline
                </Link>
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-8 flex flex-wrap items-end justify-between gap-6"
            >
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-primary-700 uppercase dark:bg-primary-900/30 dark:text-primary-400">
                            {application.status.replace('_', ' ')}
                        </span>
                        {application.assignedTo && (
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Assigned to {application.assignedTo.name}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{application.estate_name}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {!['approved', 'rejected'].includes(application.status) && (
                        <>
                            <div className="relative">
                                <button
                                    disabled={isUpdatingStatus || processingStatus}
                                    onClick={() => !isUpdatingStatus && setDropdownOpen(!dropdownOpen)}
                                    className="flex w-48 items-center justify-between rounded-xl bg-slate-100 py-2.5 pr-3 pl-4 text-sm font-bold text-slate-700 shadow-inner ring-1 ring-slate-200/60 transition-all ring-inset hover:bg-slate-200/50 focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700/50 dark:hover:bg-slate-700/50"
                                >
                                    <span>{application.status ? application.status.replace('_', ' ').toUpperCase() : 'CHANGE STATUS'}</span>
                                    <svg
                                        className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute top-full left-0 z-50 mt-2 w-48 origin-top-left rounded-xl bg-white p-1 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                        <div className="flex flex-col">
                                            {availableStatuses.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        if (s !== application.status) requestUpdateStatus(s);
                                                    }}
                                                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                                                        s === application.status
                                                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {s.replace('_', ' ').toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={isUpdatingStatus || processingStatus}
                                onClick={() => requestUpdateStatus('approved')}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Approve Estate
                            </button>
                            <button
                                disabled={isUpdatingStatus || processingStatus}
                                onClick={() => requestUpdateStatus('rejected')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-900/10 dark:hover:text-red-400"
                            >
                                <XCircleIcon className="h-4 w-4" />
                                Reject
                            </button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Estate Info */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Contact Information</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                <a href={`mailto:${application.email}`} className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                                    {application.email}
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <PhoneIcon className="h-5 w-5 text-slate-400" />
                                <a href={`tel:${application.phone}`} className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                                    {application.phone}
                                </a>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                <span className="font-medium">{application.address || 'No address provided'}</span>
                            </div>
                        </div>

                        <hr className="my-6 border-slate-100 dark:border-slate-800" />

                        <h3 className="mb-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Application Details</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <BriefcaseIcon className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Source</p>
                                    <span className="font-bold text-slate-900 capitalize dark:text-white">
                                        {application.source === 'partner'
                                            ? `Partner${application.partner ? ` · ${application.partner.name}` : ''}`
                                            : 'Public'}
                                    </span>
                                </div>
                            </div>
                            {application.contact_name && (
                                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <BriefcaseIcon className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Contact person</p>
                                        <span className="font-bold text-slate-900 dark:text-white">{application.contact_name}</span>
                                    </div>
                                </div>
                            )}
                            {(application.state || application.lga) && (
                                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <MapPinIcon className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                                        <span className="font-medium">{[application.lga, application.state].filter(Boolean).join(', ')}</span>
                                    </div>
                                </div>
                            )}
                            {application.number_of_houses != null && (
                                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <BriefcaseIcon className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Houses</p>
                                        <span className="font-medium">{application.number_of_houses}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <CalendarIcon className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Applied On</p>
                                    <span className="font-medium">{formatDate(application.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {application.notes && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.15 }}
                            className="rounded-2xl bg-slate-50/50 p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800/30 dark:ring-slate-700/50"
                        >
                            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Applicant's Notes</h3>
                            <p className="text-sm text-slate-600 italic dark:text-slate-400">"{application.notes}"</p>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Timeline & Internal Notes */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Internal Notes */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            <ChatBubbleLeftIcon className="h-4 w-4" /> Internal Notes
                        </h3>

                        <form onSubmit={handleAddNote} className="mb-8">
                            <div className="relative overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200/60 ring-inset focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-inset dark:bg-slate-800/40 dark:ring-slate-700/50 dark:focus-within:ring-primary-500">
                                <textarea
                                    value={noteData.body}
                                    onChange={(e) => setNoteData('body', e.target.value)}
                                    placeholder="Add a private note about this application..."
                                    className="block w-full resize-none border-0 bg-transparent py-4 pr-4 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                                    rows={3}
                                    required
                                />
                                <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-100/50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/60">
                                    <span className="text-[10px] font-medium text-slate-400">Only visible to administrators</span>
                                    <button
                                        type="submit"
                                        disabled={processingNote || !noteData.body.trim()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
                                    >
                                        <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="flex flex-col gap-4">
                            {(application.notes_list || []).length > 0 ? (
                                (application.notes_list || []).map((note) => (
                                    <div
                                        key={note.id}
                                        className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/50 ring-inset dark:bg-slate-800/40 dark:ring-slate-700/50"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{note.creator_name}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{formatDate(note.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{note.body}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No internal notes yet.</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Timeline */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.25 }}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-6 flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            <TagIcon className="h-4 w-4" /> Activity Timeline
                        </h3>

                        <div className="relative border-l-2 border-slate-100 pl-4 dark:border-slate-800">
                            {(application.timeline_events || []).length > 0 ? (
                                (application.timeline_events || []).map((event, index) => (
                                    <div
                                        key={event.id}
                                        className={`relative ${index !== (application.timeline_events || []).length - 1 ? 'mb-8' : ''}`}
                                    >
                                        <span className="absolute top-1 -left-[23px] flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 ring-4 ring-white dark:bg-slate-700 dark:ring-slate-900">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-400" />
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                {formatDate(event.created_at)}
                                            </span>
                                            <h4 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                                {event.event_type.replace('_', ' ')}
                                            </h4>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                                            {event.creator_name && <span className="mt-1 text-xs text-slate-500">by {event.creator_name}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Custom Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setConfirmModal({ isOpen: false, status: '' })}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Confirm Action</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Are you sure you want to change the status to{' '}
                            <span className="font-bold text-primary-600 dark:text-primary-400">
                                {confirmModal.status.replace('_', ' ').toUpperCase()}
                            </span>
                            ?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, status: '' })}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUpdateStatus}
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Reject Reason Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setRejectModal({ isOpen: false, reason: '' })}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Reject Application</h3>
                        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                            Please provide a reason for rejecting this application. This will be sent to the applicant.
                        </p>

                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            placeholder="e.g. The application does not meet our current requirements..."
                            className="w-full rounded-xl border-none bg-slate-100 p-4 text-sm shadow-inner ring-1 ring-slate-200/60 ring-inset focus:bg-white focus:ring-2 focus:ring-primary-500 focus:ring-inset dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700/50 dark:focus:bg-slate-800"
                            rows={4}
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModal({ isOpen: false, reason: '' })}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={!rejectModal.reason.trim()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </ZeusLayout>
    );
}
