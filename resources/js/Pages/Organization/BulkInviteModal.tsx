import { useForm, usePage } from '@inertiajs/react';
import {
    Mail,
    Calendar,
    RefreshCw,
    X,
    AlertCircle,
    CheckCircle2,
    Send,
    Shield,
    Users,
    Clock,
    AlertTriangle,
    Loader2,
    ChevronRight,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const MAX_RECIPIENTS = 30;

const ROLE_OPTIONS = [
    'Guest / Visitor',
    'Contractor',
    'Vendor / Supplier',
    'Event Attendee',
    'Client / Partner',
    'Temporary Staff',
    'Other',
];

const PURPOSE_OPTIONS = [
    'Meeting / Consultation',
    'Delivery / Dropoff',
    'Site Maintenance / Repair',
    'Audit / Inspection',
    'Official Corporate Visit',
    'Social / Event Attendance',
    'Other',
];

interface DeliverySummary {
    total: number;
    pending: number;
    queued: number;
    sent: number;
    failed: number;
}

interface RecipientDeliveryInfo {
    id: number;
    email: string;
    delivery_status: 'pending' | 'queued' | 'sent' | 'failed';
    delivery_error: string | null;
}

export default function BulkInviteModal({ isOpen, onClose }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [step, setStep] = useState<'form' | 'confirm' | 'status'>('form');
    const [emailInput, setEmailInput] = useState('');
    const [activeBulkInviteId, setActiveBulkInviteId] = useState<number | null>(null);

    // Delivery polling state
    const [statusSummary, setStatusSummary] = useState<DeliverySummary | null>(null);
    const [recipientStatuses, setRecipientStatuses] = useState<RecipientDeliveryInfo[]>([]);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        purpose: '',
        role: '',
        emails: [] as string[],
        valid_from: today,
        valid_until: defaultEnd,
        auto_renew: false,
        send_immediately: true,
    });

    const parsedEmails = useMemo(() => {
        if (!emailInput.trim()) return [];
        const raw = emailInput
            .split(/[\n,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        return Array.from(new Set(raw));
    }, [emailInput]);

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validEmails = useMemo(() => parsedEmails.filter(isValidEmail), [parsedEmails]);
    const invalidEmails = useMemo(() => parsedEmails.filter((e) => !isValidEmail(e)), [parsedEmails]);

    const handleApplyEmails = () => {
        const combined = Array.from(new Set([...data.emails, ...validEmails])).slice(0, MAX_RECIPIENTS);
        setData('emails', combined);
        setEmailInput('');
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setData(
            'emails',
            data.emails.filter((e) => e !== emailToRemove),
        );
    };

    const effectiveEmails = data.emails.length > 0 ? data.emails : validEmails.slice(0, MAX_RECIPIENTS);
    const currentRecipientsCount = effectiveEmails.length;
    const isOverLimit = currentRecipientsCount > MAX_RECIPIENTS;

    const handleProceedToConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentRecipientsCount === 0 || isOverLimit) return;
        if (data.emails.length === 0 && validEmails.length > 0) {
            setData('emails', validEmails.slice(0, MAX_RECIPIENTS));
        }
        setStep('confirm');
    };

    const handleConfirmSubmit = () => {
        post('/org/bulk-invites', {
            preserveScroll: true,
            onSuccess: (page) => {
                const flashCreated = (page.props as any)?.flash?.bulk_invite_created;
                if (flashCreated?.id) {
                    setActiveBulkInviteId(flashCreated.id);
                    setStep('status');
                    setIsPolling(true);
                } else {
                    handleCloseAll();
                }
            },
        });
    };

    // Polling logic for delivery status
    useEffect(() => {
        if (!isPolling || !activeBulkInviteId) return;

        let isMounted = true;
        const fetchStatus = async () => {
            try {
                const response = await fetch(`/org/bulk-invites/${activeBulkInviteId}/delivery-status`, {
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) return;
                const result = await response.json();
                if (isMounted && result.summary) {
                    setStatusSummary(result.summary);
                    setRecipientStatuses(result.recipients || []);

                    // Stop polling if all sent/failed or no pending/queued
                    const pendingTotal = (result.summary.queued || 0) + (result.summary.pending || 0);
                    if (pendingTotal === 0 && result.summary.total > 0) {
                        setIsPolling(false);
                    }
                }
            } catch (err) {
                console.error('Failed to poll delivery status', err);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isPolling, activeBulkInviteId]);

    const handleRetryFailed = async () => {
        if (!activeBulkInviteId) return;
        setIsRetrying(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/org/bulk-invites/${activeBulkInviteId}/retry-failed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
            });
            if (res.ok) {
                setIsPolling(true);
            }
        } catch (err) {
            console.error('Failed to retry failed deliveries', err);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleCloseAll = () => {
        onClose();
        reset();
        setEmailInput('');
        setStep('form');
        setActiveBulkInviteId(null);
        setStatusSummary(null);
        setRecipientStatuses([]);
        setIsPolling(false);
    };

    if (!isOpen) return null;

    return (
        <ResponsiveSheet isOpen={isOpen} onClose={handleCloseAll} title="Bulk Visitor Invite">
            <div className="flex h-full flex-col">
                {/* STEP 1: FORM */}
                {step === 'form' && (
                    <form onSubmit={handleProceedToConfirm} className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                            <p className="mb-6 text-sm text-slate-500">
                                Issue branded access passes to up to 30 visitor emails with PDF pass generation and automated delivery.
                            </p>

                            <div className="space-y-6">
                                {/* Batch Name, Purpose & Role */}
                                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Batch / List Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Annual Audit Team, Vendor Technicians"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                        />
                                        {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Role / Category
                                            </label>
                                            <select
                                                value={data.role}
                                                onChange={(e) => setData('role', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                            >
                                                <option value="">Select visitor role...</option>
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.role && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.role}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Visit Purpose
                                            </label>
                                            <select
                                                value={data.purpose}
                                                onChange={(e) => setData('purpose', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                            >
                                                <option value="">Select purpose...</option>
                                                {PURPOSE_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.purpose && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.purpose}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Recipient Emails Area */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Recipient Emails <span className="text-rose-500">*</span>
                                        </label>
                                        <span className={`text-xs font-semibold ${isOverLimit ? 'font-bold text-rose-600' : 'text-slate-500'}`}>
                                            {currentRecipientsCount} / {MAX_RECIPIENTS} max
                                        </span>
                                    </div>

                                    <textarea
                                        rows={4}
                                        placeholder="Paste up to 30 recipient emails (one per line, comma or semicolon separated)..."
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                    />

                                    {validEmails.length > 0 && emailInput && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                Found {validEmails.length} valid {validEmails.length === 1 ? 'email' : 'emails'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleApplyEmails}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                            >
                                                Add to list
                                            </button>
                                        </div>
                                    )}

                                    {invalidEmails.length > 0 && (
                                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>
                                                Invalid email format: {invalidEmails.slice(0, 3).join(', ')}
                                                {invalidEmails.length > 3 ? '...' : ''}
                                            </span>
                                        </div>
                                    )}

                                    {data.emails.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {data.emails.map((email) => (
                                                <span
                                                    key={email}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                                                >
                                                    {email}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveEmail(email)}
                                                        className="text-slate-400 hover:text-rose-500"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {errors.emails && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.emails}</p>}
                                </div>

                                {/* Validity Period (1 - 30 days) */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">Pass Validity Period</h4>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Valid From</label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={data.valid_from}
                                                onChange={(e) => setData('valid_from', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                Valid Until (Max 30 Days)
                                            </label>
                                            <input
                                                type="date"
                                                min={data.valid_from}
                                                value={data.valid_until}
                                                onChange={(e) => setData('valid_until', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900"
                                            />
                                        </div>
                                    </div>
                                    {errors.valid_until && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.valid_until}</p>}
                                </div>

                                {/* Send Immediately Toggle */}
                                <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="space-y-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <Send className="h-4 w-4 text-slate-700" />
                                            <span className="text-sm font-bold text-slate-900">Send passes immediately via email</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-slate-500">
                                            Each visitor will receive their pass with an attached branded PDF pass and QR code right away.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.send_immediately}
                                        onClick={() => setData('send_immediately', !data.send_immediately)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                            data.send_immediately ? 'bg-slate-900' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                data.send_immediately ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Auto-renew Toggle */}
                                <div className="flex items-start justify-between rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                    <div className="space-y-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 text-indigo-600" />
                                            <span className="text-sm font-bold text-slate-900">Auto-renew this list</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-slate-600">
                                            Automatically issue and email a new pass to active recipients 24 hours before each cycle expires.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.auto_renew}
                                        onClick={() => setData('auto_renew', !data.auto_renew)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                            data.auto_renew ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                data.auto_renew ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                                {errors.auto_renew && <p className="text-xs font-medium text-rose-500">{errors.auto_renew}</p>}
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-slate-100 p-5 sm:px-6">
                            <button
                                type="submit"
                                disabled={processing || currentRecipientsCount === 0 || isOverLimit}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                            >
                                <span>Continue to Confirmation ({currentRecipientsCount})</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: CONFIRMATION REVIEW */}
                {step === 'confirm' && (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                            <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-indigo-900">
                                <h3 className="font-bold text-indigo-950">Review Bulk Invite Details</h3>
                                <p className="mt-1 text-xs text-indigo-800">
                                    Please confirm the details below before creating passes and queueing email deliveries.
                                </p>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                    <span className="text-slate-500">Recipients Count:</span>
                                    <span className="font-bold text-slate-900">{effectiveEmails.length} recipients</span>
                                </div>
                                {data.name && (
                                    <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                        <span className="text-slate-500">Batch Name:</span>
                                        <span className="font-bold text-slate-900">{data.name}</span>
                                    </div>
                                )}
                                {data.role && (
                                    <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                        <span className="text-slate-500">Role:</span>
                                        <span className="font-bold text-slate-900">{data.role}</span>
                                    </div>
                                )}
                                {data.purpose && (
                                    <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                        <span className="text-slate-500">Purpose:</span>
                                        <span className="font-bold text-slate-900">{data.purpose}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                    <span className="text-slate-500">Validity Window:</span>
                                    <span className="font-bold text-slate-900">
                                        {data.valid_from} to {data.valid_until}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/60 pb-3 text-sm">
                                    <span className="text-slate-500">Send Delivery:</span>
                                    <span className="font-bold text-slate-900">
                                        {data.send_immediately ? 'Immediate Email + PDF Pass' : 'Stored Only (Manual Send)'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Auto-Renewal:</span>
                                    <span className="font-bold text-slate-900">{data.auto_renew ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>

                            <div className="mt-5">
                                <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Recipients Preview</h4>
                                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                                    <ul className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {effectiveEmails.map((email, i) => (
                                            <li key={email} className="py-1.5 flex items-center justify-between">
                                                <span>{email}</span>
                                                <span className="text-[10px] text-slate-400">#{i + 1}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-3 border-t border-slate-100 p-5 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                disabled={processing}
                                className="w-1/3 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                disabled={processing}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Creating Passes...</span>
                                    </>
                                ) : (
                                    <span>Confirm & Create {effectiveEmails.length} Passes</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REAL-TIME DELIVERY STATUS */}
                {step === 'status' && (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <div>
                                    <h3 className="font-bold text-slate-900">Pass Delivery Tracking</h3>
                                    <p className="text-xs text-slate-500">Real-time status of outgoing pass emails and PDFs</p>
                                </div>
                                {isPolling && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Updating...
                                    </span>
                                )}
                            </div>

                            {statusSummary && (
                                <div className="mb-6 grid grid-cols-4 gap-2">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                                        <div className="text-lg font-extrabold text-slate-900">{statusSummary.total}</div>
                                    </div>
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center">
                                        <div className="text-[10px] font-bold text-amber-600 uppercase">Queued</div>
                                        <div className="text-lg font-extrabold text-amber-700">
                                            {statusSummary.queued + statusSummary.pending}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Sent</div>
                                        <div className="text-lg font-extrabold text-emerald-700">{statusSummary.sent}</div>
                                    </div>
                                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
                                        <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                                        <div className="text-lg font-extrabold text-rose-700">{statusSummary.failed}</div>
                                    </div>
                                </div>
                            )}

                            {statusSummary && statusSummary.failed > 0 && (
                                <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                                        <span>{statusSummary.failed} passes failed to deliver.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRetryFailed}
                                        disabled={isRetrying}
                                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {isRetrying ? 'Retrying...' : 'Retry Failed'}
                                    </button>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-2.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    Recipients Status List
                                </div>
                                <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                                    {recipientStatuses.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between px-4 py-3 text-xs">
                                            <span className="font-medium text-slate-800">{r.email}</span>
                                            <div>
                                                {r.delivery_status === 'sent' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3" /> Sent
                                                    </span>
                                                )}
                                                {r.delivery_status === 'queued' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700 border border-amber-200">
                                                        <Clock className="h-3 w-3" /> Queued
                                                    </span>
                                                )}
                                                {r.delivery_status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 font-bold text-slate-600 border border-slate-200">
                                                        Pending
                                                    </span>
                                                )}
                                                {r.delivery_status === 'failed' && (
                                                    <span
                                                        title={r.delivery_error || 'Delivery failed'}
                                                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-700 border border-rose-200 cursor-help"
                                                    >
                                                        <AlertCircle className="h-3 w-3" /> Failed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-slate-100 p-5 sm:px-6">
                            <button
                                type="button"
                                onClick={handleCloseAll}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ResponsiveSheet>
    );
}
