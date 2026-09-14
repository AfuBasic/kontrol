import { Head, router, useForm } from '@inertiajs/react';
import { Check, ChevronRight, Copy, Plus, Search, Users, X } from 'lucide-react';
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

const categoryOptions = ['all', 'staff', 'parent', 'student', 'member', 'contractor', 'visitor'];
const statusOptions = ['all', 'active', 'suspended'];

export default function AccessList({ organization, membership, members, filters }: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        issue_credential: true,
    });

    const hasPublicWindows = organization.access_policy === 'public_window';
    const activeMembers = members.data.filter((member) => member.status === 'active').length;
    const suspendedMembers = members.data.filter((member) => member.status === 'suspended').length;
    const credentialedMembers = members.data.filter((member) => member.active_credential).length;

    const initialsFor = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();

    const applyFilters = (next?: { search?: string; category?: string; status?: string }) => {
        const query = {
            search: next?.search ?? search,
            category: next?.category ?? category,
            status: next?.status ?? status,
        };

        router.get(
            '/org/access-list',
            {
                search: query.search || undefined,
                category: query.category !== 'all' ? query.category : undefined,
                status: query.status !== 'all' ? query.status : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

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

    return (
        <OrganizationLayout title="Access" contentClassName="max-w-4xl pb-28 sm:pb-12">
            <Head title={`${organization.name} - Access`} />

            <div className="space-y-4 sm:space-y-5">
                {/* Native Mobile Header: Page Title + Compact Action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Access</h1>
                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] sm:min-h-10 sm:px-4 sm:text-sm"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.25} />
                            <span>Add</span>
                        </button>
                    )}
                </div>

                {/* Internal Navigation: People, Arrivals, History */}
                <AccessTabs activeTab="people" hasPublicWindows={hasPublicWindows} />

                {/* Content Section: Directory or Empty State */}
                {members.total === 0 && !search && category === 'all' && status === 'all' ? (
                    /* Clean native empty state */
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Users className="h-6 w-6" strokeWidth={1.75} />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900 sm:text-xl">No one has been added yet</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                            Add staff, parents, contractors, or anyone who regularly needs access to {organization.name}.
                        </p>
                        {membership.is_admin && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(true)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.98]"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                                    <span>Add someone</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Directory with search, filters, and list */
                    <div className="space-y-3.5">
                        {/* Native Search Field - No heavy outer wrapper */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    applyFilters({ search: event.target.value });
                                }}
                                placeholder="Search by name or ID"
                                className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                            />
                        </div>

                        {/* Streamlined Quick Filters */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'staff', label: 'Staff' },
                                { id: 'parent', label: 'Parents' },
                                { id: 'contractor', label: 'Contractors' },
                                { id: 'student', label: 'Students' },
                                { id: 'visitor', label: 'Visitors' },
                            ].map((tab) => {
                                const isSelected = category === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            const nextCategory = isSelected ? 'all' : tab.id;
                                            setCategory(nextCategory);
                                            applyFilters({ category: nextCategory });
                                        }}
                                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                            isSelected
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Quiet Directory Count */}
                        <div className="flex items-center justify-between px-1 pt-1 text-xs font-medium text-slate-500">
                            <span>
                                {members.total} {members.total === 1 ? 'PERSON' : 'PEOPLE'}
                                {activeMembers > 0 && ` · ${activeMembers} active`}
                            </span>
                            {suspendedMembers > 0 && (
                                <span className="text-rose-600">{suspendedMembers} suspended</span>
                            )}
                        </div>

                        {/* People Directory List: Clean Rows with subtle dividers */}
                        {members.data.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center text-sm text-slate-500">
                                No matching people found. Try clearing your search or filter.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                                {members.data.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex min-h-[64px] items-center justify-between gap-3 px-3.5 py-3 transition hover:bg-slate-50/70 sm:px-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {/* Avatar Initials */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                                                {initialsFor(member.name)}
                                            </div>

                                            {/* Identity & Status */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-semibold text-slate-900">
                                                        {member.name}
                                                    </span>
                                                    {member.status === 'suspended' ? (
                                                        <span className="inline-flex shrink-0 items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                                                            Suspended
                                                        </span>
                                                    ) : !member.is_valid_now ? (
                                                        <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                            Pending
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    <span className="capitalize">{member.category}</span>
                                                    {member.identifier ? ` · ${member.identifier}` : ''}
                                                    {member.valid_until ? ` · Until ${member.valid_until}` : ' · Ongoing'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Action Affordance: Code & Chevron */}
                                        <div className="flex shrink-0 items-center gap-2">
                                            {member.active_credential ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-slate-900 ring-1 ring-slate-200/80">
                                                        {member.active_credential.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(member.active_credential!.code, member.active_credential!.id)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                        title="Copy code"
                                                    >
                                                        {copiedCodeId === member.active_credential.id ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : null}
                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Someone Sheet / Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-xs sm:items-center sm:p-4">
                        <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-sm shadow-xl sm:p-6">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3.5">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-950">Add someone</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">Create access for {organization.name}.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Full name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Janet Adebayo"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Relationship</label>
                                    <select
                                        value={data.category}
                                        onChange={(event) => setData('category', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 capitalize focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="parent">Parent</option>
                                        <option value="student">Student</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Contractor</option>
                                        <option value="visitor">Regular visitor</option>
                                    </select>
                                    {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">ID number (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU-2026-042"
                                        value={data.identifier}
                                        onChange={(event) => setData('identifier', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {errors.identifier && <p className="mt-1 text-xs text-rose-600">{errors.identifier}</p>}
                                </div>

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                                    <input
                                        type="checkbox"
                                        checked={data.issue_credential}
                                        onChange={(event) => setData('issue_credential', event.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <span>
                                        <span className="block text-xs font-semibold text-slate-900">Issue an access code now</span>
                                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                                            The code can be copied from this directory after the person is added.
                                        </span>
                                    </span>
                                </label>

                                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
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
