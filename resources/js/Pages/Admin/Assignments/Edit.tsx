import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';

type OptionRole = { id: number; name: string; estate_id: number };
type OptionZone = { id: number; name: string; estate_id: number };

type Assignment = {
    id: number;
    user: { id: number | null; name: string | null; email: string | null };
    role: { id: number | null; name: string | null };
    scope_type: 'estate' | 'zone';
    zone: { id: number; name: string } | null;
    is_primary: boolean;
    is_active: boolean;
};

type Props = {
    assignment: Assignment;
    roles: OptionRole[];
    zones: OptionZone[];
};

export default function EditAssignment({ assignment, roles, zones }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        role_id: String(assignment.role.id ?? ''),
        scope_type: assignment.scope_type,
        zone_id: assignment.zone ? String(assignment.zone.id) : '',
        is_primary: assignment.is_primary,
        is_active: assignment.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(update.url(assignment.id));
    };

    return (
        <>
            <Head title="Edit Assignment" />

            <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Assignments
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Assignment</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Update role, scope, zone, or active state for{' '}
                        <span className="font-medium text-gray-700">{assignment.user.name}</span>.
                    </p>
                </div>

                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    <div>
                        <span className="font-medium text-gray-800">User:</span> {assignment.user.name} (
                        {assignment.user.email})
                    </div>
                    <div className="mt-1 text-xs text-gray-500">User cannot be changed after creation.</div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <form onSubmit={submit} className="space-y-6 p-6">
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
                                    const next = e.target.value as 'estate' | 'zone';
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
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
