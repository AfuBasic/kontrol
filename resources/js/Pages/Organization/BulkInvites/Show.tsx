import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, Copy, Loader2, MoreHorizontal, Search, Send, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import ConfirmationSheet from '@/Components/ConfirmationSheet';
import MobileSheet from '@/Components/MobileSheet';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Recipient {
    id: number;
    email: string;
    delivery_status: 'pending' | 'queued' | 'sent' | 'failed';
    delivery_error: string | null;
    delivered_label: string;
    code: string | null;
    pass_uuid: string | null;
    can_resend: boolean;
}

interface Renewal {
    id: number;
    period_label: string;
    processed_label: string;
    status: string;
    recipients_renewed: number;
}

interface BulkInvite {
    id: number;
    name: string | null;
    purpose_label: string | null;
    role: string | null;
    status: string;
    state: 'upcoming' | 'active' | 'expired' | 'cancelled';
    valid_from_label: string;
    valid_until_label: string;
    days_left: number;
    auto_renew: boolean;
    next_renewal_label: string | null;
    renewal_blocked_reason_label: string | null;
    recipients: Recipient[];
    renewals: Renewal[];
}

interface Props {
    organization: { id: number; name: string };
    membership: { role: string; is_admin: boolean };
    bulkInvite: BulkInvite;
}

type PendingAction = 'renew' | 'cancel' | 'remove' | null;

