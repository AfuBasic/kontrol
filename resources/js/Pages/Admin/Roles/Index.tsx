import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisVerticalIcon, MagnifyingGlassIcon, PencilIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { destroy, index } from '@/actions/App/Http/Controllers/Admin/RoleController';
import { usePermission } from '@/hooks/usePermission';
import AdminLayout from '@/layouts/AdminLayout';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
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

    function getPermissionModules(permissions?: Permission[]): string[] {
        if (!permissions || permissions.length === 0) {
            return [];
        }
        const modules = new Set<string>();
        permissions.forEach((p) => {
            const module = p.name.split('.')[0];
            modules.add(module);
        });
        return Array.from(modules);
    }

    return (
        <AdminLayout>
            <Head title="Roles" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
                    <p className="mt-1 text-gray-500">Manage custom roles and their permissions for your estate.</p>
                </div>
                {can('roles.create') && (
                    <Link
                        href={index.url() + '/create'}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
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
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Search roles by name or permission..."
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
                            const modules = getPermissionModules(role.permissions);
                            const permissionCount = role.permissions?.length || 0;

                            return (
                                <div
                                    key={role.id}
                                    className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                                >
                                    {/* Actions Menu */}
                                    <Menu as="div" className="absolute top-4 right-4">
                                        <MenuButton className="flex items-center rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600">
                                            <EllipsisVerticalIcon className="h-5 w-5" />
                                        </MenuButton>
                                        <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                                            {can('roles.edit') && (
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <Link
                                                            href={index.url() + `/${role.id}/edit`}
                                                            className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                            Edit Role
                                                        </Link>
                                                    )}
                                                </MenuItem>
                                            )}
                                            {can('roles.delete') && (
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => handleDelete(role)}
                                                            className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600`}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                            Delete Role
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            )}
                                        </MenuItems>
                                    </Menu>

                                    {/* Role Icon & Name */}
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                                            <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 capitalize">{role.name}</h3>
                                            <p className="text-xs text-gray-500">
                                                {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Modules */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {modules.length > 0 ? (
                                            <>
                                                {modules.map((module) => (
                                                    <span
                                                        key={module}
                                                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 capitalize"
                                                    >
                                                        {module.replace('-', ' ')}
                                                    </span>
                                                ))}
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400">No permissions assigned</span>
                                        )}
                                    </div>

                                    {/* Edit Link */}
                                    {can('roles.edit') && (
                                        <Link
                                            href={index.url() + `/${role.id}/edit`}
                                            className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
                                        >
                                            Edit permissions
                                        </Link>
                                    )}
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
                        className="rounded-xl border border-gray-200 bg-white py-16 text-center"
                    >
                        <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No roles found</h3>
                        <p className="mt-1 text-sm text-gray-500">No roles match your search "{search}"</p>
                        <button onClick={() => setSearch('')} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
                            Clear search
                        </button>
                    </motion.div>
                )
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="rounded-xl border border-gray-200 bg-white py-16 text-center"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <ShieldCheckIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No custom roles</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                        Create custom roles to define specific permissions for different user types in your estate.
                    </p>
                    {can('roles.create') && (
                        <Link
                            href={index.url() + '/create'}
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Create Role
                        </Link>
                    )}
                </motion.div>
            )}
        </AdminLayout>
    );
}
