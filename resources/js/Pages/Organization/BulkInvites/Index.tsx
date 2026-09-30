import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronRight,
    Mail,
    Plus,
    RefreshCw,
    Users,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import React, { useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import AccessHeader from '@/Components/Organization/AccessHeader';
import BulkInviteModal from '../BulkInviteModal';

interface Recipient {
    id: number;
    email: string;
    status: string;
    delivery_status: 'pending' | 'queued' | 'sent' | 'failed';
}

interface BulkInviteItem {
    id: number;
    name: string | null;
    purpose: string | null;
    role: string | null;
    valid_from: string;
    valid_until: string;
    auto_renew: boolean;
    status: string;
    recipients_count: number;
    renewals_count: number;
    sent_recipients_count?: number;
    failed_recipients_count?: number;
    created_at: string;
    recipients: Recipient[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: { id: number; name: string };
    membership: { role: string; is_admin: boolean };
    bulkInvites: PaginatedData<BulkInviteItem>;
    currentStatus?: string;
}

export default function BulkInvitesIndex({
    organization,
    membership,
    bulkInvites,
    currentStatus = 'all',
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);

    const handleTabChange = (status: string) => {
        router.get(
            '/org/bulk-invites',
            { status: status === 'all' ? undefined : status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'expired', label: 'Expired' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <OrganizationLayout
            title="Access - Bulk Invites"
            transparentHeader
            contentClassName="w-full relative min-h-screen"
        >
            <Head title={`${organization.name} - Bulk Visitor Invites`} />

            <div className="mx-auto flex max-w-[540px] flex-col gap-4 px-4 pt-1 pb-24">
                <AccessHeader
                    activeTab="visitors"
                    primaryAction={
                        membership.is_admin ? (
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a5dbf] shadow-xs transition hover:bg-[#e2edff] active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                New Bulk Invite
                            </button>
                        ) : undefined
                    }
                />

                <div className="flex flex-col gap-1 px-1">
                    <h2 className="text-[17px] font-bold text-slate-900">Bulk Invite Batches</h2>
                    <p className="text-xs text-slate-500">
                        Group access passes issued with automatic renewal and delivery tracking.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                    {tabs.map((tab) => {
                        const isActive = currentStatus === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {bulkInvites.data.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-xs">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">No bulk invites found</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {currentStatus === 'all'
                                ? 'Create a bulk visitor invite to generate passes and deliver branded PDF passes to multiple recipients simultaneously.'
                                : `There are no bulk invites currently with "${currentStatus}" status.`}
                        </p>
                        {membership.is_admin && currentStatus === 'all' && (
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Bulk Invite
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs">
                        {bulkInvites.data.map((invite) => {
                            const isActive = invite.status === 'active';
                            const totalRecipients = invite.recipients_count || 0;
                            const sentCount = invite.sent_recipients_count ?? 0;
                            const failedCount = invite.failed_recipients_count ?? 0;

                            return (
                                <Link
                                    key={invite.id}
                                    href={`/org/bulk-invites/${invite.id}`}
                                    className="block p-4 transition hover:bg-slate-50 active:bg-slate-100"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-bold text-slate-900">
                                                    {invite.name || `Batch #${invite.id}`}
                                                </span>
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        isActive
                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : invite.status === 'cancelled'
                                                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                                            : 'border border-slate-200 bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {invite.status}
                                                </span>
                                                {invite.auto_renew && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                        <RefreshCw className="h-2.5 w-2.5" />
                                                        Auto-renew on
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                                <span className="font-semibold text-slate-700">
                                                    {totalRecipients} {totalRecipients === 1 ? 'recipient' : 'recipients'}
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    Valid {invite.valid_from} – {invite.valid_until}
                                                </span>
                                            </div>

                                            {/* Delivery Summary Badge Indicators */}
                                            <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                                                {sentCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {sentCount} sent
                                                    </span>
                                                )}
                                                {failedCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {failedCount} failed
                                                    </span>
                                                )}
                                                {invite.renewals_count > 0 && (
                                                    <span className="text-slate-400">
                                                        {invite.renewals_count} {invite.renewals_count === 1 ? 'renewal cycle' : 'renewal cycles'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Preview pill emails */}
                                            {invite.recipients && invite.recipients.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {invite.recipients.slice(0, 3).map((r) => (
                                                        <span
                                                            key={r.id}
                                                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                                                        >
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            {r.email}
                                                        </span>
                                                    ))}
                                                    {totalRecipients > 3 && (
                                                        <span className="self-center text-[11px] font-medium text-slate-400">
                                                            +{totalRecipients - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <BulkInviteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </OrganizationLayout>
    );
}
