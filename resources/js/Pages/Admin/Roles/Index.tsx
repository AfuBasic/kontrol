import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisVerticalIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { destroy, index } from '@/actions/App/Http/Controllers/Admin/RoleController';
import { usePermission } from '@/Hooks/usePermission';
import AdminLayout from '@/Layouts/AdminLayout';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
    assignments_count?: number;
    created_at: string;
};

type Props = {
    roles: Role[];
};

export default function Roles({ roles }: Props) {
    const { can } = usePermission();
    const [search, setSearch] = useState('');

    const filteredRoles = useMemo(() => {
        if (!search.trim()) return roles;
        const query = search.toLowerCase();
        return roles.filter((role) => role.name.toLowerCase().includes(query) || role.permissions?.some((p) => p.name.toLowerCase().includes(query)));
    }, [roles, search]);

    const hasRoles = roles.length > 0;
    const hasResults = filteredRoles.length > 0;

    function handleDelete(role: Role) {
        if (confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`)) {
            router.delete(destroy.url({ role: role.id }));
        }
    }

    return (
        <>
            <Head title="Roles & Responsibilities" />

            <div className="mx-auto max-w-5xl">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Roles</h1>
                        <p className="mt-1 text-sm text-slate-500">Define the responsibilities and permissions available to your estate team.</p>
                    </div>
                    {can('roles.create') && hasRoles && (
                        <Link
                            href={index.url() + '/create'}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A3D91] px-4 py-2 text-center text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#0A3D91]/90"
                        >
                            Create Role
                        </Link>
                    )}
                </motion.div>

                {/* Search */}
                {hasRoles && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                        className="mb-6"
                    >
                        <div className="relative max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-[#0A3D91] focus:ring-[#0A3D91] focus:outline-none"
                                placeholder="Search roles..."
                            />
                        </div>
                    </motion.div>
                )}

                {/* Content */}
                {hasRoles ? (
                    hasResults ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredRoles.map((role) => {
                                const permissionCount = role.permissions?.length || 0;
                                const assignedCount = role.assignments_count || 0;

                                return (
                                    <div
                                        key={role.id}
                                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div className="absolute top-4 right-4">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <MenuButton className="flex items-center rounded-lg p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </MenuButton>
                                                <MenuItems className="absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                    {can('roles.edit') && (
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <Link
                                                                    href={index.url() + `/${role.id}/edit`}
                                                                    className={`${active ? 'bg-slate-50 text-[#0A3D91]' : 'text-slate-700'} flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors`}
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                    {can('roles.delete') && (
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDelete(role)}
                                                                    className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors`}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                </MenuItems>
                                            </Menu>
                                        </div>

                                        <div>
                                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7FB] text-[#0A3D91] ring-1 ring-[#0A3D91]/10">
                                                <ShieldCheckIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-base font-semibold tracking-tight text-slate-900 capitalize">{role.name}</h3>

                                            <div className="mt-4 flex flex-col gap-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">Authority</span>
                                                    <span className="font-medium text-slate-700">
                                                        {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">Usage</span>
                                                    <span className="font-medium text-slate-700">{assignedCount} assigned</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* No Search Results */
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white px-4 py-20 text-center shadow-sm"
                        >
                            <MagnifyingGlassIcon className="mb-3 h-10 w-10 text-slate-300" />
                            <h3 className="text-sm font-semibold text-slate-900">No roles match your search</h3>
                            <p className="mt-1 text-sm text-slate-500">We couldn't find any roles matching "{search}".</p>
                            <button onClick={() => setSearch('')} className="mt-6 text-sm font-medium text-[#0A3D91] hover:text-[#0A3D91]/80">
                                Clear search
                            </button>
                        </motion.div>
                    )
                ) : (
                    /* Setup Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white px-4 py-24 text-center shadow-sm"
                    >
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F7FB] text-[#0A3D91] ring-1 ring-[#0A3D91]/10">
                            <UserGroupIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Define your team's responsibilities</h3>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                            Roles let you decide what different members of your estate team can manage. For example:{' '}
                            <span className="font-medium text-slate-700">Administrator</span>,{' '}
                            <span className="font-medium text-slate-700">Security Supervisor</span>, or{' '}
                            <span className="font-medium text-slate-700">Facility Manager</span>.
                        </p>
                        {can('roles.create') && (
                            <Link
                                href={index.url() + '/create'}
                                className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#0A3D91] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A3D91]/90"
                            >
                                Create your first role
                            </Link>
                        )}
                    </motion.div>
                )}
            </div>
        </>
    );
}
