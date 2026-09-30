import { Head, Link, router, usePage, WhenVisible } from '@inertiajs/react';
import {
    ChevronRight,
    Mail,
    Plus,
    RefreshCw,
    Users,
    AlertCircle,
    CheckCircle2,
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
    role: string | null;
    valid_from: string;
    valid_until: string;
    status: string;
    recipients_count: number;
    renewals_count: number;
    validity?: ValidityData;
    renewal?: RenewalData;
    delivery?: DeliveryData;
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

    const page = usePage();
    const auth = (page.props as any).auth || {};
    const subscription = auth?.user?.resident_subscription;

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
                            <div key={i} className="flex min-h-[56px] animate-pulse items-center justify-between p-4">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-4 w-40 rounded bg-slate-100" />
                                    <div className="h-3 w-28 rounded bg-slate-100" />
                                    <div className="h-3.5 w-52 rounded bg-slate-100" />
                                </div>
                                <div className="h-4 w-4 rounded bg-slate-100" />
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
                            const name = invite.name || invite.purpose || 'Untitled group';
                            const totalPeople = invite.recipients_count || 0;
                            const peopleLabel = `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'}`;
                            const tag = invite.role || (invite.name ? invite.purpose : null);

                            const validity = invite.validity;
                            const state = validity?.state ?? 'active';
                            const renewal = invite.renewal;
                            const delivery = invite.delivery;

                            // Validity sentence
                            let validityText = '';
                            let validityColorClass = 'text-slate-600';

                            if (state === 'cancelled') {
                                validityText = 'Cancelled';
                                validityColorClass = 'text-slate-400';
                            } else if (state === 'expired') {
                                validityText = `Expired ${validity?.ends_on_label || ''}`.trim();
                                validityColorClass = 'text-slate-400';
                            } else if (state === 'upcoming') {
                                validityText = `Starts ${validity?.starts_on_label || ''}`.trim();
                                validityColorClass = 'text-slate-600';
                            } else if (renewal?.blocked_reason_label) {
                                validityText = `Won't renew: ${renewal.blocked_reason_label}`;
                                validityColorClass = 'text-amber-600 font-medium';
                            } else if (renewal?.auto) {
                                validityText = `Valid until ${validity?.ends_on_label || ''} · renews automatically`;
                                validityColorClass = 'text-slate-600';
                            } else if (state === 'expiring') {
                                const days = validity?.days_left ?? 0;
                                const dayStr = days === 1 ? '1 day' : `${days} days`;
                                validityText = `Expires in ${dayStr} · ${validity?.ends_on_label || ''}`;
                                validityColorClass = 'text-amber-600 font-medium';
                            } else {
                                const days = validity?.days_left ?? 0;
                                const dayStr = days === 1 ? '1 day left' : `${days} days left`;
                                validityText = `Valid until ${validity?.ends_on_label || ''} · ${dayStr}`;
                                validityColorClass = 'text-slate-600';
                            }

                            // Active progress hairline (active or expiring)
                            const showProgress = state === 'active' || state === 'expiring';
                            const progressRatio = Math.max(0, Math.min(1, validity?.elapsed_ratio ?? 0));
                            const progressColor = (state === 'expiring' && !renewal?.auto) ? 'bg-amber-500' : 'bg-[#1a5dbf]';

                            // Delivery notice (only when not fully delivered)
                            let deliveryNotice: { text: string; isError: boolean } | null = null;
                            if (delivery) {
                                if (delivery.failed > 0) {
                                    deliveryNotice = {
                                        text: `${delivery.failed} not delivered`,
                                        isError: true,
                                    };
                                } else if (delivery.pending > 0) {
                                    deliveryNotice = {
                                        text: `Sending to ${delivery.pending}…`,
                                        isError: false,
                                    };
                                }
                            }

                            const isDeemphasized = state === 'expired' || state === 'cancelled';

                            return (
                                <Link
                                    key={invite.id}
                                    href={`/org/bulk-invites/${invite.id}`}
                                    className={`block min-h-[56px] p-4 transition hover:bg-slate-50 active:bg-slate-100 ${
                                        isDeemphasized ? 'opacity-60' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            {/* 1. Name */}
                                            <div className="truncate text-[15px] font-medium text-slate-900">
                                                {name}
                                            </div>

                                            {/* 2. Who */}
                                            <div className="text-[12px] text-slate-500">
                                                <span>{peopleLabel}</span>
                                                {tag && <span> · {tag}</span>}
                                            </div>

                                            {/* 3. Validity Line */}
                                            <div className={`text-[13px] ${validityColorClass}`}>
                                                {validityText}
                                            </div>

                                            {/* 4. Validity progress hairline */}
                                            {showProgress && (
                                                <div className="pt-0.5">
                                                    <div className="h-[2px] w-full overflow-hidden bg-slate-100">
                                                        <div
                                                            className={`h-full ${progressColor} transition-all duration-300`}
                                                            style={{ width: `${progressRatio * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* 5. Delivery notice (only if not fully delivered) */}
                                            {deliveryNotice && (
                                                <div
                                                    className={`pt-0.5 text-[12px] font-medium ${
                                                        deliveryNotice.isError ? 'text-rose-600' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {deliveryNotice.text}
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
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
