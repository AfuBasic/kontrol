import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock, Copy, Loader2, MoreHorizontal, Search, Send, Trash2, Users } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    visits_count: number;
    last_visit_label: string | null;
}

interface VisitSummary {
    total: number;
    visited_count: number;
    inside_now: number;
    last_visit_label: string | null;
}

interface Visit {
    id: number;
    day_label: string;
    entered_at_label: string;
    left_at_label: string | null;
    left_another_day: boolean;
    entry_point: string | null;
    exit_point: string | null;
    is_inside: boolean;
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
    elapsed_ratio: number;
    auto_renew: boolean;
    next_renewal_label: string | null;
    renewal_blocked_reason_label: string | null;
    recipients: Recipient[];
    visits: VisitSummary;
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
    const [retainedSelected, setRetainedSelected] = useState<Recipient | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirming, setConfirming] = useState<PendingAction>(null);
    const [processing, setProcessing] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (selected) {
            setRetainedSelected(selected);
        }
    }, [selected]);

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
            <div className="app-atmosphere" />

            <div className="mx-auto flex max-w-[560px] flex-col px-4 pt-1 pb-28">
                <Link
                    href="/org/bulk-invites"
                    className="-ml-1.5 inline-flex min-h-[44px] items-center gap-0.5 self-start pr-3 text-[14px] text-[#1a5dbf]"
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                    Groups
                </Link>

                {/* Group overview */}
                <section
                    className={`brand-card brand-card-glow mt-1 !rounded-[22px] px-5 pt-5 pb-5 text-white ${STATUS[bulkInvite.state].card}`}
                >
                    <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3">
                            <div className="brand-card-icon flex h-10 w-10 items-center justify-center rounded-[12px]">
                                <Users className="h-[18px] w-[18px] text-white" strokeWidth={2.1} />
                            </div>
                            <div className="flex items-center gap-2">
                                {bulkInvite.visits.inside_now > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-300/25">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                        </span>
                                        {bulkInvite.visits.inside_now} inside now
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/15">
                                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS[bulkInvite.state].dot}`} />
                                    {bulkInvite.state === 'upcoming'
                                        ? `Starts ${bulkInvite.valid_from_label}`
                                        : STATUS[bulkInvite.state].label}
                                </span>
                            </div>
                        </div>

                        <h1 className="mt-4 text-[26px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
                        <p className="mt-0.5 text-[13px] text-blue-100/70">{meta.join(' · ')}</p>

                        {bulkInvite.visits.total > 0 ? (
                            <dl className="mt-5 grid grid-cols-3 divide-x divide-white/10">
                                <Stat tone="dark" value={String(bulkInvite.visits.total)} label={bulkInvite.visits.total === 1 ? 'Visit' : 'Visits'} />
                                <Stat tone="dark" value={`${bulkInvite.visits.visited_count} of ${total}`} label="Came in" />
                                <Stat tone="dark" value={bulkInvite.visits.last_visit_label ?? '-'} label="Last visit" />
                            </dl>
                        ) : (
                            <p className="mt-5 text-[13px] text-blue-100/75">
                                {isLive ? 'No one has used their pass yet.' : 'No one used their pass.'}
                            </p>
                        )}

                        {/* Validity window */}
                        <div className="mt-5 rounded-2xl bg-white/[0.07] px-4 py-3.5 ring-1 ring-white/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-blue-100/60">Valid</p>
                                    <p className="mt-0.5 text-[15px] font-medium">
                                        {bulkInvite.valid_from_label} – {bulkInvite.valid_until_label}
                                    </p>
                                </div>
                                {bulkInvite.state !== 'cancelled' && (
                                    <div className="min-w-0 text-right">
                                        <p className="text-[11px] text-blue-100/60">Auto-renew</p>
                                        <p
                                            className={`mt-0.5 text-[15px] font-medium ${
                                                renewalValue === 'Paused'
                                                    ? 'text-amber-300'
                                                    : renewalValue === 'On' && isLive
                                                      ? 'text-emerald-300'
                                                      : 'text-white'
                                            }`}
                                        >
                                            {renewalValue}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {bulkInvite.state === 'active' && (
                                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full ${validityWarn ? 'bg-amber-300' : 'bg-gradient-to-r from-sky-300 to-blue-400'}`}
                                        style={{ width: `${Math.max(4, Math.round(bulkInvite.elapsed_ratio * 100))}%` }}
                                    />
                                </div>
                            )}

                            <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
                                <span className={validityWarn ? 'text-amber-300' : 'text-blue-100/70'}>{validityHint}</span>
                                {renewalHint && (
                                    <span
                                        className={`truncate ${renewalValue === 'Paused' ? 'text-amber-300' : 'text-blue-100/70'}`}
                                    >
                                        {renewalHint}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Delivery summary */}
                {total > 0 && (
                    <div className="soft-card mt-3 flex min-h-[56px] items-center gap-3 px-3.5 py-3">
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
                                failed > 0 ? 'icon-tile-rose' : sending > 0 ? 'icon-tile-amber' : 'icon-tile-mint'
                            }`}
                        >
                            {failed > 0 ? (
                                <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
                            ) : sending > 0 ? (
                                <Clock className="h-4 w-4" strokeWidth={2.2} />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[14px] text-[#071f4b]">
                                {failed > 0
                                    ? `${failed} of ${total} not delivered`
                                    : sending > 0
                                      ? `Sending passes…`
                                      : total === 1
                                        ? 'Pass delivered'
                                        : `All ${total} passes delivered`}
                            </p>
                            <p className="mt-0.5 text-[12px] text-slate-500">
                                {failed > 0 ? 'Check the addresses, then retry.' : `${sent} of ${total} emails sent with PDF pass`}
                            </p>
                        </div>
                        {failed > 0 && membership.is_admin && (
                            <button
                                type="button"
                                onClick={handleRetryFailed}
                                disabled={isRetrying}
                                className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 text-[13px] font-medium text-rose-700 ring-1 ring-rose-100 disabled:opacity-50"
                            >
                                {isRetrying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Retry
                            </button>
                        )}
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
                            onClick={() => setConfirming('cancel')}
                            className="min-h-[48px] px-4 text-left text-[14px] text-rose-600 active:bg-slate-50"
                        >
                            Cancel group
                        </button>
                    </div>
                )}
            </div>

            {/* Person details */}
            <MobileSheet isOpen={selected !== null && confirming !== 'remove'} onClose={() => setSelected(null)} title={selected?.email ?? retainedSelected?.email}>
                {retainedSelected && (
                    <div className="flex flex-col gap-5 pb-2">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[11px] text-slate-500">Pass code</p>
                                <p className="mt-0.5 font-mono text-[22px] tracking-[0.12em] text-[#071f4b]">
                                    {retainedSelected.code ?? '-'}
                                </p>
                            </div>
                            <p className="pb-1 text-right text-[12px] text-slate-500">
                                <RecipientStatus recipient={retainedSelected} />
                            </p>
                        </div>
                        {retainedSelected.delivery_error && (
                            <p className="-mt-3 text-[12px] text-rose-600">{retainedSelected.delivery_error}</p>
                        )}

                        <dl className="icon-tile-blue grid grid-cols-2 divide-x divide-[#c9dcfb] rounded-2xl py-3">
                            <Stat tone="tint" value={String(retainedSelected.visits_count)} label={retainedSelected.visits_count === 1 ? 'Visit' : 'Visits'} inset />
                            <Stat tone="tint" value={retainedSelected.last_visit_label ?? '-'} label="Last visit" inset />
                        </dl>

                        <VisitHistory
                            key={retainedSelected.id}
                            url={`/org/bulk-invites/${bulkInvite.id}/recipients/${retainedSelected.id}/visits`}
                            hasVisits={retainedSelected.visits_count > 0}
                        />

                        <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70">
                            {retainedSelected.pass_uuid && (
                                <button
                                    type="button"
                                    onClick={() => copyPassLink(retainedSelected)}
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
                            {canManage && retainedSelected.can_resend && retainedSelected.delivery_status === 'failed' && (
                                <button
                                    type="button"
                                    onClick={() => resendPass(retainedSelected)}
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

const STATUS: Record<BulkInvite['state'], { label: string; dot: string; card: string }> = {
    active: { label: 'Active', dot: 'bg-emerald-300', card: '' },
    upcoming: { label: 'Upcoming', dot: 'bg-sky-300', card: 'brand-card--upcoming' },
    expired: { label: 'Ended', dot: 'bg-slate-300', card: 'brand-card--muted' },
    cancelled: { label: 'Cancelled', dot: 'bg-rose-300', card: 'brand-card--muted' },
};

const STAT_TONE = {
    dark: { value: 'text-white', label: 'text-blue-100/60' },
    light: { value: 'text-[#071f4b]', label: 'text-slate-500' },
    tint: { value: 'text-[#0b3b8c]', label: 'text-[#1a5dbf]/70' },
} as const;

function Stat({
    value,
    label,
    inset = false,
    tone = 'light',
}: {
    value: string;
    label: string;
    inset?: boolean;
    tone?: keyof typeof STAT_TONE;
}) {
    return (
        <div className={`flex min-w-0 flex-col-reverse ${inset ? 'px-4' : 'px-3 first:pl-0 last:pr-0'}`}>
            <dt className={`mt-0.5 text-[11px] ${STAT_TONE[tone].label}`}>{label}</dt>
            <dd className={`truncate text-[20px] leading-tight font-semibold tracking-[-0.01em] tabular-nums ${STAT_TONE[tone].value}`}>
                {value}
            </dd>
        </div>
    );
}

function VisitHistory({ url, hasVisits }: { url: string; hasVisits: boolean }) {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(hasVisits);
    const [failed, setFailed] = useState(false);

    const load = useCallback(
        async (nextCursor: string | null) => {
            setLoading(true);
            setFailed(false);
            try {
                const res = await fetch(nextCursor ? `${url}?cursor=${encodeURIComponent(nextCursor)}` : url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: { data: Visit[]; next_cursor: string | null } = await res.json();
                setVisits((prev) => (nextCursor ? [...prev, ...json.data] : json.data));
                setCursor(json.next_cursor);
            } catch {
                setFailed(true);
            } finally {
                setLoading(false);
            }
        },
        [url],
    );

    useEffect(() => {
        if (hasVisits) load(null);
    }, [hasVisits, load]);

    return (
        <section>
            <h3 className="mb-2 px-0.5 text-[13px] font-medium text-slate-500">Visits</h3>

            {!hasVisits ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-[13px] text-slate-500">
                    Hasn't used this pass yet.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70">
                    {visits.map((visit) => (
                        <li key={visit.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-[14px] text-[#071f4b]">{visit.day_label}</p>
                                <p className="mt-0.5 truncate text-[12px] text-slate-500">
                                    {visit.entry_point ?? 'Gate not recorded'}
                                    {visit.exit_point && visit.exit_point !== visit.entry_point && ` → ${visit.exit_point}`}
                                </p>
                            </div>
                            <p className="shrink-0 text-right text-[13px] text-slate-600 tabular-nums">
                                {visit.entered_at_label}
                                {visit.is_inside ? (
                                    <span className="text-emerald-700"> · Inside</span>
                                ) : visit.left_at_label ? (
                                    <span className="text-slate-500">
                                        {' '}
                                        – {visit.left_at_label}
                                        {visit.left_another_day && ' (next day)'}
                                    </span>
                                ) : null}
                            </p>
                        </li>
                    ))}

                    {loading &&
                        Array.from({ length: visits.length === 0 ? 3 : 1 }).map((_, i) => (
                            <li key={`skeleton-${i}`} className="flex animate-pulse items-center justify-between px-4 py-3.5">
                                <div className="space-y-1.5">
                                    <div className="h-3.5 w-20 rounded bg-slate-100" />
                                    <div className="h-3 w-28 rounded bg-slate-100" />
                                </div>
                                <div className="h-3.5 w-24 rounded bg-slate-100" />
                            </li>
                        ))}

                    {failed && (
                        <li className="flex items-center justify-between px-4 py-3 text-[13px]">
                            <span className="text-slate-500">Couldn't load visits.</span>
                            <button type="button" onClick={() => load(cursor)} className="font-medium text-[#1a5dbf]">
                                Try again
                            </button>
                        </li>
                    )}

                    {!loading && !failed && cursor && (
                        <li>
                            <button
                                type="button"
                                onClick={() => load(cursor)}
                                className="min-h-[44px] w-full text-center text-[13px] font-medium text-[#1a5dbf] active:bg-slate-50"
                            >
                                Show earlier visits
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </section>
    );
}
