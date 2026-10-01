import { Head, Link, router, WhenVisible } from '@inertiajs/react';
import {
    ChevronRight,
    Mail,
    Plus,
    Users,
    Search,
    Loader2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import AccessHeader from '@/Components/Organization/AccessHeader';
import BulkInviteModal from '@/Pages/Organization/BulkInviteModal';
import SubscriptionGateSheet from '@/Components/Organization/SubscriptionGateSheet';
import { useSubscriptionGate } from '@/Hooks/useSubscriptionGate';


interface ValidityData {
    state: 'upcoming' | 'active' | 'expiring' | 'expired' | 'cancelled';
    starts_on_label: string;
    ends_on_label: string;
    days_left: number;
    elapsed_ratio: number;
}

interface RenewalData {
    auto: boolean;
    next_on_label: string | null;
    blocked_reason_label: string | null;
}

interface DeliveryData {
    total: number;
    sent: number;
    pending: number;
    failed: number;
}

interface BulkInviteItem {
    id: number;
    name: string | null;
    purpose: string | null;
    purpose_label: string | null;
    role: string | null;
    valid_from: string;
    valid_until: string;
    status: string;
    recipients_count: number;
    recipient_preview?: string[];
    renewals_count: number;
    validity?: ValidityData;
    renewal?: RenewalData;
    delivery?: DeliveryData;
}

type FieldTone = 'default' | 'positive' | 'warning' | 'muted';

interface Field {
    label: string;
    value: string;
    hint?: string;
    tone: FieldTone;
}

const FIELD_TONE: Record<FieldTone, string> = {
    default: 'text-[#071f4b]',
    positive: 'text-emerald-700',
    warning: 'text-amber-700',
    muted: 'text-slate-500',
};

const NOTICE_TONE = {
    warning: 'text-amber-700',
    error: 'text-rose-600',
    muted: 'text-slate-500',
} as const;

function FieldBlock({ field }: { field: Field }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] text-slate-500">{field.label}</p>
            <p className={`mt-0.5 truncate text-[14px] ${FIELD_TONE[field.tone]}`}>
                {field.value}
                {field.hint && <span> · {field.hint}</span>}
            </p>
        </div>
    );
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: { id: number; name: string };
    membership: { role: string; is_admin: boolean };
    bulkInvites: PaginatedData<BulkInviteItem>;
    filters?: { search?: string };
    currentStatus?: string;
}

