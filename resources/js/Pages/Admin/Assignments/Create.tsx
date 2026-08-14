import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
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
        is_active: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url());
    };

    const selectedPerson = users.find((u) => u.id.toString() === data.user_id);
    const selectedRole = roles.find((r) => r.id.toString() === data.role_id);
    const selectedZone = zones.find((z) => z.id.toString() === data.zone_id);

    return (
        <>
            <Head title="Assign Authority" />

            <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Staff & Authority
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">Assign Authority</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Give a member of this estate administrative responsibility.
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <form onSubmit={submit} className="space-y-6 p-6">
                        <div>
                            <label htmlFor="user_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Person
                            </label>
                            <select
                                id="user_id"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
                                required
                            >
                                <option value="" disabled>
                                    Select a member...
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
                                Responsibility
                            </label>
                            <select
                                id="role_id"
                                value={data.role_id}
                                onChange={(e) => setData('role_id', e.target.value)}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
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
                            <label className="mb-3 block text-sm font-medium text-gray-700">Coverage</label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="scope_type"
                                        value="estate"
                                        checked={data.scope_type === 'estate'}
                                        onChange={() => setData({ ...data, scope_type: 'estate', zone_id: '' })}
                                        className="h-4 w-4 border-gray-300 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                    />
                                    <span className="text-sm text-gray-900">Entire estate</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="scope_type"
                                        value="zone"
                                        checked={data.scope_type === 'zone'}
                                        onChange={() => setData({ ...data, scope_type: 'zone' })}
                                        className="h-4 w-4 border-gray-300 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                    />
                                    <span className="text-sm text-gray-900">Specific zone</span>
                                </label>
                            </div>
                            {errors.scope_type && <p className="mt-1.5 text-sm text-red-600">{errors.scope_type}</p>}
                        </div>

                        {data.scope_type === 'zone' && (
                            <div className="rounded-xl bg-slate-50 p-4">
                                <label htmlFor="zone_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Zone
                                </label>
                                {zones.length > 0 ? (
                                    <>
                                        <select
                                            id="zone_id"
                                            value={data.zone_id}
                                            onChange={(e) => setData('zone_id', e.target.value)}
                                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 focus:border-[#1F6FDB] focus:outline-none focus:ring-2 focus:ring-[#1F6FDB]/20"
                                            required={data.scope_type === 'zone'}
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
                                        {errors.zone_id && (
                                            <p className="mt-1.5 text-sm text-red-600">{errors.zone_id}</p>
                                        )}
                                        {errors.zone && <p className="mt-1.5 text-sm text-red-600">{errors.zone}</p>}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No zones have been created yet.{' '}
                                        <Link href="/admin/zones" className="text-[#1F6FDB] hover:underline">
                                            Create a zone
                                        </Link>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                            />
                            Active
                        </div>
                        {errors.assignment && <p className="text-sm text-red-600">{errors.assignment}</p>}

                        {/* Authority Preview */}
                        {selectedPerson && selectedRole && (data.scope_type === 'estate' || selectedZone) && (
                            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Authority preview
                                </h4>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                    <span className="font-semibold text-slate-900">{selectedPerson.name}</span> will
                                    receive <span className="font-semibold text-slate-900">{selectedRole.name}</span>{' '}
                                    responsibility across{' '}
                                    <span className="font-semibold text-slate-900">
                                        {data.scope_type === 'estate' ? 'the entire estate' : selectedZone?.name}
                                    </span>
                                    .
                                </p>
                            </div>
                        )}

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
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {processing ? 'Assigning...' : 'Assign Authority'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
