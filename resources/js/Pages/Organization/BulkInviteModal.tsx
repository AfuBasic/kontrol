import { useForm } from '@inertiajs/react';
import {
    Calendar,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Send,
    AlertTriangle,
    Loader2,
    ChevronRight,
    Clock,
    Users, Ticket } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import EmailPillInput from '@/Components/Organization/EmailPillInput';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const MAX_RECIPIENTS = 30;

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
    const [activeBulkInviteId, setActiveBulkInviteId] = useState<number | null>(null);

    // Delivery polling state
    const [statusSummary, setStatusSummary] = useState<DeliverySummary | null>(null);
    const [recipientStatuses, setRecipientStatuses] = useState<RecipientDeliveryInfo[]>([]);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        purpose: '',
        emails: [] as string[],
        valid_from: today,
        valid_until: defaultEnd,
        auto_renew: false,
        send_immediately: true,
        single_entry: false,
    });

    // 30-day date range validation
    const dateRangeValidation = useMemo(() => {
        if (!data.valid_from || !data.valid_until) return { valid: false, message: 'Please select valid dates.' };
        const start = new Date(data.valid_from);
        const end = new Date(data.valid_until);

        if (end < start) {
            return { valid: false, message: 'End date must be on or after start date.' };
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 30) {
            return { valid: false, message: `Selected range is ${diffDays} days. Pass validity cannot exceed 30 days.` };
        }

        return { valid: true, message: null, days: diffDays };
    }, [data.valid_from, data.valid_until]);

    const currentRecipientsCount = data.emails.length;
    const isOverLimit = currentRecipientsCount > MAX_RECIPIENTS;

    const handleProceedToConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentRecipientsCount === 0 || isOverLimit || !dateRangeValidation.valid) return;
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
        setStep('form');
        setActiveBulkInviteId(null);
        setStatusSummary(null);
        setRecipientStatuses([]);
        setIsPolling(false);
    };



    return (
        <ResponsiveSheet isOpen={isOpen} onClose={handleCloseAll} title="Bulk Visitor Invite">
            <div className="flex h-full flex-col">

                {/* STEP 1: FORM */}
                {step === 'form' && (
                    <form onSubmit={handleProceedToConfirm} className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                            <p className="mb-5 text-[13px] leading-relaxed text-slate-500">
                                Issue branded access passes to up to 30 visitors. Each recipient gets a personalised PDF pass by email.
                            </p>

                            <div className="space-y-5">
                                {/* Batch Name */}
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        Batch Name <span className="normal-case font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Annual Audit Team, Vendor Technicians"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#1a5dbf] focus:ring-2 focus:ring-[#1a5dbf]/20 focus:outline-none transition"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
                                </div>

                                {/* Event or reason: printed on every pass in the batch */}
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        Event or reason <span className="normal-case font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        placeholder="e.g. Estate AGM, Annual Dinner, Contractor onboarding"
                                        value={data.purpose}
                                        onChange={(e) => setData('purpose', e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#1a5dbf] focus:ring-2 focus:ring-[#1a5dbf]/20 focus:outline-none transition"
                                    />
                                    <p className="mt-1.5 text-[11px] text-slate-400">Printed on every pass in this batch, so guards know what it is for.</p>
                                    {errors.purpose && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.purpose}</p>}
                                </div>

                                {/* Recipient Emails */}
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        Recipient Emails <span className="text-rose-500">*</span>
                                    </label>
                                    <EmailPillInput
                                        value={data.emails}
                                        onChange={(emails) => setData('emails', emails)}
                                        maxEmails={MAX_RECIPIENTS}
                                        error={errors.emails}
                                        placeholder="Type an email and press Enter or comma..."
                                    />
                                </div>

                                {/* Validity Period */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[#1a5dbf]" />
                                            <span className="text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
                                                Pass Validity Period
                                            </span>
                                        </div>
                                        {dateRangeValidation.valid && dateRangeValidation.days && (
                                            <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[11px] font-bold text-[#1a5dbf]">
                                                {dateRangeValidation.days}d window
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">From</label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={data.valid_from}
                                                onChange={(e) => setData('valid_from', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 shadow-xs focus:border-[#1a5dbf] focus:ring-2 focus:ring-[#1a5dbf]/20 focus:outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">Until</label>
                                            <input
                                                type="date"
                                                min={data.valid_from}
                                                value={data.valid_until}
                                                onChange={(e) => setData('valid_until', e.target.value)}
                                                className={`block w-full rounded-xl border bg-white px-3 py-2.5 text-[13px] text-slate-900 shadow-xs focus:ring-2 focus:outline-none transition ${
                                                    !dateRangeValidation.valid
                                                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
                                                        : 'border-slate-200 focus:border-[#1a5dbf] focus:ring-[#1a5dbf]/20'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    {!dateRangeValidation.valid && (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>{dateRangeValidation.message}</span>
                                        </p>
                                    )}
                                    {errors.valid_until && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.valid_until}</p>}
                                </div>

                                {/* Toggles */}
                                <div className="space-y-3">
                                    {/* Send Immediately Toggle */}
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]">
                                                <Send className="h-3.5 w-3.5 text-[#1a5dbf]" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">Send passes immediately</p>
                                                <p className="text-[11px] text-slate-400">Each visitor receives their pass via email now.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.send_immediately}
                                            onClick={() => setData('send_immediately', !data.send_immediately)}
                                            className={`relative ml-3 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                data.send_immediately ? 'bg-[#1a5dbf]' : 'bg-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                    data.send_immediately ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Single Entry Toggle */}
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]">
                                                <Ticket className="h-3.5 w-3.5 text-[#1a5dbf]" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">Single entry</p>
                                                <p className="text-[11px] text-slate-400">
                                                    {data.single_entry
                                                        ? 'Each pass works once. A forwarded copy will not work again.'
                                                        : 'Passes work for repeat visits until they expire.'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.single_entry}
                                            onClick={() => setData('single_entry', !data.single_entry)}
                                            className={`relative ml-3 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                data.single_entry ? 'bg-[#1a5dbf]' : 'bg-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                    data.single_entry ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Auto-renew Toggle */}
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]">
                                                <RefreshCw className="h-3.5 w-3.5 text-[#1a5dbf]" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">Auto-renew on expiry</p>
                                                <p className="text-[11px] text-slate-400">Passes extend automatically for the same duration.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.auto_renew}
                                            onClick={() => setData('auto_renew', !data.auto_renew)}
                                            className={`relative ml-3 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                data.auto_renew ? 'bg-[#1a5dbf]' : 'bg-slate-200'
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
                        </div>

                        <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                            <button
                                type="submit"
                                disabled={processing || currentRecipientsCount === 0 || isOverLimit || !dateRangeValidation.valid}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b4aa2] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0a3d8a] active:scale-[0.98] disabled:opacity-50"
                            >
                                <span>Review {currentRecipientsCount > 0 ? `${currentRecipientsCount} Recipients` : 'Details'}</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: CONFIRMATION REVIEW */}
                {step === 'confirm' && (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                            {/* Summary Banner */}
                            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#0b1f40] px-4 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <Users className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-white">{data.emails.length} passes ready to create</p>
                                    <p className="text-[11px] text-blue-200">Review the details below before confirming.</p>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="mb-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Batch Name</span>
                                    <span className="font-semibold text-slate-900">{data.name || <span className="text-slate-400 italic">Not set</span>}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Event or reason</span>
                                    <span className="font-semibold text-slate-900">{data.purpose || <span className="text-slate-400 italic">Not set</span>}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Recipients</span>
                                    <span className="font-semibold text-slate-900">{data.emails.length}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Validity</span>
                                    <span className="font-semibold text-slate-900">
                                        {data.valid_from} → {data.valid_until}
                                        {dateRangeValidation.days && <span className="ml-1.5 text-slate-400">({dateRangeValidation.days}d)</span>}
                                    </span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Entry</span>
                                    <span className="font-semibold text-slate-900">{data.single_entry ? 'Single entry' : 'Multiple entry'}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Delivery</span>
                                    <span className="font-semibold text-slate-900">
                                        {data.send_immediately ? 'Immediate email + PDF' : 'Stored only'}
                                    </span>
                                </div>
                                <div className="flex justify-between px-4 py-3 text-[13px]">
                                    <span className="text-slate-500">Auto-renewal</span>
                                    <span className={`font-semibold ${data.auto_renew ? 'text-[#1a5dbf]' : 'text-slate-900'}`}>
                                        {data.auto_renew ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>

                            {/* Recipients Preview */}
                            <div>
                                <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Recipients</p>
                                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                    <ul className="divide-y divide-slate-100">
                                        {data.emails.map((email, i) => (
                                            <li key={email} className="flex items-center justify-between px-4 py-2.5">
                                                <span className="text-[13px] text-slate-700">{email}</span>
                                                <span className="text-[11px] text-slate-300">#{i + 1}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Server Validation Errors (e.g. auto_renew, dates, general) */}
                            {Object.keys(errors).length > 0 && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-rose-800">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                    <div className="text-xs leading-relaxed font-medium">
                                        {Object.entries(errors).map(([key, msg]) => (
                                            <p key={key}>{msg}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                disabled={processing}
                                className="shrink-0 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                disabled={processing}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b4aa2] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0a3d8a] disabled:opacity-50 whitespace-nowrap"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        <span>Creating Passes...</span>
                                    </>
                                ) : (
                                    <span>Confirm &amp; Create ({data.emails.length})</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REAL-TIME DELIVERY STATUS */}
                {step === 'status' && (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                            {/* Header */}
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900">Delivery Tracking</h3>
                                    <p className="text-[12px] text-slate-400">Real-time status of outgoing passes</p>
                                </div>
                                {isPolling && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#1a5dbf]">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Updating
                                    </span>
                                )}
                            </div>

                            {/* Stats Grid */}
                            {statusSummary && (
                                <div className="mb-5 grid grid-cols-4 gap-2">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                                        <div className="mt-0.5 text-xl font-extrabold text-slate-900">{statusSummary.total}</div>
                                    </div>
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-center">
                                        <div className="text-[10px] font-bold text-amber-500 uppercase">Queued</div>
                                        <div className="mt-0.5 text-xl font-extrabold text-amber-700">
                                            {statusSummary.queued + statusSummary.pending}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center">
                                        <div className="text-[10px] font-bold text-emerald-500 uppercase">Sent</div>
                                        <div className="mt-0.5 text-xl font-extrabold text-emerald-700">{statusSummary.sent}</div>
                                    </div>
                                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center">
                                        <div className="text-[10px] font-bold text-rose-500 uppercase">Failed</div>
                                        <div className="mt-0.5 text-xl font-extrabold text-rose-700">{statusSummary.failed}</div>
                                    </div>
                                </div>
                            )}

                            {/* Retry Banner */}
                            {statusSummary && statusSummary.failed > 0 && (
                                <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        <span>{statusSummary.failed} failed to deliver.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRetryFailed}
                                        disabled={isRetrying}
                                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {isRetrying ? 'Retrying...' : 'Retry Failed'}
                                    </button>
                                </div>
                            )}

                            {/* Recipients Status List */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                    Recipients ({recipientStatuses.length})
                                </div>
                                <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                                    {recipientStatuses.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between px-4 py-3">
                                            <span className="text-[13px] font-medium text-slate-800 truncate flex-1 mr-3">{r.email}</span>
                                            <div className="shrink-0">
                                                {r.delivery_status === 'sent' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        <CheckCircle2 className="h-3 w-3" /> Sent
                                                    </span>
                                                )}
                                                {r.delivery_status === 'queued' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                                        <Clock className="h-3 w-3" /> Queued
                                                    </span>
                                                )}
                                                {r.delivery_status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                                                        Pending
                                                    </span>
                                                )}
                                                {r.delivery_status === 'failed' && (
                                                    <span
                                                        title={r.delivery_error || 'Delivery failed'}
                                                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 cursor-help"
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

                        <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={handleCloseAll}
                                className="w-full rounded-xl bg-[#0b4aa2] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0a3d8a]"
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
