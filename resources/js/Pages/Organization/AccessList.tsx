import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    Check,
    ChevronRight,
    Clock,
    Copy,
    DoorOpen,
    Plus,
    Radio,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import AccessActionMenu from '@/Components/Organization/AccessActionMenu';
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



interface PublicWindowItem {
    id: number;
    name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    notes: string | null;
    is_open_now: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
        arrival_confirmation_required?: boolean;
        confirmation_window_minutes?: number;
        confirmation_escalation?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    members: PaginatedMembers;
    windows?: PublicWindowItem[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

const categoryOptions = ['all', 'staff', 'parent', 'student', 'member', 'contractor', 'visitor'];
const statusOptions = ['all', 'active', 'suspended'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AccessList({
    organization,
    membership,
    members,
    arrivals = [],
    metrics,
    logs,
    windows = [],
    filters,
}: Props) {
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const {
        data: memberData,
        setData: setMemberData,
        post: postMember,
        processing: processingMember,
        errors: memberErrors,
        reset: resetMember,
    } = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        issue_credential: true,
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'add_person') {
            setAddPersonModalOpen(true);
        }
    }, []);



    const hasPublicWindows = organization.access_policy === 'public_window';
    const activeMembers = members.data.filter((member) => member.status === 'active').length;
    const suspendedMembers = members.data.filter((member) => member.status === 'suspended').length;

    const getMemberStatus = (member: Member) => {
        if (member.status === 'suspended') return { label: 'Suspended', color: 'rose' };
        if (member.is_valid_now) return { label: 'Active', color: 'emerald' };
        if (member.valid_until && new Date(member.valid_until) < new Date()) return { label: 'Expired', color: 'slate' };
        return { label: 'Pending', color: 'amber' };
    };

    const statusColorMap = {
        rose: 'bg-rose-50 text-rose-700 ring-rose-100',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        amber: 'bg-amber-50 text-amber-700 ring-amber-100',
        slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    };

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

    const handleCreateMember = (e: React.FormEvent) => {
        e.preventDefault();

        postMember('/org/access-list', {
            onSuccess: () => {
                setAddPersonModalOpen(false);
                resetMember();
            },
        });
    };

    const handleSuspend = (member: Member) => {
        router.post(`/org/access-list/${member.id}/suspend`, {}, {
            preserveScroll: true,
            onSuccess: () => setSelectedMember(null),
        });
    };

    const handleActivate = (member: Member) => {
        router.post(`/org/access-list/${member.id}/activate`, {}, {
            preserveScroll: true,
            onSuccess: () => setSelectedMember(null),
        });
    };

    const handleRevoke = (member: Member) => {
        if (!member.active_credential) return;
        router.post(`/org/credentials/${member.active_credential.id}/revoke`, {}, {
            preserveScroll: true,
            onSuccess: () => setSelectedMember(null),
        });
    };

