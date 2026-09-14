import { Head, useForm, router, Link } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    KeyRound,
    Edit2,
    X,
    CheckCircle2,
    Clock,
    RefreshCw,
    Shield,
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
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        issue_credential: true,
    });

    const editForm = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: '',
        valid_until: '',
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

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        editForm.patch(`/org/access-list/${editingMember.id}`, {
            onSuccess: () => setEditingMember(null),
        });
    };

    const handleSuspend = (id: number) => {
        if (confirm('Suspend access for this person? Their active access code will be revoked.')) {
            router.post(`/org/access-list/${id}/suspend`);
        }
    };

    const handleActivate = (id: number) => {
        router.post(`/org/access-list/${id}/activate`);
    };

    const handleIssueCredential = (memberId: number) => {
        router.post(`/org/credentials/issue/${memberId}`);
    };

    const handleRenewCredential = (credentialId: number) => {
        router.post(`/org/credentials/${credentialId}/renew`);
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

            <div className="space-y-6">
                {/* Header & Sub-Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Access
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Manage people, access codes, and daily arrivals for {organization.name}.
                        </p>
                    </div>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add someone</span>
                        </button>
                    )}
                </div>

                {/* Unified Access Tabs */}
                <AccessTabs
                    activeTab="people"
                    hasPublicWindows={hasPublicWindows}
                />

                {/* People List / Cards */}
                <div className="space-y-3">
                    {members.data.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-12 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No people added yet</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                                Add staff, students, parents, or regular contractors who need access for {organization.name}.
                            </p>
                            {membership.is_admin && (
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(true)}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add first person</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        members.data.map((member) => (
                            <div
                                key={member.id}
                                className="rounded-2xl bg-white border border-stone-200/80 p-4 sm:p-5 shadow-xs hover:border-stone-300 transition-all space-y-3"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-slate-800 font-bold text-sm shrink-0 mt-0.5">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                                    {member.name}
                                                </h3>
                                                <span className="text-[11px] capitalize px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium border border-stone-200/60">
                                                    {member.category}
                                                </span>
                                                {member.status === 'suspended' && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                                        Suspended
                                                    </span>
                                                )}
                                            </div>
                                            {member.identifier && (
                                                <p className="text-xs text-stone-500 font-mono mt-0.5">
                                                    ID: {member.identifier}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    {membership.is_admin && (
                                        <div className="flex items-center gap-2 self-start sm:self-auto pt-1 sm:pt-0">
                                            {member.status === 'active' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSuspend(member.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                                                >
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleActivate(member.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                                                >
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Integrated Access Code & Expiry Info */}
                                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600 bg-stone-50/60 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3.5 sm:px-5 rounded-b-2xl">
                                    <div className="flex items-center gap-3">
                                        <KeyRound className="w-4 h-4 text-stone-400 shrink-0" />
                                        {member.active_credential ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-stone-500">Access code:</span>
                                                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                                    {member.active_credential.code}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(member.active_credential!.code, member.active_credential!.id)}
                                                    className="p-1 text-stone-400 hover:text-slate-800 transition-colors"
                                                    title="Copy access code"
                                                >
                                                    {copiedCodeId === member.active_credential.id ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <span className="text-stone-400">•</span>
                                                <span className="text-stone-500">
                                                    Expires {member.active_credential.expires_at_human || 'soon'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-stone-400 italic">No active access code</span>
                                        )}
                                    </div>

                                    {/* Renew / Issue Actions */}
                                    {membership.is_admin && member.status === 'active' && (
                                        <div className="flex items-center gap-2">
                                            {member.active_credential ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRenewCredential(member.active_credential!.id)}
                                                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    <span>Renew code</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleIssueCredential(member.id)}
                                                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1"
                                                >
                                                    <KeyRound className="w-3 h-3" />
                                                    <span>Issue access code</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Person Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xl text-xs sm:text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                                <h3 className="text-base font-bold text-slate-900">Add Someone to {organization.name}</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Janet Adebayo"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">
                                        Role / Classification
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize"
                                    >
                                        <option value="staff">Staff Member</option>
                                        <option value="student">Student / Pupil</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Regular Contractor</option>
                                        <option value="visitor">Regular Visitor</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">
                                        Identifier / ID Number <span className="text-stone-400">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU-2026-042 or Staff ID"
                                        value={data.identifier}
                                        onChange={(e) => setData('identifier', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.issue_credential}
                                            onChange={(e) => setData('issue_credential', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
                                        />
                                        <span className="text-slate-700 font-medium">
                                            Issue access code immediately
                                        </span>
                                    </label>
                                    <p className="text-xs text-stone-500 ml-6 mt-0.5">
                                        Generates an active credential for estate gate admission.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-stone-600 hover:text-slate-900 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 shadow-xs"
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
