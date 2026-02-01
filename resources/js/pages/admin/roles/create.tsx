import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, store } from '@/actions/App/Http/Controllers/Admin/RoleController';
import AdminLayout from '@/layouts/AdminLayout';

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

function getActionFromPermission(permissionName: string): string {
    const action = permissionName.split('.')[1] || permissionName;
    return action.replace('-', ' ');
}

export default function CreateRole({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as number[],
    });

    const groupedPermissions = groupPermissionsByModule(permissions);
    const modules = Object.keys(groupedPermissions);

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

    function isModuleFullySelected(module: string): boolean {
        return groupedPermissions[module].every((p) => data.permissions.includes(p.id));
    }

    function isModulePartiallySelected(module: string): boolean {
        const modulePermissions = groupedPermissions[module];
        const selectedCount = modulePermissions.filter((p) => data.permissions.includes(p.id)).length;
        return selectedCount > 0 && selectedCount < modulePermissions.length;
    }

    return (
        <AdminLayout>
            <Head title="Create Role" />

            <div className="mx-auto max-w-full">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Create Role</h1>
                    <p className="mt-1 text-gray-500">Define a new role with specific permissions for your estate.</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Role Name */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Role Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            placeholder="e.g., Manager, Supervisor, Guest"
                        />
                        <p className="mt-1 text-xs text-gray-500">Choose a descriptive name for this role.</p>
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Permissions */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-gray-900">Permissions</h2>
                            <p className="mt-1 text-sm text-gray-500">Select the permissions this role should have.</p>
                        </div>

                        <div className="space-y-6">
                            {modules.map((module) => (
                                <div key={module} className="rounded-lg border border-gray-200 p-4">
                                    <div className="mb-4 flex items-center gap-3 pb-2">
                                        <input
                                            type="checkbox"
                                            id={`module-${module}`}
                                            checked={isModuleFullySelected(module)}
                                            ref={(el) => {
                                                if (el) el.indeterminate = isModulePartiallySelected(module);
                                            }}
                                            onChange={() => toggleModule(module)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor={`module-${module}`} className="text-sm font-medium text-gray-900 capitalize">
                                            {module}
                                        </label>
                                        <span className="text-xs text-gray-400">
                                            ({groupedPermissions[module].filter((p) => data.permissions.includes(p.id)).length}/
                                            {groupedPermissions[module].length})
                                        </span>
                                    </div>
                                    <div className="ml-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {groupedPermissions[module].map((permission) => (
                                            <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={() => togglePermission(permission.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="capitalize">{getActionFromPermission(permission.name)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {errors.permissions && <p className="mt-4 text-sm text-red-600">{errors.permissions}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={index.url()}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Role'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </AdminLayout>
    );
}
