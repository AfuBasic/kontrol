import { Head, router } from '@inertiajs/react';
import {
    KeyRound,
    Search,
    RefreshCw,
    XCircle,
    Shield,
    Clock,
    CheckCircle2,
    Calendar,
    User,
} from 'lucide-react';
import React, { useState } from 'react';
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
        if (confirm('Are you sure you want to renew this credential? The existing code will be superseded and a new one issued.')) {
            router.post(`/org/credentials/${id}/renew`);
        }
    };

    const handleRevoke = (id: number) => {
        if (confirm('Are you sure you want to revoke this credential? Access will be denied immediately.')) {
            router.post(`/org/credentials/${id}/revoke`);
        }
    };

    return (
        <OrganizationLayout title="Credentials">
            <Head title={`${organization.name} - Credentials`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-400" />
                            Access Credentials
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Active, scheduled, and past security access codes issued for {organization.name}.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                                <tr>
                                    <th className="py-3 px-4">Pass Code</th>
                                    <th className="py-3 px-4">Member / Name</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Expires</th>
                                    <th className="py-3 px-4">Issued By</th>
                                    {membership.is_admin && <th className="py-3 px-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {credentials.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                                            No credentials found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    credentials.data.map((credential) => (
                                        <tr key={credential.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-sm text-indigo-400">
                                                {credential.code}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-zinc-100">{credential.visitor_name}</div>
                                                {credential.member?.identifier && (
                                                    <div className="text-[11px] font-mono text-zinc-500">
                                                        {credential.member.identifier}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    {credential.member?.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        credential.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : credential.status === 'superseded'
                                                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                                            : credential.status === 'revoked'
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}
                                                >
                                                    {credential.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-zinc-400">
                                                {credential.expires_at_human || 'Never'}
                                            </td>
                                            <td className="py-3.5 px-4 text-zinc-400">
                                                {credential.issued_by?.name || 'System'}
                                            </td>
                                            {membership.is_admin && (
                                                <td className="py-3.5 px-4 text-right space-x-2">
                                                    {credential.status === 'active' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRenew(credential.id)}
                                                                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium inline-flex items-center gap-1"
                                                            >
                                                                <RefreshCw className="w-3 h-3" /> Renew
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRevoke(credential.id)}
                                                                className="text-rose-400 hover:text-rose-300 text-xs font-medium inline-flex items-center gap-1"
                                                            >
                                                                <XCircle className="w-3 h-3" /> Revoke
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OrganizationLayout>
    );
}
