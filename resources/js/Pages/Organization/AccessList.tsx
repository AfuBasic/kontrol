import { Head, router, useForm } from '@inertiajs/react';
import { Check, ChevronRight, Copy, Filter, KeyRound, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';
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
        <OrganizationLayout title="Access - People" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Access`} />

            <div className="space-y-5">
                <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="min-w-0 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-2xl min-w-0">
                                <p className="text-sm font-black text-[#0b4aa2]">Access workspace</p>
                                <h1 className="mt-1.5 max-w-full text-2xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                                    People allowed into {organization.name}
                                </h1>
                                <p className="mt-3 text-sm leading-6 font-semibold text-slate-500 sm:text-base">
                                    A directory of staff, members, contractors, and recurring visitors tied to your organization.
                                </p>
                            </div>

                            {membership.is_admin && (
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(true)}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.20)] active:scale-[0.99]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add person
                                </button>
                            )}
                        </div>

                        <div className="mt-6">
                            <AccessTabs activeTab="people" hasPublicWindows={hasPublicWindows} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                        <div className="rounded-[1.5rem] bg-[#0f172a] p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.15)]">
                            <p className="text-2xl font-black">{members.total}</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">People</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
                            <p className="text-2xl font-black text-emerald-700">{activeMembers}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">Active</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
                            <p className="text-2xl font-black text-slate-950">{credentialedMembers}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">With codes</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
                    <aside className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-5">
                        <form
                            noValidate
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters();
                            }}
                        >
                            <div>
                                <label className="text-sm font-black text-slate-950">Find someone</label>
                                <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200/80 focus-within:ring-2 focus-within:ring-[#0b4aa2]/30">
                                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Name or ID"
                                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:ring-0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-black text-slate-950">Relationship</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {categoryOptions.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                                setCategory(option);
                                                applyFilters({ category: option });
                                            }}
                                            className={`rounded-full px-3 py-2 text-xs font-black capitalize transition ${
                                                category === option
                                                    ? 'bg-[#0f172a] text-white'
                                                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-black text-slate-950">State</label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                                setStatus(option);
                                                applyFilters({ status: option });
                                            }}
                                            className={`rounded-2xl px-3 py-2.5 text-xs font-black capitalize transition ${
                                                status === option
                                                    ? 'bg-[#eaf2ff] text-[#0b4aa2] ring-1 ring-[#bfdbfe]'
                                                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 text-sm font-black text-white"
                            >
                                <Filter className="h-4 w-4" />
                                Apply search
                            </button>
                        </form>

                        {suspendedMembers > 0 && (
                            <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-xs leading-5 font-bold text-rose-700">
                                {suspendedMembers} {suspendedMembers === 1 ? 'person is' : 'people are'} suspended.
                            </p>
                        )}
                    </aside>

                    <div className="rounded-[1.5rem] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem]">
                        {members.data.length === 0 ? (
                            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_12rem] sm:p-8">
                                <div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0b4aa2]">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Build a clear access list.</h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 font-semibold text-slate-500">
                                        Start with the people who regularly come to {organization.name}. Kontrol will keep their access state and
                                        active code visible here.
                                    </p>
                                </div>
                                {membership.is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(true)}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-black text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add first person
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {members.data.map((member) => (
                                    <article
                                        key={member.id}
                                        className="grid gap-4 p-4 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] sm:p-5"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                                                {initialsFor(member.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="truncate text-base font-black text-slate-950">{member.name}</h2>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[11px] font-black ${
                                                            member.status === 'suspended'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : member.is_valid_now
                                                                  ? 'bg-emerald-50 text-emerald-700'
                                                                  : 'bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {member.status === 'suspended'
                                                            ? 'Suspended'
                                                            : member.is_valid_now
                                                              ? 'Allowed'
                                                              : 'Not active yet'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm font-bold text-slate-500 capitalize">
                                                    {member.category}
                                                    {member.identifier ? ` - ${member.identifier}` : ''}
                                                </p>
                                                <p className="mt-2 text-xs font-semibold text-slate-400">
                                                    Valid {member.valid_from || 'now'} to {member.valid_until || 'until revoked'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-slate-50 px-3 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                                            {member.active_credential ? (
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-1.5 text-xs font-black text-slate-500">
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                        Active code
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="rounded-xl bg-white px-3 py-1.5 font-mono text-sm font-black tracking-wide text-slate-950 ring-1 ring-slate-200">
                                                            {member.active_credential.code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyCode(member.active_credential!.code, member.active_credential!.id)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900"
                                                            title="Copy access code"
                                                        >
                                                            {copiedCodeId === member.active_credential.id ? (
                                                                <Check className="h-4 w-4 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    No active code
                                                </div>
                                            )}

                                            <ChevronRight className="h-5 w-5 text-slate-300" />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
                        <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 text-sm shadow-2xl sm:p-6">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-950">Add someone</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Create access for {organization.name}.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleCreate} className="space-y-4 pt-5">
                                <div>
                                    <label className="text-sm font-black text-slate-950">Full name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Janet Adebayo"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                                    />
                                    {errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-black text-slate-950">Relationship</label>
                                    <select
                                        value={data.category}
                                        onChange={(event) => setData('category', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 capitalize focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="parent">Parent</option>
                                        <option value="student">Student</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Contractor</option>
                                        <option value="visitor">Regular visitor</option>
                                    </select>
                                    {errors.category && <p className="mt-1 text-xs font-bold text-rose-600">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-black text-slate-950">ID number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU-2026-042"
                                        value={data.identifier}
                                        onChange={(event) => setData('identifier', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                                    />
                                    {errors.identifier && <p className="mt-1 text-xs font-bold text-rose-600">{errors.identifier}</p>}
                                </div>

                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                    <input
                                        type="checkbox"
                                        checked={data.issue_credential}
                                        onChange={(event) => setData('issue_credential', event.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0b4aa2] focus:ring-[#0b4aa2]"
                                    />
                                    <span>
                                        <span className="block text-sm font-black text-slate-950">Issue an access code now</span>
                                        <span className="mt-1 block text-xs leading-5 font-semibold text-slate-500">
                                            The code can be copied from this directory after the person is added.
                                        </span>
                                    </span>
                                </label>

                                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="rounded-2xl px-4 py-2.5 text-sm font-black text-slate-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-2xl bg-[#0f172a] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
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
