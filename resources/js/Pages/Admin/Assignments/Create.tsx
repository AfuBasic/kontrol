import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';

type OptionUser = { id: number; ulid: string; name: string; email: string };
type OptionRole = { id: number; name: string; estate_id: number };
type OptionZone = { id: number; name: string; estate_id: number };

type Props = {
    users: OptionUser[];
    roles: OptionRole[];
    zones: OptionZone[];
};

export default function CreateAssignment({ users, roles, zones }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        role_id: '',
        scope_type: 'estate',
        zone_id: '',
        is_primary: false as boolean,
        is_active: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <>
            <Head title="Create Assignment" />

            <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Assignments
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">Create Assignment</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Assign an estate-scoped role to a member with estate-wide or zone scope.
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <form onSubmit={submit} className="space-y-6 p-6">
                        <div>
                            <label htmlFor="user_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                                User
                            </label>
                            <select
                                id="user_id"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                required
                            >
                                <option value="" disabled>
                                    Select a user...
                                </option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <p className="mt-1.5 text-sm text-red-600">{errors.user_id}</p>}
                            {errors.user && <p className="mt-1.5 text-sm text-red-600">{errors.user}</p>}
                        </div>

                        <div>
                            <label htmlFor="role_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                id="role_id"
                                value={data.role_id}
                                onChange={(e) => setData('role_id', e.target.value)}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                required
                            >
                                <option value="" disabled>
                                    Select a role...
                                </option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            {errors.role_id && <p className="mt-1.5 text-sm text-red-600">{errors.role_id}</p>}
                            {errors.role && <p className="mt-1.5 text-sm text-red-600">{errors.role}</p>}
                        </div>

                        <div>
                            <label htmlFor="scope_type" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Scope
                            </label>
                            <select
                                id="scope_type"
                                value={data.scope_type}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setData({
                                        ...data,
                                        scope_type: next,
                                        zone_id: next === 'estate' ? '' : data.zone_id,
                                    });
                                }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                required
                            >
                                <option value="estate">Estate-wide</option>
                                <option value="zone">Zone</option>
                            </select>
                            {errors.scope_type && <p className="mt-1.5 text-sm text-red-600">{errors.scope_type}</p>}
                        </div>

                        {data.scope_type === 'zone' && (
                            <div>
                                <label htmlFor="zone_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Zone
                                </label>
                                <select
                                    id="zone_id"
                                    value={data.zone_id}
                                    onChange={(e) => setData('zone_id', e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                    required
                                >
                                    <option value="" disabled>
                                        Select a zone...
                                    </option>
                                    {zones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.zone_id && <p className="mt-1.5 text-sm text-red-600">{errors.zone_id}</p>}
                                {errors.zone && <p className="mt-1.5 text-sm text-red-600">{errors.zone}</p>}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_primary}
                                    onChange={(e) => setData('is_primary', e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Primary assignment
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Active
                            </label>
                        </div>
                        {errors.is_primary && <p className="text-sm text-red-600">{errors.is_primary}</p>}
                        {errors.assignment && <p className="text-sm text-red-600">{errors.assignment}</p>}

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                            <Link
                                href={index.url()}
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                {processing ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