export default function BulkInvitesIndex({
    organization,
    membership,
    bulkInvites,
    filters,
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const { gated, gateSheetOpen, closeGateSheet } = useSubscriptionGate();
    const [search, setSearch] = useState(filters?.search ?? '');

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== (filters?.search ?? '')) {
                router.get(
                    '/org/bulk-invites',
                    { search: search.trim() || undefined },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);


    return (
        <OrganizationLayout
            title="Access - Bulk Invites"
            transparentHeader
            contentClassName="w-full relative min-h-screen"
        >
            <Head title={`${organization.name} - Bulk Visitor Invites`} />

            <div className="mx-auto flex max-w-[540px] flex-col gap-4 px-4 pt-1 pb-24">
                <AccessHeader
                    activeTab="bulk_invites"
                    primaryAction={
                        membership.is_admin ? (
                            <button
                                type="button"
                                onClick={gated(() => setModalOpen(true))}
                                className="flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a5dbf] shadow-[0_2px_8px_rgba(26,93,191,0.10)] transition active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                New Group
                            </button>
                        ) : undefined
                    }
                />



                {/* Search Bar */}
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                        strokeWidth={2.5}
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full rounded-full border border-slate-200/90 bg-white py-2 pr-4 pl-10 text-xs !text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                    />
                </div>

                {!bulkInvites ? (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse px-4 py-3.5">
                                <div className="h-4 w-36 rounded bg-slate-100" />
                                <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                                <div className="mt-3.5 grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="h-2.5 w-14 rounded bg-slate-100" />
                                        <div className="h-3.5 w-16 rounded bg-slate-100" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-2.5 w-14 rounded bg-slate-100" />
                                        <div className="h-3.5 w-8 rounded bg-slate-100" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bulkInvites.data.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-xs">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">No groups yet</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Create one to send passes to several people at once.
                        </p>
                        {membership.is_admin && (
                            <button
                                type="button"
                                onClick={gated(() => setModalOpen(true))}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-4 py-2 text-[12px] font-semibold text-[#1a5dbf] shadow-[0_2px_8px_rgba(26,93,191,0.10)] transition active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                New Group
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs">
                        {bulkInvites.data.map((invite) => {
                            const name = invite.name || invite.purpose_label || 'Untitled group';
                            const totalPeople = invite.recipients_count || 0;
                            const preview = invite.recipient_preview ?? [];
                            const othersCount = Math.max(0, totalPeople - preview.length);
                            const meta = [invite.name ? invite.purpose_label : null, invite.role].filter(Boolean);

                            const validity = invite.validity;
                            const state = validity?.state ?? 'active';
                            const renewal = invite.renewal;
                            const delivery = invite.delivery;
                            const isDeemphasized = state === 'expired' || state === 'cancelled';
                            const isRenewalBlocked = !isDeemphasized && !!renewal?.blocked_reason_label;

                            const validityField = ((): Field | null => {
                                switch (state) {
                                    case 'cancelled':
                                        return { label: 'Status', value: 'Cancelled', tone: 'muted' };
                                    case 'expired':
                                        return { label: 'Ended', value: validity?.ends_on_label ?? '', tone: 'muted' };
                                    case 'upcoming':
                                        return { label: 'Starts', value: validity?.starts_on_label ?? '', tone: 'default' };
                                    case 'expiring': {
                                        const days = validity?.days_left ?? 0;
                                        return {
                                            label: 'Expires',
                                            value: validity?.ends_on_label ?? '',
                                            hint: days <= 0 ? 'Today' : days === 1 ? '1 day left' : `${days} days left`,
                                            tone: 'warning',
                                        };
                                    }
                                    default:
                                        return { label: 'Valid until', value: validity?.ends_on_label ?? '', tone: 'default' };
                                }
                            })();

                            const renewalField: Field | null =
                                state === 'cancelled'
                                    ? null
                                    : isRenewalBlocked
                                      ? { label: 'Auto-renew', value: 'Paused', tone: 'warning' }
                                      : {
                                            label: 'Auto-renew',
                                            value: renewal?.auto ? 'On' : 'Off',
                                            tone: isDeemphasized ? 'muted' : renewal?.auto ? 'positive' : 'default',
                                        };

                            let notice: { text: string; tone: 'warning' | 'error' | 'muted' } | null = null;
                            if (isRenewalBlocked && renewal?.blocked_reason_label) {
                                const reason = renewal.blocked_reason_label;
                                notice = { text: reason.charAt(0).toUpperCase() + reason.slice(1), tone: 'warning' };
                            } else if (delivery && delivery.failed > 0) {
                                notice = { text: `${delivery.failed} not delivered`, tone: 'error' };
                            } else if (delivery && delivery.pending > 0) {
                                notice = { text: `Sending to ${delivery.pending}…`, tone: 'muted' };
                            }

                            return (
                                <Link
                                    key={invite.id}
                                    href={`/org/bulk-invites/${invite.id}`}
                                    className="block px-4 py-3.5 transition active:bg-slate-50"
                                >
                                    <div className={isDeemphasized ? 'opacity-60' : undefined}>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-[#071f4b]">
                                                {name}
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.25} />
                                        </div>

                                        {preview.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {preview.map((email) => (
                                                    <span
                                                        key={email}
                                                        className="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                                                    >
                                                        <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                                        <span className="truncate">{email}</span>
                                                    </span>
                                                ))}
                                                {othersCount > 0 && (
                                                    <span className="self-center text-[11px] font-medium text-slate-400">
                                                        +{othersCount} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-[13px] text-slate-500">
                                                {totalPeople > 0 ? `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'}` : 'No people yet'}
                                            </p>
                                        )}

                                        {meta.length > 0 && (
                                            <p className="mt-0.5 truncate text-[12px] text-slate-500">{meta.join(' · ')}</p>
                                        )}

                                        <div className="mt-3 grid grid-cols-2 gap-4">
                                            {validityField && <FieldBlock field={validityField} />}
                                            {renewalField && <FieldBlock field={renewalField} />}
                                        </div>

                                        {notice && (
                                            <p className={`mt-2.5 text-[12px] font-medium ${NOTICE_TONE[notice.tone]}`}>
                                                {notice.text}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}

                        {bulkInvites.next_page_url && (
                            <WhenVisible
                                always
                                params={{
                                    data: {
                                        page: bulkInvites.current_page + 1,
                                        search: search.trim() || undefined,
                                    },
                                    only: ['bulkInvites'],
                                    preserveUrl: true,
                                }}
                                fallback={
                                    <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-slate-400">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                        <span>Loading more groups...</span>
                                    </div>
                                }
                            >
                                <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    <span>Loading more groups...</span>
                                </div>
                            </WhenVisible>
                        )}
                    </div>
                )}
            </div>

            <BulkInviteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

            {/* Subscription Gate Sheet */}
            <SubscriptionGateSheet open={gateSheetOpen} onClose={closeGateSheet} />
        </OrganizationLayout>
    );
}
