import { Head, router, Link } from '@inertiajs/react';
import { KeyRound, Search, RefreshCw, Clock, CheckCircle2, Calendar, User, ArrowLeft, Shield, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Credential {
    id: number;
    code: string;
    status: 'active' | 'scheduled' | 'used' | 'expired' | 'revoked' | 'superseded';
    visitor_name: string;
    member: {
        id: number;
        name: string;
        identifier: string | null;
        category: string;
    } | null;
    issued_by: {
        id: number;
        name: string;
    } | null;
    expires_at: string | null;
    expires_at_human: string | null;
    created_at: string;
}

interface PaginatedCredentials {
    data: Credential[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    credentials: PaginatedCredentials;
    filters: {
        status?: string;
        search?: string;
    };
}

export default function Credentials({ organization, membership, credentials, filters }: Props) {
    const handleRenew = (id: number) => {
        if (confirm('Renew this access code? A fresh active code will be issued.')) {
            router.post(`/org/credentials/${id}/renew`);
        }
    };

    const handleRevoke = (id: number) => {
        if (confirm('Revoke this access code? Access will be denied immediately.')) {
            router.post(`/org/credentials/${id}/revoke`);
        }
    };

    const hasPublicWindows = organization.access_policy === 'public_window';

    return (
        <OrganizationLayout title="Access - Codes">
            <Head title={`${organization.name} - Access Codes`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Access</h1>
                        <p className="mt-0.5 text-sm text-stone-500">All issued gate admission codes for {organization.name}.</p>
                    </div>
                </div>

                {/* Unified Access Tabs */}
                <AccessTabs activeTab="people" />

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900">
                    <p>
                        Access codes are automatically linked to each person. You can also manage codes directly from the{' '}
                        <Link href="/org/access-list" className="font-bold text-indigo-700 underline">
                            People tab
                        </Link>
                        .
                    </p>
                </div>

                {/* Credentials List */}
                <div className="space-y-3">
                    {credentials.data.length === 0 ? (
                        <div className="rounded-3xl border border-stone-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                                <KeyRound className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No access codes found</h3>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
                                Issued access codes will appear here with their current validity status.
                            </p>
                        </div>
                    ) : (
                        credentials.data.map((c) => (
                            <div
                                key={c.id}
                                className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:p-5"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/60 bg-stone-100 text-sm font-bold text-slate-800">
                                        <KeyRound className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className="rounded border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-sm font-bold text-slate-900 sm:text-base">
                                                {c.code}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-800">{c.member ? c.member.name : c.visitor_name}</span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                                    c.status === 'active'
                                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border border-stone-200 bg-stone-100 text-stone-600'
                                                }`}
                                            >
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-500">Expires {c.expires_at_human || 'soon'}</p>
                                    </div>
                                </div>

                                {membership.is_admin && c.status === 'active' && (
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleRenew(c.id)}
                                            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                                        >
                                            Renew
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(c.id)}
                                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