export default function BulkInvitesShow({ organization, membership, bulkInvite }: Props) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Recipient | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirming, setConfirming] = useState<PendingAction>(null);
    const [processing, setProcessing] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const recipients = bulkInvite.recipients;
    const total = recipients.length;
    const sent = recipients.filter((r) => r.delivery_status === 'sent').length;
    const failed = recipients.filter((r) => r.delivery_status === 'failed').length;
    const sending = total - sent - failed;

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle ? recipients.filter((r) => r.email.toLowerCase().includes(needle)) : recipients;
    }, [query, recipients]);

    const isLive = bulkInvite.state === 'active' || bulkInvite.state === 'upcoming';
    const canManage = membership.is_admin && bulkInvite.status === 'active';
    const title = bulkInvite.name || bulkInvite.purpose_label || 'Untitled group';
    const meta = [
        `${total} ${total === 1 ? 'person' : 'people'}`,
        bulkInvite.name ? bulkInvite.purpose_label : null,
        bulkInvite.role,
    ].filter(Boolean);

    const validityHint = (() => {
        switch (bulkInvite.state) {
            case 'cancelled':
                return 'Cancelled';
            case 'expired':
                return 'Ended';
            case 'upcoming':
                return 'Not started yet';
            default:
                if (bulkInvite.days_left <= 0) return 'Ends today';
                return bulkInvite.days_left === 1 ? '1 day left' : `${bulkInvite.days_left} days left`;
        }
    })();
    const validityWarn = bulkInvite.state === 'active' && bulkInvite.days_left <= 3 && !bulkInvite.auto_renew;

    const renewalValue = bulkInvite.renewal_blocked_reason_label ? 'Paused' : bulkInvite.auto_renew ? 'On' : 'Off';
    const renewalHint = bulkInvite.renewal_blocked_reason_label
        ? bulkInvite.renewal_blocked_reason_label
        : bulkInvite.next_renewal_label
          ? `Next on ${bulkInvite.next_renewal_label}`
          : null;

    const copyPassLink = (recipient: Recipient) => {
        if (!recipient.pass_uuid) return;
        navigator.clipboard.writeText(`${window.location.origin}/pass/${recipient.pass_uuid}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const resendPass = (recipient: Recipient) => {
        setIsResending(true);
        router.post(
            `/org/bulk-invites/${bulkInvite.id}/recipients/${recipient.id}/resend`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelected(null),
                onFinish: () => setIsResending(false),
            },
        );
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

    const runConfirmed = () => {
        const done = {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirming(null);
            },
        };
        setProcessing(true);

        if (confirming === 'renew') {
            router.post(`/org/bulk-invites/${bulkInvite.id}/renew`, {}, done);
        } else if (confirming === 'cancel') {
            router.post(`/org/bulk-invites/${bulkInvite.id}/cancel`, {}, done);
        } else if (confirming === 'remove' && selected) {
            router.delete(`/org/bulk-invites/${bulkInvite.id}/recipients/${selected.id}`, {
                ...done,
                onSuccess: () => setSelected(null),
            });
        }
    };

    const confirmCopy = {
        renew: {
            title: 'Renew now?',
            message: 'Everyone in this group gets a new pass for the next cycle, sent by email.',
            confirmLabel: 'Renew now',
            type: 'info' as const,
        },
        cancel: {
            title: 'Cancel this group?',
            message: 'Passes stop renewing. Passes already sent stay valid until they expire.',
            confirmLabel: 'Cancel group',
            type: 'danger' as const,
        },
        remove: {
            title: 'Remove from group?',
            message: `${selected?.email ?? 'This person'} will lose access immediately and won't get future renewals.`,
            confirmLabel: 'Remove',
            type: 'danger' as const,
        },
    };
    const activeConfirm = confirming ? confirmCopy[confirming] : null;

    return (
        <OrganizationLayout title="Access - Group" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - ${title}`} />

            <div className="mx-auto flex max-w-[560px] flex-col px-4 pt-1 pb-28">
                <Link
                    href="/org/bulk-invites"
                    className="-ml-1.5 inline-flex min-h-[44px] items-center gap-0.5 self-start pr-3 text-[14px] text-[#1a5dbf]"
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                    Groups
                </Link>

                {/* Identity */}
                <header className="mt-1">
                    <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[#071f4b]">{title}</h1>
                    <p className="mt-0.5 text-[13px] text-slate-500">{meta.join(' · ')}</p>
                </header>

                {/* Validity + renewal */}
                <dl className={`mt-5 grid grid-cols-2 gap-4 ${isLive ? '' : 'opacity-60'}`}>
                    <div className="min-w-0">
                        <dt className="text-[11px] text-slate-500">Valid</dt>
                        <dd className="mt-0.5 text-[15px] text-[#071f4b]">
                            {bulkInvite.valid_from_label} – {bulkInvite.valid_until_label}
                        </dd>
                        <dd className={`mt-0.5 text-[12px] ${validityWarn ? 'text-amber-700' : 'text-slate-500'}`}>
                            {validityHint}
                        </dd>
                    </div>
                    {bulkInvite.state !== 'cancelled' && (
                        <div className="min-w-0">
                            <dt className="text-[11px] text-slate-500">Auto-renew</dt>
                            <dd
                                className={`mt-0.5 text-[15px] ${
                                    renewalValue === 'Paused'
                                        ? 'text-amber-700'
                                        : renewalValue === 'On' && isLive
                                          ? 'text-emerald-700'
                                          : 'text-[#071f4b]'
                                }`}
                            >
                                {renewalValue}
                            </dd>
                            {renewalHint && (
                                <dd
                                    className={`mt-0.5 truncate text-[12px] ${
                                        renewalValue === 'Paused' ? 'text-amber-700' : 'text-slate-500'
                                    }`}
                                >
                                    {renewalHint}
                                </dd>
                            )}
                        </div>
                    )}
                </dl>

                {/* Delivery summary: one line, only loud when something failed */}
                {total > 0 && (
                    <div className="mt-5 flex min-h-[44px] items-center justify-between gap-3 border-y border-slate-200/70 py-2.5">
                        <p className={`text-[13px] ${failed > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {failed > 0
                                ? `${failed} of ${total} not delivered`
                                : sending > 0
                                  ? `Sending… ${sent} of ${total} delivered`
                                  : total === 1
                                    ? 'Pass delivered'
                                    : `All ${total} passes delivered`}
                        </p>
                        {failed > 0 && membership.is_admin ? (
                            <button
                                type="button"
                                onClick={handleRetryFailed}
                                disabled={isRetrying}
                                className="inline-flex min-h-[36px] items-center gap-1.5 text-[13px] font-medium text-[#1a5dbf] disabled:opacity-50"
                            >
                                {isRetrying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Retry
                            </button>
                        ) : failed === 0 && sending === 0 ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
                        ) : null}
                    </div>
                )}

                {/* People */}
                <section className="mt-6">
                    <div className="mb-2 flex items-baseline justify-between px-0.5">
                        <h2 className="text-[13px] font-medium text-slate-500">People</h2>
                        <span className="text-[12px] text-slate-400">{total}</span>
                    </div>

                    {total > 1 && (
                        <div className="relative mb-2.5">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                                strokeWidth={2.25}
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search people…"
                                className="w-full rounded-full border border-slate-200/90 bg-white py-2 pr-4 pl-10 text-xs !text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                            />
                        </div>
                    )}

                    {total === 0 ? (
                        <p className="py-6 text-center text-[13px] text-slate-500">No one is in this group.</p>
                    ) : filtered.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-slate-500">No one matches “{query.trim()}”.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                            {filtered.map((r) => (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(r)}
                                        className="flex w-full min-h-[60px] items-center gap-3 px-4 py-3 text-left transition active:bg-slate-50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[14px] text-[#071f4b]">{r.email}</p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                                                {r.code && (
                                                    <span className="font-mono tracking-wide text-slate-600">{r.code}</span>
                                                )}
                                                {r.code && <span className="text-slate-300">·</span>}
                                                <RecipientStatus recipient={r} />
                                            </p>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Renewals */}
                {bulkInvite.renewals.length > 0 && (
                    <section className="mt-6">
                        <h2 className="mb-2 px-0.5 text-[13px] font-medium text-slate-500">Renewals</h2>
                        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                            {bulkInvite.renewals.map((renewal) => (
                                <li key={renewal.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-[14px] text-[#071f4b]">{renewal.period_label}</p>
                                        <p className="mt-0.5 text-[12px] text-slate-500">
                                            Processed {renewal.processed_label}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[12px] text-slate-500">
                                        {renewal.status === 'completed'
                                            ? `${renewal.recipients_renewed} renewed`
                                            : renewal.status.charAt(0).toUpperCase() + renewal.status.slice(1)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Group actions: quiet, at the end, where they can't be hit by accident */}
                {canManage && (
                    <div className="mt-8 flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                        <button
                            type="button"
                            onClick={() => setConfirming('renew')}
                            className="min-h-[48px] px-4 text-left text-[14px] text-[#1a5dbf] active:bg-slate-50"
                        >
                            Renew now
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming('cancel')}
                            className="min-h-[48px] px-4 text-left text-[14px] text-rose-600 active:bg-slate-50"
                        >
                            Cancel group
                        </button>
                    </div>
                )}
            </div>

            {/* Person actions */}
            <MobileSheet isOpen={selected !== null && confirming !== 'remove'} onClose={() => setSelected(null)} title={selected?.email}>
                {selected && (
                    <div className="flex flex-col gap-4 pb-2">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-[11px] text-slate-500">Pass code</p>
                                <p className="mt-0.5 font-mono text-[20px] tracking-[0.12em] text-[#071f4b]">
                                    {selected.code ?? '—'}
                                </p>
                            </div>
                            <p className="text-[12px] text-slate-500">
                                <RecipientStatus recipient={selected} />
                            </p>
                        </div>
                        {selected.delivery_error && (
                            <p className="text-[12px] text-rose-600">{selected.delivery_error}</p>
                        )}

                        <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70">
                            {selected.pass_uuid && (
                                <button
                                    type="button"
                                    onClick={() => copyPassLink(selected)}
                                    className="flex min-h-[48px] items-center gap-3 px-4 text-left text-[14px] text-[#071f4b] active:bg-slate-50"
                                >
                                    {copied ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-slate-500" />
                                    )}
                                    {copied ? 'Link copied' : 'Copy pass link'}
                                </button>
                            )}
                            {canManage && selected.can_resend && (
                                <button
                                    type="button"
                                    onClick={() => resendPass(selected)}
                                    disabled={isResending}
                                    className="flex min-h-[48px] items-center gap-3 px-4 text-left text-[14px] text-[#071f4b] active:bg-slate-50 disabled:opacity-60"
                                >
                                    {isResending ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                    ) : (
                                        <Send className="h-4 w-4 text-slate-500" />
                                    )}
                                    {isResending ? 'Resending…' : 'Resend pass'}
                                </button>
                            )}
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={() => setConfirming('remove')}
                                    className="flex min-h-[48px] items-center gap-3 px-4 text-left text-[14px] text-rose-600 active:bg-slate-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remove from group
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </MobileSheet>

            {activeConfirm && (
                <ConfirmationSheet
                    isOpen
                    onClose={() => !processing && setConfirming(null)}
                    onConfirm={runConfirmed}
                    title={activeConfirm.title}
                    message={activeConfirm.message}
                    confirmLabel={activeConfirm.confirmLabel}
                    type={activeConfirm.type}
                    isLoading={processing}
                />
            )}
        </OrganizationLayout>
    );
}

function RecipientStatus({ recipient }: { recipient: Recipient }) {
    switch (recipient.delivery_status) {
        case 'failed':
            return <span className="text-rose-600">Not delivered</span>;
        case 'sent':
            return <span>{recipient.delivered_label ? `Delivered ${recipient.delivered_label}` : 'Delivered'}</span>;
        default:
            return <span>Sending…</span>;
    }
}
