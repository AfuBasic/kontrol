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
        tab?: string;
    };
    initialTab?: 'people' | 'arrivals' | 'history' | 'public_windows';
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
    initialTab = 'people',
}: Props) {
    const [activeTab, setActiveTab] = useState<'people' | 'arrivals' | 'history' | 'public_windows'>(initialTab);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createWindowModalOpen, setCreateWindowModalOpen] = useState(false);
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

    const {
        data: windowData,
        setData: setWindowData,
        post: postWindow,
        processing: processingWindow,
        errors: windowErrors,
        reset: resetWindow,
    } = useForm({
        name: '',
        day_of_week: 0,
        start_time: '08:00',
        end_time: '12:00',
        is_active: true,
        notes: '',
    });

    const hasPublicWindows = organization.access_policy === 'public_window';
    const activeMembers = members.data.filter((member) => member.status === 'active').length;
    const suspendedMembers = members.data.filter((member) => member.status === 'suspended').length;



    const handleTabChange = (nextTab: 'people' | 'arrivals' | 'history' | 'public_windows') => {
        setActiveTab(nextTab);
        const url = nextTab === 'people' ? '/org/access-list' : `/org/access-list?tab=${nextTab}`;
        window.history.replaceState(null, '', url);
    };

    const handleDeleteWindow = (id: number) => {
        if (confirm('Delete this public access time?')) {
            router.delete(`/org/public-windows/${id}`, { preserveScroll: true });
        }
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
                setCreateModalOpen(false);
                resetMember();
            },
        });
    };

    const handleCreateWindow = (e: React.FormEvent) => {
        e.preventDefault();

        postWindow('/org/public-windows', {
            onSuccess: () => {
                setCreateWindowModalOpen(false);
                resetWindow();
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
                {/* Native Mobile Header: Page Title + Contextual Add Action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Access</h1>
                    {membership.is_admin && (
                        <div>
                            {activeTab === 'public_windows' ? (
                                <button
                                    type="button"
                                    onClick={() => setCreateWindowModalOpen(true)}
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] sm:min-h-10 sm:px-4 sm:text-sm"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                                    <span>Add time</span>
                                </button>
                            ) : (
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
                    )}
                </div>

                {/* Internal Navigation: People, Arrivals, History, Public times */}
                <AccessTabs
                    activeTab={activeTab}
                    hasPublicWindows={hasPublicWindows}
                    onTabChange={handleTabChange}
                />



                {/* Tab Panel: People */}
                {activeTab === 'people' && (
                    <>
                        {members.total === 0 && !search && category === 'all' && status === 'all' ? (
                            /* Clean native empty state */
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center sm:p-10">
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
                                                    onClick={() => setCreateModalOpen(true)}
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
                                        {members.data.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex min-h-[60px] items-center justify-between gap-3 px-3.5 py-2.5 transition hover:bg-slate-50/70 sm:px-4"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {/* Avatar Initials */}
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                                                        {initialsFor(member.name)}
                                                    </div>

                                                    {/* Identity & Status */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate text-sm font-semibold text-slate-900">{member.name}</span>
                                                            {member.status === 'suspended' ? (
                                                                <span className="inline-flex shrink-0 items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                                                                    Suspended
                                                                </span>
                                                            ) : member.is_valid_now ? (
                                                                <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                                    Pending
                                                                </span>
                                                            )}
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
                    </>
                )}



                {/* Tab Panel: Public Times (Windows) */}
                {activeTab === 'public_windows' && hasPublicWindows && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1 text-xs font-medium text-slate-500">
                            <span>
                                {windows.length} {windows.length === 1 ? 'ACTIVE WINDOW' : 'ACTIVE WINDOWS'}
                            </span>
                        </div>

                        {windows.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center sm:p-10">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                    <CalendarClock className="h-6 w-6" strokeWidth={1.75} />
                                </div>
                                <h2 className="mt-4 text-lg font-semibold text-slate-900">No public access times</h2>
                                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                                    Define regular weekly windows when the estate gate should admit visitors without individual codes.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                                {windows.map((window) => (
                                    <div
                                        key={window.id}
                                        className="flex min-h-[64px] items-center justify-between gap-3 px-3.5 py-3.5 transition hover:bg-slate-50/70 sm:px-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                                                <DoorOpen className="h-5 w-5" strokeWidth={1.75} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-semibold text-slate-900">{window.name}</span>
                                                    {window.is_open_now && (
                                                        <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                            Open now
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    <span>{DAYS[window.day_of_week]}s</span>
                                                    <span>
                                                        {' '}
                                                        · {window.start_time} - {window.end_time}
                                                    </span>
                                                    {window.notes ? ` · ${window.notes}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {membership.is_admin && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteWindow(window.id)}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete window"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
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
                                        onClick={() => setCreateModalOpen(false)}
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

                {/* Add Public Time Sheet / Modal */}
                {createWindowModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-xs sm:items-center sm:p-4">
                        <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-sm shadow-xl sm:p-6">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3.5">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-950">Add public access time</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">Schedule gate access without individual codes.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCreateWindowModalOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleCreateWindow} className="space-y-4 pt-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Window name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sunday Morning Service"
                                        value={windowData.name}
                                        onChange={(event) => setWindowData('name', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {windowErrors.name && <p className="mt-1 text-xs text-rose-600">{windowErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Day of week</label>
                                    <select
                                        value={windowData.day_of_week}
                                        onChange={(event) => setWindowData('day_of_week', parseInt(event.target.value, 10))}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    >
                                        {DAYS.map((day, index) => (
                                            <option key={day} value={index}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                    {windowErrors.day_of_week && <p className="mt-1 text-xs text-rose-600">{windowErrors.day_of_week}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-800">Start time</label>
                                        <input
                                            type="time"
                                            value={windowData.start_time}
                                            onChange={(event) => setWindowData('start_time', event.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                        />
                                        {windowErrors.start_time && <p className="mt-1 text-xs text-rose-600">{windowErrors.start_time}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-800">End time</label>
                                        <input
                                            type="time"
                                            value={windowData.end_time}
                                            onChange={(event) => setWindowData('end_time', event.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                        />
                                        {windowErrors.end_time && <p className="mt-1 text-xs text-rose-600">{windowErrors.end_time}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-800">Notes (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Open to congregation members"
                                        value={windowData.notes}
                                        onChange={(event) => setWindowData('notes', event.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                    />
                                    {windowErrors.notes && <p className="mt-1 text-xs text-rose-600">{windowErrors.notes}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5">
                                    <button
                                        type="button"
                                        onClick={() => setCreateWindowModalOpen(false)}
                                        className="rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingWindow}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {processingWindow ? 'Saving...' : 'Add time'}
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
