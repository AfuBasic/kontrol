import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Shield,
    CheckCircle2,
    XCircle,
    KeyRound,
    Edit2,
    X,
    Filter,
    Calendar,
} from 'lucide-react';
import React, { useState } from 'react';
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
        if (confirm('Are you sure you want to suspend this member? Their active credential will be revoked.')) {
            router.post(`/org/access-list/${id}/suspend`);
        }
    };

    const handleActivate = (id: number) => {
        router.post(`/org/access-list/${id}/activate`);
    };

    return (
        <OrganizationLayout title="Access List">
            <Head title={`${organization.name} - Access List`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Access List
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Manage authorized members, students, staff, and recurring contractors for {organization.name}.
                        </p>
                    </div>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Member
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                                <tr>
                                    <th className="py-3 px-4">Member Name</th>
                                    <th className="py-3 px-4">Identifier</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Active Credential</th>
                                    <th className="py-3 px-4">Valid Until</th>
                                    {membership.is_admin && <th className="py-3 px-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {members.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                                            No access members found. Click "Add Member" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    members.data.map((member) => (
                                        <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3.5 px-4 font-medium text-zinc-100">
                                                {member.name}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-zinc-400">
                                                {member.identifier || '—'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    {member.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        member.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    }`}
                                                >
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {member.active_credential ? (
                                                    <span className="font-mono font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                                        {member.active_credential.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500 italic">None active</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-zinc-400">
                                                {member.valid_until || 'Permanent'}
                                            </td>
                                            {membership.is_admin && (
                                                <td className="py-3.5 px-4 text-right space-x-2">
                                                    {member.status === 'active' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSuspend(member.id)}
                                                            className="text-rose-400 hover:text-rose-300 text-xs font-medium"
                                                        >
                                                            Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActivate(member.id)}
                                                            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                                                        >
                                                            Activate
                                                        </button>
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

                {/* Create Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                                <h3 className="text-sm font-semibold text-white">Add New Access Member</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded text-zinc-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. Dr. Alex Morgan"
                                    />
                                    {errors.name && <p className="text-rose-400 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">
                                        Identifier / ID Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.identifier}
                                        onChange={(e) => setData('identifier', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. STF-2024-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">Category</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="student">Student</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Contractor</option>
                                        <option value="visitor">Visitor</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-zinc-300 font-medium mb-1">Valid From</label>
                                        <input
                                            type="date"
                                            value={data.valid_from}
                                            onChange={(e) => setData('valid_from', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-300 font-medium mb-1">Valid Until</label>
                                        <input
                                            type="date"
                                            value={data.valid_until}
                                            onChange={(e) => setData('valid_until', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="issue_credential"
                                        checked={data.issue_credential}
                                        onChange={(e) => setData('issue_credential', e.target.checked)}
                                        className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="issue_credential" className="text-zinc-300 cursor-pointer">
                                        Generate and issue access credential code immediately
                                    </label>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Save Member'}
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
