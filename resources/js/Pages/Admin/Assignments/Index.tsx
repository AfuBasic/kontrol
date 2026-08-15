import { EllipsisVerticalIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldCheck, UserMinus, X, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    activate,
    create,
    deactivate,
    edit,
    index,
} from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import AuthorityEmptyState from '@/Components/Admin/Assignments/AuthorityEmptyState';
import { useDebounce } from '@/Hooks/useDebounce';

type AssignmentUser = {
    id: number | null;
    ulid: string | null;
    name: string | null;
    email: string | null;
};

type Assignment = {
    id: number;
    user: AssignmentUser;
    role: { id: number | null; name: string | null };
    scope_type: 'estate' | 'zone';
    zone: { id: number; name: string } | null;
    is_primary: boolean;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type PaginatedAssignments = {
    data: Assignment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    assignments: PaginatedAssignments;
    filters: {
        search?: string;
        status?: string;
        scope_type?: string;
    };
};

export default function AssignmentsIndex({ assignments, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [scopeType, setScopeType] = useState(filters.scope_type || '');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const debouncedSearch = useDebounce(search, 300);

    const isZeroData = assignments.total === 0 && !filters.search && !filters.status && !filters.scope_type;
    const isSearchEmpty = assignments.total === 0 && !isZeroData;

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                index.url(),
                { search: debouncedSearch, status, scope_type: scopeType },
                { preserveState: true, replace: true },
            );
        }
    }, [debouncedSearch, filters.search, status, scopeType]);

    function applyFilter(key: string, value: string) {
        const next = {
            search,
            status,
            scope_type: scopeType,
            [key]: value,
        };

        if (key === 'status') setStatus(value);
        if (key === 'scope_type') setScopeType(value);

        router.get(index.url(), next, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        setScopeType('');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    }

    const hasActiveFilters = Boolean(search || status || scopeType);

    function handleToggleActive(assignment: Assignment) {
        const action = assignment.is_active ? deactivate : activate;
        const label = assignment.is_active ? 'deactivate' : 'activate';

        if (
            !confirm(
                `Are you sure you want to ${label} this assignment?\n\nThis will remove this person's active administrative authority, but will not delete the user.`,
            )
        ) {
            return;
        }

        router.post(action.url(assignment.id), {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Staff & Authority" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Staff & Authority</h1>
                    <p className="text-xs font-semibold text-slate-500">
                        Manage the people responsible for operating your estate and the areas they can manage.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={create.url()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        Assign Authority
                    </Link>
                </div>
            </div>

            {isZeroData ? (
                <AuthorityEmptyState onAssignAuthority={() => router.get(create.url())} />
            ) : (
                <div className="space-y-6">
                    {/* SECTION - SEARCH & FILTERS */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Search Input */}
                            <div className="relative w-full sm:flex-1">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search people or responsibilities..."
                                    className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                                />
                            </div>

                            {/* Dropdowns filters */}
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <select
                                    value={scopeType}
                                    onChange={(e) => applyFilter('scope_type', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden sm:w-40"
                                >
                                    <option value="">All coverage</option>
                                    <option value="estate">Estate-wide</option>
                                    <option value="zone">Zone-specific</option>
                                </select>

                                <select
                                    value={status}
                                    onChange={(e) => applyFilter('status', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden sm:w-40"
                                >
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <button
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black tracking-wider text-slate-600 uppercase shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION - TABLE WORKSPACE */}
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                        {isSearchEmpty ? (
                            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                                    <MagnifyingGlassIcon className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900">No assignments match your search</h3>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                    Try another name, responsibility, or clear your filters.
                                </p>
                            </div>
                        ) : (
                            <div className="min-h-[280px] overflow-x-auto">
                                <table className="w-full table-auto border-collapse">
                                    <thead className="border-b border-slate-100 bg-slate-50/70">
                                        <tr>
                                            <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Person
                                            </th>
                                            <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Responsibility
                                            </th>
                                            <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Coverage
                                            </th>
                                            <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Status
                                            </th>
                                            <th className="w-20 px-4 py-3.5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {assignments.data.map((assignment, idx) => {
                                            const initial = assignment.user.name ? assignment.user.name.charAt(0).toUpperCase() : 'U';

                                            const bgColors = [
                                                'bg-blue-50 text-blue-700',
                                                'bg-indigo-50 text-indigo-700',
                                                'bg-purple-50 text-purple-700',
                                                'bg-emerald-50 text-emerald-700',
                                            ];
                                            const avatarColor = bgColors[idx % bgColors.length];

                                            return (
                                                <tr key={assignment.id} className="group transition-colors hover:bg-slate-50/50">
                                                    {/* Avatar & Person */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarColor}`}
                                                            >
                                                                {initial}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="block max-w-[150px] truncate text-xs font-bold text-slate-900">
                                                                    {assignment.user.name}
                                                                </span>
                                                                <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-400">
                                                                    {assignment.user.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Responsibility */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-[10px] font-black tracking-wider text-slate-600 uppercase ring-1 ring-slate-200">
                                                            {assignment.role.name}
                                                        </span>
                                                    </td>

                                                    {/* Coverage */}
                                                    <td className="px-4 py-3.5">
                                                        {assignment.scope_type === 'estate' ? (
                                                            <span className="text-xs font-bold text-slate-700">Entire estate</span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-700">
                                                                {assignment.zone?.name ?? '-'}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            {assignment.is_active ? (
                                                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                            {assignment.is_primary && (
                                                                <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-blue-700 uppercase">
                                                                    Creator
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="relative px-4 py-3.5 text-right">
                                                        {!assignment.is_primary && (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={edit.url(assignment.id)}
                                                                    className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                    title="Edit Assignment"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Link>

                                                                <button
                                                                    onClick={() =>
                                                                        setMenuOpenId(menuOpenId === assignment.id ? null : assignment.id)
                                                                    }
                                                                    className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                >
                                                                    <EllipsisVerticalIcon className="h-4 w-4" />
                                                                </button>

                                                                {menuOpenId === assignment.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                                        <div className="absolute top-11 right-4 z-20 w-48 rounded-xl border border-slate-100 bg-white p-1 text-left shadow-lg ring-1 ring-slate-150/50">
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleToggleActive(assignment);
                                                                                    setMenuOpenId(null);
                                                                                }}
                                                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                {assignment.is_active ? (
                                                                                    <>
                                                                                        <UserMinus className="h-3.5 w-3.5 text-amber-500" />
                                                                                        Deactivate Authority
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                                                        Activate Authority
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {assignments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Page {assignments.current_page} of {assignments.last_page}
                                </p>
                                <div className="flex gap-1.5">
                                    {assignments.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                                link.active
                                                    ? 'bg-slate-900 text-white'
                                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
