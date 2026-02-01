import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { index } from '@/actions/App/Http/Controllers/Admin/UserController';
import { useDebounce } from '@/hooks/useDebounce';
import AdminLayout from '@/layouts/AdminLayout';
import UserActions from './UserActions';

type User = {
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

export default function Users({ users, filters }: Props) {
    const hasUsers = users.data.length > 0;
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    // Debounce search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch }, { preserveState: true, replace: true });
        }
    }, [debouncedSearch, filters.search]);

    return (
        <AdminLayout>
            <Head title="Admins" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Administrators</h1>
                    <p className="mt-1 text-gray-500">Manage other administrators for your estate.</p>
                </div>
                <Link
                    href={index.url() + '/create'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Invite Admin
                </Link>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className="mb-6"
            >
                <div className="relative max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Search admins by name or email..."
                    />
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="rounded-xl border border-gray-200 bg-white"
            >
                {hasUsers ? (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto lg:overflow-visible">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Joined</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-1">
                                                    {user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset"
                                                        >
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        user.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {user.status === 'accepted' ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{user.created_at}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <UserActions user={user} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                                <div className="text-sm text-gray-500">
                                    Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                                    {Math.min(users.current_page * users.per_page, users.total)} of {users.total} admins
                                </div>
                                <div className="flex gap-2">
                                    {users.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg px-3 py-1.5 text-sm ${
                                                link.active
                                                    ? 'bg-primary-600 text-white'
                                                    : link.url
                                                      ? 'text-gray-600 hover:bg-gray-100'
                                                      : 'cursor-not-allowed text-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-4">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No admins found</h3>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            {search
                                ? 'Try adjusting your search to find what you are looking for.'
                                : 'Get started by inviting your first administrator.'}
                        </p>
                        {!search && (
                            <Link
                                href={index.url() + '/create'}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Invite Admin
                            </Link>
                        )}
                    </div>
                )}
            </motion.div>
        </AdminLayout>
    );
}
