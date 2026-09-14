import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus,
    X,
    ChevronRight,
    ArrowRight,
    KeyRound,
    Copy,
    Check,
} from 'lucide-react';
import React, { useState } from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Member {
    id: number;
    name: string;
    identifier: string | null;
    category: string;
    status: string;
    valid_from: string | null;
    valid_until: string | null;
    is_valid_now: boolean;
    active_credential: {
        id: number;
        code: string;
        expires_at: string | null;
        expires_at_human: string | null;
        status: string;
    } | null;
    created_at: string;
}

interface PaginatedMembers {
    data: Member[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    members: PaginatedMembers;
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

export default function AccessList({ organization, membership, members, filters }: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        issue_credential: true,
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/org/access-list', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const copyCode = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedCodeId(id);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    const hasPublicWindows = organization.access_policy === 'public_window';

    return (
        <OrganizationLayout title="Access - People">
            <Head title={`${organization.name} - Access`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header & Sub-Navigation */}
                <div className="flex items-baseline justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Access
                    </h1>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add someone</span>
                        </button>
                    )}
                </div>

                {/* Sub Navigation */}
                <AccessTabs
                    activeTab="people"
                    hasPublicWindows={hasPublicWindows}
                />

                {/* Editorial People List */}
                {members.data.length === 0 ? (
                    <div className="py-6 space-y-2">
                        <p className="text-base sm:text-lg font-bold text-slate-800">
                            No one has regular access yet.
                        </p>
                        <p className="text-sm text-slate-500">
                            Add staff, parents, contractors or anyone who regularly needs access to {organization.name}.
                        </p>
                        {membership.is_admin && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(true)}
                                    className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    <span>Add someone</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {members.data.map((member) => (
                            <div
                                key={member.id}
                                className="py-4 first:pt-0 flex items-center justify-between gap-4 group"
                            >
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <p className="text-base font-bold text-slate-900">
                                            {member.name}
                                        </p>
                                        <span className="text-xs font-medium text-slate-400 capitalize">
                                            · {member.category}
                                        </span>
                                        {member.status === 'suspended' && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                                                Suspended
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        {member.active_credential ? (
                                            <>
                                                <span>Access code:</span>
                                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {member.active_credential.code}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(member.active_credential!.code, member.active_credential!.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Copy code"
                                                >
                                                    {copiedCodeId === member.active_credential.id ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <span>·</span>
                                                <span>Expires {member.active_credential.expires_at_human || 'soon'}</span>
                                            </>
                                        ) : (
                                            <span>No active code</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {member.active_credential && (
                                        <span className="text-xs font-bold text-emerald-600 hidden sm:inline">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Person Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Add someone to {organization.name}</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Janet Adebayo"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">Role</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize text-sm"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="parent">Parent</option>
                                        <option value="student">Student</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Contractor</option>
                                        <option value="visitor">Regular Visitor</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">
                                        ID Number <span className="text-slate-400 normal-case font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU-2026-042"
                                        value={data.identifier}
                                        onChange={(e) => setData('identifier', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.issue_credential}
                                            onChange={(e) => setData('issue_credential', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-slate-800 font-semibold text-xs">
                                            Issue access code immediately
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'Adding...' : 'Add person'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
