import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Mail,
    RefreshCw,
    Shield,
    Users,
    AlertCircle,
    AlertTriangle,
    XCircle,
    Loader2,
} from 'lucide-react';
import React, { useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface AccessCode {
    id: number;
    code: string;
    pass_uuid: string;
    status: string;
}

interface Recipient {
    id: number;
    email: string;
    status: string;
    delivery_status: 'pending' | 'queued' | 'sent' | 'failed';
    delivery_error: string | null;
    last_delivered_at: string | null;
    last_access_code: AccessCode | null;
}

interface Renewal {
    id: number;
    cycle_key: string;
    valid_from: string;
    valid_until: string;
    status: string;
    recipients_renewed: number;
    recipients_blocked: number;
    created_at: string;
}

interface BulkInvite {
    id: number;
    name: string | null;
    purpose: string | null;
    role: string | null;
    valid_from: string;
    valid_until: string;
    auto_renew: boolean;
    send_immediately: boolean;
    status: string;
    renewal_blocked_reason: string | null;
    last_renewed_at: string | null;
    next_renewal_at: string | null;
    recipients: Recipient[];
    renewals: Renewal[];
}

interface Props {
    organization: { id: number; name: string };
    membership: { role: string; is_admin: boolean };
    bulkInvite: BulkInvite;
}

export default function BulkInvitesShow({ organization, membership, bulkInvite }: Props) {
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRenewing, setIsRenewing] = useState(false);

    const copyPassUrl = (uuid: string, recipientId: number) => {
        const url = `${window.location.origin}/pass/${uuid}`;
        navigator.clipboard.writeText(url);
        setCopiedCodeId(recipientId);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    const handleRetryFailed = async () => {
        setIsRetrying(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/org/bulk-invites/${bulkInvite.id}/retry-failed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
            });
            if (res.ok) {
                router.reload();
            }
        } catch (err) {
            console.error('Failed to trigger retry', err);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleRenewNow = () => {
        if (!confirm('Are you sure you want to renew this bulk invite cycle now?')) return;
        setIsRenewing(true);
        router.post(
            `/org/bulk-invites/${bulkInvite.id}/renew`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsRenewing(false),
            },
        );
    };

    const handleCancelInvite = () => {
        if (!confirm('Are you sure you want to cancel this bulk invite? Active passes will no longer renew.')) return;
        setIsCancelling(true);
        router.post(
            `/org/bulk-invites/${bulkInvite.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsCancelling(false),
            },
        );
    };

    const recipients = bulkInvite.recipients || [];
    const totalRecipients = recipients.length;
    const sentCount = recipients.filter((r) => r.delivery_status === 'sent').length;
    const queuedCount = recipients.filter((r) => r.delivery_status === 'queued' || r.delivery_status === 'pending').length;
    const failedCount = recipients.filter((r) => r.delivery_status === 'failed').length;

    // Delivery progress calculation
    const progressPercent = totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0;

    return (
        <OrganizationLayout title="Access - Bulk Invite Details" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - ${bulkInvite.name || 'Bulk Invite'} Details`} />

            <div className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pt-2 pb-24">
                {/* Back navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/org/bulk-invites"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bulk Invites
                    </Link>

                    {membership.is_admin && bulkInvite.status === 'active' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRenewNow}
                                disabled={isRenewing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
                                Renew Now
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelInvite}
                                disabled={isCancelling}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel Group
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {bulkInvite.name || `Batch #${bulkInvite.id}`}
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Issued by {organization.name}
                            </p>
                        </div>
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                bulkInvite.status === 'active'
                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : bulkInvite.status === 'cancelled'
                                    ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                        >
                            {bulkInvite.status}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                        <div>
                            <span className="text-slate-400">Validity Window</span>
                            <div className="mt-0.5 font-bold text-slate-800">
                                {bulkInvite.valid_from} – {bulkInvite.valid_until}
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400">Auto-Renewal</span>
                            <div className="mt-0.5 font-bold text-slate-800">
                                {bulkInvite.auto_renew ? 'Active on Expiry' : 'Disabled'}
                            </div>
                            {bulkInvite.next_renewal_at && bulkInvite.auto_renew && (
                                <p className="mt-0.5 text-[10px] text-indigo-600">
                                    Next cycle: {bulkInvite.next_renewal_at}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delivery Progress Bar */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Email Delivery Progress</span>
                        <span>{progressPercent}% Complete</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Delivery Stats Bar */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                        <div className="text-base font-extrabold text-slate-900">{totalRecipients}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Sent</div>
                        <div className="text-base font-extrabold text-emerald-700">{sentCount}</div>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center">
                        <div className="text-[10px] font-bold text-amber-600 uppercase">Queued</div>
                        <div className="text-base font-extrabold text-amber-700">{queuedCount}</div>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
                        <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                        <div className="text-base font-extrabold text-rose-700">{failedCount}</div>
                    </div>
                </div>

                {/* Retry action if failures exist */}
                {failedCount > 0 && membership.is_admin && (
                    <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>{failedCount} passes encountered email delivery failures.</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRetryFailed}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                        >
                            {isRetrying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>Retry Failed</span>
                        </button>
                    </div>
                )}

                {/* Recipients List */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs">
                    <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">
                        Recipients & Pass Codes ({recipients.length})
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recipients.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-3 p-3.5">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-bold text-slate-900">{r.email}</div>
                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                                        {r.last_access_code && (
                                            <span className="font-mono font-semibold tracking-wider text-indigo-600">
                                                Code: {r.last_access_code.code}
                                            </span>
                                        )}
                                        {r.last_delivered_at && (
                                            <span>· Delivered {new Date(r.last_delivered_at).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                    {r.delivery_error && (
                                        <div className="mt-1 text-[11px] text-rose-600 truncate" title={r.delivery_error}>
                                            Error: {r.delivery_error}
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {r.delivery_status === 'sent' && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                            <CheckCircle2 className="h-3 w-3" /> Sent
                                        </span>
                                    )}
                                    {r.delivery_status === 'queued' && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                            <Clock className="h-3 w-3" /> Queued
                                        </span>
                                    )}
                                    {r.delivery_status === 'pending' && (
                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            Pending
                                        </span>
                                    )}
                                    {r.delivery_status === 'failed' && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                            <AlertCircle className="h-3 w-3" /> Failed
                                        </span>
                                    )}

                                    {r.last_access_code && (
                                        <button
                                            type="button"
                                            onClick={() => copyPassUrl(r.last_access_code!.pass_uuid, r.id)}
                                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-slate-300 hover:text-slate-700"
                                            title="Copy public pass link"
                                        >
                                            {copiedCodeId === r.id ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Renewal History Section */}
                {bulkInvite.renewals && bulkInvite.renewals.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs">
                        <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">
                            Renewal Cycles ({bulkInvite.renewals.length})
                        </div>
                        <div className="divide-y divide-slate-100">
                            {bulkInvite.renewals.map((renewal) => (
                                <div key={renewal.id} className="flex items-center justify-between p-3.5 text-xs">
                                    <div>
                                        <div className="font-semibold text-slate-800">
                                            {renewal.valid_from} to {renewal.valid_until}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-400">
                                            Processed on {new Date(renewal.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700 border border-indigo-200 text-[10px]">
                                            {renewal.recipients_renewed} renewed
                                        </span>
                                        <span className="capitalize text-[11px] text-slate-500 font-medium">
                                            {renewal.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
