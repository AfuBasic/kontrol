import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';

import { useState, useEffect } from 'react';
import { index } from '@/actions/App/Http/Controllers/Admin/UserController';
import { useDebounce } from '@/Hooks/useDebounce';
import { usePermission } from '@/Hooks/usePermission';
import UserActions from './UserActions';
import { Users } from 'lucide-react';

type User = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    status: 'pending' | 'accepted' | 'unknown';
    roles: string[];
    created_at: string;
};

type PaginatedUsers = {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    users: PaginatedUsers;
    filters: {
        search?: string;
    };
};

export default function UsersIndex({ users, filters }: Props) {
    const { can } = usePermission();
    const _hasUsers = users.total > 0;
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    const isZeroData = users.total === 0 && !filters.search;
    const isSearchEmpty = users.total === 0 && !isZeroData;

    // Debounce search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch }, { preserveState: true, replace: true });
        }
    }, [debouncedSearch, filters.search]);

    return (
        <>
            <Head title="Estate Team" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Estate Team</h1>
                    <p className="text-xs font-semibold text-slate-500">Manage the people who belong to your estate team.</p>
                </div>
                {can('users.create') && (
                    <div className="flex items-center gap-2">
                        <Link
                            href={index.url() + '/create'}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Add Staff Member
                        </Link>
                    </div>
                )}
            </div>

            {isZeroData ? (
                /* Premium Empty State */
                <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-24 text-center shadow-xs ring-1 ring-slate-100/50">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/50">
                        <Users className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Build your estate team</h3>
                    <p className="mt-2 max-w-sm text-xs leading-relaxed font-semibold text-slate-500">
                        Add the people who help run your estate. Once they're added, you can give them specific responsibilities and define where
                        those responsibilities apply.
                    </p>
                    {can('users.create') && (
                        <Link
                            href={index.url() + '/create'}
                            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Add Staff Member
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* SECTION - SEARCH & FILTERS */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Search Input */}
                            <div className="relative w-full sm:max-w-md">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search staff by name or email..."
                                    className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                                />
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
                                <h3 className="text-sm font-black text-slate-900">No staff match your search</h3>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Try another name or email.</p>
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
                                                Status
                                            </th>
                                            <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Joined
                                            </th>
                                            <th className="w-20 px-4 py-3.5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.data.map((user, idx) => {
                                            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

                                            const bgColors = [
                                                'bg-blue-50 text-blue-700',
                                                'bg-indigo-50 text-indigo-700',
                                                'bg-purple-50 text-purple-700',
                                                'bg-emerald-50 text-emerald-700',
                                            ];
                                            const avatarColor = bgColors[idx % bgColors.length];

                                            return (
                                                <tr key={user.id} className="group transition-colors hover:bg-slate-50/50">
                                                    {/* Avatar & Person */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarColor}`}
                                                            >
                                                                {initial}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <Link
                                                                    href={`/admin/residents/${user.id}`}
                                                                    className="block max-w-[150px] truncate text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline"
                                                                >
                                                                    {user.name}
                                                                </Link>
                                                                <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-400">
                                                                    {user.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Responsibility */}
                                                    <td className="px-4 py-3.5">
                                                        {user.roles.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.roles.map((role) => (
                                                                    <span
                                                                        key={role}
                                                                        className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-[10px] font-black tracking-wider text-slate-600 uppercase ring-1 ring-slate-200"
                                                                    >
                                                                        {role}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400">-</span>
                                                        )}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-4 py-3.5">
                                                        {user.status === 'accepted' ? (
                                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Joined Date */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs font-bold text-slate-700">{user.created_at}</span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="relative px-4 py-3.5 text-right">
                                                        <UserActions user={user} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Page {users.current_page} of {users.last_page}
                                </p>
                                <div className="flex gap-1.5">
                                    {users.links.map((link, idx) => (
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
