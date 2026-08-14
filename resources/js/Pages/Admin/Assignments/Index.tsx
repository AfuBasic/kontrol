import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
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

    function handleToggleActive(assignment: Assignment) {
        const action = assignment.is_active ? deactivate : activate;
        const label = assignment.is_active ? 'deactivate' : 'activate';

        if (!confirm(`Are you sure you want to ${label} this assignment?\n\nThis will remove this person's active administrative authority, but will not delete the user.`)) {
            return;
        }

        router.post(action.url(assignment.id), {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Staff & Authority" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Staff & Authority</h1>
                    <p className="mt-1 text-gray-500">
                        Manage the people responsible for operating your estate and the areas they can manage.
                    </p>
                </div>
                <Link
                    href={create.url()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                    <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                    Assign Authority
                </Link>
            </motion.div>

            {isZeroData ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                >
                    <AuthorityEmptyState onAssignAuthority={() => router.get(create.url())} />
                </motion.div>
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <div className="relative max-w-md flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search people or responsibilities..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1F6FDB] focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
                            />
                        </div>
                        <select
                            value={scopeType}
                            onChange={(e) => applyFilter('scope_type', e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1F6FDB] focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
                        >
                            <option value="">All coverage</option>
                            <option value="estate">Estate-wide</option>
                            <option value="zone">Zone-specific</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => applyFilter('status', e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1F6FDB] focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                        {isSearchEmpty ? (
                            <div className="px-6 py-16 text-center">
                                <p className="text-sm font-medium text-gray-900">No assignments match your search.</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Try another name, responsibility, or clear your search.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setStatus('');
                                        setScopeType('');
                                        router.get(index.url());
                                    }}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Person
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Responsibility
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Coverage
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Updated
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {assignments.data.map((assignment) => (
                                            <tr key={assignment.id} className="hover:bg-gray-50/80">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {assignment.user.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{assignment.user.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                                                        {assignment.role.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm capitalize text-gray-700">
                                                    {assignment.scope_type === 'estate'
                                                        ? 'Estate-wide'
                                                        : assignment.zone?.name ?? '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {assignment.is_active ? (
                                                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {assignment.updated_at}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={edit.url(assignment.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <PencilIcon className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleActive(assignment)}
                                                            className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            {assignment.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {assignments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                                <p className="text-sm text-gray-500">
                                    Page {assignments.current_page} of {assignments.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {assignments.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`rounded-md px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-slate-900 text-white'
                                                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </>
    );
}