    const handleIssue = (member: Member) => {
        router.post(`/org/credentials/issue/${member.id}`, {}, {
            preserveScroll: true,
            onSuccess: () => setSelectedMember(null),
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

            <div className="space-y-4 sm:space-y-5 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
                {/* Native Mobile Header: Page Title + Contextual Add Action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Access</h1>
                    {membership.is_admin && (
                        <div className="flex items-center gap-3">
                            <AccessActionMenu onAddPerson={() => setAddPersonModalOpen(true)} />
                        </div>
                    )}
                </div>

                {/* Internal Navigation: People, Arrivals, History, Public times */}
                <AccessTabs
                    activeTab="people"
                    hasPublicWindows={hasPublicWindows}
                />



                {/* Tab Panel: People */}
                {members.total === 0 && !search && category === 'all' && status === 'all' ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white p-8 text-center shadow-xs sm:min-h-[400px] sm:p-12">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100 sm:h-20 sm:w-20">
                                    <Users className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
                                </div>
                                <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">No one has been added yet</h2>
                                <p className="mt-2 max-w-md text-sm text-slate-500">
                                    Add staff, parents, contractors, or anyone who regularly needs access to {organization.name}.
                                </p>
                                {membership.is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => setAddPersonModalOpen(true)}
                                        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98]"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={2.25} />
                                        <span>Add someone</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Directory with search, filters, and list */
                            <div className="space-y-3.5">
                                {/* Native Search Field - No heavy outer wrapper */}
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            applyFilters({ search: event.target.value });
                                        }}
                                        placeholder="Search by name or ID"
                                        className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
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
                                    {suspendedMembers > 0 && <span className="text-rose-600">{suspendedMembers} suspended</span>}
                                </div>

                                {/* People Directory List: Clean Rows with subtle dividers */}
                                {members.data.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center sm:p-10">
                                        <p className="text-sm font-semibold text-slate-900">No matching people found</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {search ? `No members matched "${search}".` : 'No members found in this category.'}
                                        </p>
                                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                            {(search || category !== 'all') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setCategory('all');
                                                        applyFilters({ search: '', category: 'all' });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    <span>Clear filters</span>
                                                </button>
                                            )}
                                            {membership.is_admin && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAddPersonModalOpen(true)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    <span>Add someone</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                                        {members.data.map((member) => {
                                            const memberStatus = getMemberStatus(member);
                                            return (
                                                <div
                                                    key={member.id}
                                                    onClick={() => setSelectedMember(member)}
                                                    className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50/70 active:bg-slate-100/70 cursor-pointer"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3.5">
                                                        {/* Avatar Initials */}
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold tracking-tight text-slate-700">
                                                            {initialsFor(member.name)}
                                                        </div>

                                                        {/* Identity & Status */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="truncate text-[15px] font-semibold text-slate-900">{member.name}</span>
                                                                <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusColorMap[memberStatus.color as keyof typeof statusColorMap]}`}>
                                                                    {memberStatus.label}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 truncate text-[13px] text-slate-500">
                                                                <span className="capitalize">{member.category}</span>
                                                                {member.identifier ? ` · ${member.identifier}` : ''}
                                                                {member.valid_until ? ` · Until ${member.valid_until}` : ' · Ongoing'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right Action Affordance: Code & Chevron */}
                                                    <div className="flex shrink-0 items-center gap-3">
                                                        {member.active_credential ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-widest text-slate-700 ring-1 ring-inset ring-slate-200/80">
                                                                    {member.active_credential.code}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        copyCode(member.active_credential!.code, member.active_credential!.id);
                                                                    }}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                                    title="Copy code"
                                                                >
                                                                    {copiedCodeId === member.active_credential.id ? (
                                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                        <ChevronRight className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}





                {/* Add Someone Sheet / Modal */}
                {addPersonModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-xs sm:items-center sm:p-4">
                        <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-sm shadow-xl sm:rounded-2xl">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-950">Add someone</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">Create access for {organization.name}.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAddPersonModalOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleCreateMember} className="space-y-4 pt-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Full name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Janet Adebayo"
                                        value={memberData.name}
                                        onChange={(event) => setMemberData('name', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {memberErrors.name && <p className="mt-1 text-xs text-rose-600">{memberErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Relationship</label>
                                    <select
                                        value={memberData.category}
                                        onChange={(event) => setMemberData('category', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 capitalize focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="parent">Parent</option>
                                        <option value="student">Student</option>
                                        <option value="member">Member</option>
                                        <option value="contractor">Contractor</option>
                                        <option value="visitor">Regular visitor</option>
                                    </select>
                                    {memberErrors.category && <p className="mt-1 text-xs text-rose-600">{memberErrors.category}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">ID number (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU-2026-042"
                                        value={memberData.identifier}
                                        onChange={(event) => setMemberData('identifier', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {memberErrors.identifier && <p className="mt-1 text-xs text-rose-600">{memberErrors.identifier}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-800">Valid from</label>
                                        <input
                                            type="date"
                                            value={memberData.valid_from}
                                            onChange={(event) => setMemberData('valid_from', event.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                        />
                                        {memberErrors.valid_from && <p className="mt-1 text-xs text-rose-600">{memberErrors.valid_from}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-800">Valid until (optional)</label>
                                        <input
                                            type="date"
                                            value={memberData.valid_until}
                                            onChange={(event) => setMemberData('valid_until', event.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                        />
                                        {memberErrors.valid_until && <p className="mt-1 text-xs text-rose-600">{memberErrors.valid_until}</p>}
                                    </div>
                                </div>

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                                    <input
                                        type="checkbox"
                                        checked={memberData.issue_credential}
                                        onChange={(event) => setMemberData('issue_credential', event.target.checked)}
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
                                        onClick={() => setAddPersonModalOpen(false)}
                                        className="rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingMember}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {processingMember ? 'Adding...' : 'Add person'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Member Details Sheet */}
                {selectedMember && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-xs sm:items-center sm:p-4" onClick={() => setSelectedMember(null)}>
                        <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold tracking-tight text-slate-700">
                                        {initialsFor(selectedMember.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-950">{selectedMember.name}</h3>
                                        <p className="mt-0.5 text-sm text-slate-500 capitalize">{selectedMember.category}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMember(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-5 space-y-6">
                                {/* Profile Info */}
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile Details</h4>
                                    <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">Status</dt>
                                            <dd className="text-sm font-semibold text-slate-900">
                                                {selectedMember.status === 'suspended' ? 'Suspended' : selectedMember.is_valid_now ? 'Active' : 'Pending/Expired'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">ID Number</dt>
                                            <dd className="text-sm font-semibold text-slate-900">{selectedMember.identifier || '—'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">Valid Until</dt>
                                            <dd className="text-sm font-semibold text-slate-900">{selectedMember.valid_until || 'Ongoing'}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Credential Info */}
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Code</h4>
                                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                        {selectedMember.active_credential ? (
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-lg font-bold tracking-widest text-slate-900">{selectedMember.active_credential.code}</span>
                                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                                            Active
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">Expires {selectedMember.active_credential.expires_at_human || 'never'}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(selectedMember.active_credential!.code, selectedMember.active_credential!.id)}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                                                >
                                                    {copiedCodeId === selectedMember.active_credential.id ? (
                                                        <Check className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-500">No active access code</span>
                                                <button
                                                    onClick={() => handleIssue(selectedMember)}
                                                    className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    Issue code
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {membership.is_admin && (
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                        {selectedMember.status === 'suspended' ? (
                                            <button
                                                onClick={() => handleActivate(selectedMember)}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                                            >
                                                Activate Member
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSuspend(selectedMember)}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                                            >
                                                Suspend Member
                                            </button>
                                        )}
                                        
                                        {selectedMember.active_credential ? (
                                            <button
                                                onClick={() => handleRevoke(selectedMember)}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                                            >
                                                Revoke Code
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-sm font-semibold text-slate-400"
                                            >
                                                Revoke Code
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </OrganizationLayout>
    );
}
