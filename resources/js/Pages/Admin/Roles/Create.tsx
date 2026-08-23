import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, store } from '@/actions/App/Http/Controllers/Admin/RoleController';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';

type Permission = {
    id: number;
    name: string;
};

type Props = {
    permissions: Permission[];
};

type GroupedPermissions = {
    [module: string]: Permission[];
};

function humanizeModule(module: string): string {
    return module
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getActionFromPermission(permissionName: string): string {
    const parts = permissionName.split('.');
    const action = parts.length > 1 ? parts[1] : permissionName;
    return action
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function groupPermissionsByModule(permissions: Permission[]): GroupedPermissions {
    return permissions.reduce((acc: GroupedPermissions, permission) => {
        const module = permission.name.split('.')[0];
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {});
}

export default function CreateRole({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as number[],
    });

    const [search, setSearch] = useState('');

    const groupedPermissions = useMemo(() => groupPermissionsByModule(permissions), [permissions]);
    const modules = Object.keys(groupedPermissions);

    const filteredModules = useMemo(() => {
        if (!search.trim()) return modules;
        const query = search.toLowerCase();

        return modules.filter((module) => {
            const humanModule = humanizeModule(module).toLowerCase();
            if (humanModule.includes(query)) return true;

            const modulePermissions = groupedPermissions[module];
            return modulePermissions.some((p) => {
                const humanAction = getActionFromPermission(p.name).toLowerCase();
                return humanAction.includes(query) || p.name.toLowerCase().includes(query);
            });
        });
    }, [modules, groupedPermissions, search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url());
    }

    function togglePermission(permissionId: number) {
        const newPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId];
        setData('permissions', newPermissions);
    }

    function toggleModule(module: string) {
        const modulePermissionIds = groupedPermissions[module].map((p) => p.id);
        const allSelected = modulePermissionIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            setData(
                'permissions',
                data.permissions.filter((id) => !modulePermissionIds.includes(id)),
            );
        } else {
            const newPermissions = [...new Set([...data.permissions, ...modulePermissionIds])];
            setData('permissions', newPermissions);
        }
    }

    function _isModuleFullySelected(module: string): boolean {
        return groupedPermissions[module].every((p) => data.permissions.includes(p.id));
    }

    function _isModulePartiallySelected(module: string): boolean {
        const modulePermissions = groupedPermissions[module];
        const selectedCount = modulePermissions.filter((p) => data.permissions.includes(p.id)).length;
        return selectedCount > 0 && selectedCount < modulePermissions.length;
    }

    return (
        <>
            <Head title="Create Role" />

            <div className="mx-auto max-w-full">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <Link href={index.url()} className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700">
                        &larr; Back to Roles
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create Role</h1>
                    <p className="mt-1 text-sm text-slate-500">Define a new responsibility and select what it can manage.</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs"
                    noValidate
                >
                    <div className="space-y-12 p-6 md:p-8">
                        {/* ROLE SECTION */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Role Name</h2>
                                <p className="mt-1 text-sm text-slate-500">Give this responsibility a clear name that your team will understand.</p>
                            </div>
                            <div className="max-w-xl">
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900 focus:outline-none"
                                    placeholder="e.g. Security Supervisor"
                                />
                                {errors.name && <p className="mt-2 text-sm font-medium text-red-600">{errors.name}</p>}
                            </div>
                        </section>

                        <div className="h-px w-full bg-slate-100" />

                        {/* CAPABILITIES SECTION */}
                        <section>
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">Capabilities</h2>
                                    <p className="mt-1 text-sm text-slate-500">Choose what this responsibility can manage.</p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50/50 py-2 pr-3 pl-9 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-slate-900"
                                        placeholder="Search permissions..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {filteredModules.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                                        <p className="text-sm text-slate-500">No permissions match your search.</p>
                                    </div>
                                ) : (
                                    filteredModules.map((module) => {
                                        const modulePermissions = groupedPermissions[module];
                                        const selectedCount = modulePermissions.filter((p) => data.permissions.includes(p.id)).length;
                                        const isFullySelected = selectedCount === modulePermissions.length;

                                        const visiblePermissions = search.trim()
                                            ? modulePermissions.filter((p) => {
                                                  const query = search.toLowerCase();
                                                  const humanAction = getActionFromPermission(p.name).toLowerCase();
                                                  const humanMod = humanizeModule(module).toLowerCase();
                                                  return (
                                                      humanAction.includes(query) || p.name.toLowerCase().includes(query) || humanMod.includes(query)
                                                  );
                                              })
                                            : modulePermissions;

                                        if (visiblePermissions.length === 0) return null;

                                        return (
                                            <div key={module} className="rounded-xl border border-slate-200/60 bg-white">
                                                {/* Group Header */}
                                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <h3 className="text-sm font-semibold text-slate-900">{humanizeModule(module)}</h3>
                                                        <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-medium text-slate-600 tabular-nums">
                                                            {selectedCount} of {modulePermissions.length} selected
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModule(module)}
                                                        className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all active:scale-95 ${
                                                            isFullySelected
                                                                ? 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                : 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        {isFullySelected ? 'Clear all' : 'Select all'}
                                                    </button>
                                                </div>

                                                {/* Permissions Grid */}
                                                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                                    {visiblePermissions.map((permission) => {
                                                        const isChecked = data.permissions.includes(permission.id);
                                                        return (
                                                            <label
                                                                key={permission.id}
                                                                className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 ${
                                                                    isChecked ? 'border-slate-950/30 bg-slate-950/5' : 'border-slate-200/60 bg-white'
                                                                }`}
                                                            >
                                                                <div className="flex h-5 items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => togglePermission(permission.id)}
                                                                        className="h-4 w-4 rounded border-slate-300 text-slate-950 transition-colors focus:ring-slate-900"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className={`text-sm font-medium ${isChecked ? 'text-slate-950' : 'text-slate-700'}`}
                                                                    >
                                                                        {getActionFromPermission(permission.name)}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {errors.permissions && <p className="mt-4 text-sm font-medium text-red-600">{errors.permissions}</p>}
                        </section>
                    </div>

                    {/* FOOTER */}
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row md:px-8">
                        <div>
                            {data.permissions.length === 0 ? (
                                <p className="text-sm font-medium text-slate-500">No permissions selected yet</p>
                            ) : (
                                <p className="text-sm font-medium text-slate-950">{data.permissions.length} permissions selected</p>
                            )}
                        </div>
                        <div className="flex w-full items-center gap-3 sm:w-auto">
                            <Link
                                href={index.url()}
                                className="flex-1 justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/50 sm:flex-none"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 justify-center rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-slate-950/90 disabled:opacity-50 sm:flex-none"
                            >
                                {processing ? 'Creating...' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </div>
        </>
    );
}
