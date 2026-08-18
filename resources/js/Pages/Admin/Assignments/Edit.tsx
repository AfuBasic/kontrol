import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { Globe, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import SearchableSelect from '@/Components/UI/SearchableSelect';

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
    user_role_ids: string[];
    roles: OptionRole[];
    zones: OptionZone[];
};

export default function EditAssignment({ assignment, user_role_ids, roles, zones }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        role_ids: user_role_ids,
        scope_type: assignment.scope_type,
        zone_id: assignment.zone ? String(assignment.zone.id) : '',
        is_active: assignment.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(update.url(assignment.id));
    };

    const selectedZone = zones.find((z) => z.id.toString() === data.zone_id);

    const handleRoleToggle = (roleId: string) => {
        if (data.role_ids.includes(roleId)) {
            setData(
                'role_ids',
                data.role_ids.filter((id) => id !== roleId),
            );
        } else {
            setData('role_ids', [...data.role_ids, roleId]);
        }
    };

    const isReadyToSubmit = data.role_ids.length > 0 && (data.scope_type === 'estate' || data.zone_id);

    const initial = assignment.user.name ? assignment.user.name.charAt(0).toUpperCase() : 'U';

    return (
        <>
            <Head title="Edit Authority" />

            <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Staff & Authority
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Edit authority</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                        Modify the administrative responsibility and coverage for this member.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                    <form onSubmit={submit} className="flex flex-col">
                        <div className="space-y-12 p-8">
                            {/* SECTION 1: PERSON */}
                            <section>
                                <div className="mb-4">
                                    <h2 className="text-[13px] font-black text-slate-900">Person</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">The estate member holding this responsibility.</p>
                                </div>
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base font-black text-blue-700">
                                            {initial}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-sm font-black text-slate-900">{assignment.user.name}</span>
                                            <span className="mt-0.5 block text-xs font-bold text-slate-500">{assignment.user.email}</span>
                                        </div>
                                        <div className="shrink-0 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                            Cannot be changed
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px w-full bg-slate-100" />

                            {/* SECTION 2: RESPONSIBILITY */}
                            <section>
                                <div className="mb-4">
                                    <h2 className="text-[13px] font-black text-slate-900">Responsibility</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Choose the role that defines what they can manage.</p>
                                </div>
                                <div className="max-w-2xl">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {roles.map((role) => {
                                            const isSelected = data.role_ids.includes(role.id.toString());
                                            return (
                                                <label
                                                    key={role.id}
                                                    className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                                                        isSelected
                                                            ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="role_ids"
                                                        value={role.id}
                                                        checked={isSelected}
                                                        onChange={() => handleRoleToggle(role.id.toString())}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">{role.name}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {errors.role_ids && <p className="mt-2 text-xs font-bold text-red-600">{errors.role_ids}</p>}
                                    {errors.role && <p className="mt-2 text-xs font-bold text-red-600">{errors.role}</p>}
                                </div>
                            </section>

                            <div className="h-px w-full bg-slate-100" />

                            {/* SECTION 3: COVERAGE */}
                            <section>
                                <div className="mb-4">
                                    <h2 className="text-[13px] font-black text-slate-900">Coverage</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Choose where this responsibility applies.</p>
                                </div>
                                <div className="max-w-2xl">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label
                                            className={`relative flex cursor-pointer gap-4 rounded-xl border p-4 transition-all ${
                                                data.scope_type === 'estate'
                                                    ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="scope_type"
                                                value="estate"
                                                checked={data.scope_type === 'estate'}
                                                onChange={() => setData({ ...data, scope_type: 'estate', zone_id: '' })}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                    data.scope_type === 'estate' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-sm font-black text-slate-900">Entire estate</span>
                                                <span className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                                    Authority applies across the estate
                                                </span>
                                            </div>
                                        </label>

                                        <label
                                            className={`relative flex cursor-pointer gap-4 rounded-xl border p-4 transition-all ${
                                                data.scope_type === 'zone'
                                                    ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="scope_type"
                                                value="zone"
                                                checked={data.scope_type === 'zone'}
                                                onChange={() => setData({ ...data, scope_type: 'zone' })}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                    data.scope_type === 'zone' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-sm font-black text-slate-900">Specific zone</span>
                                                <span className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                                    Authority is limited to selected zone(s)
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                    {errors.scope_type && <p className="mt-2 text-xs font-bold text-red-600">{errors.scope_type}</p>}

                                    {data.scope_type === 'zone' && (
                                        <div className="mt-5 max-w-xl">
                                            <label className="mb-2 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                Select Zone
                                            </label>
                                            {zones.length > 0 ? (
                                                <SearchableSelect
                                                    options={zones.map((z) => ({ value: z.id, label: z.name }))}
                                                    value={data.zone_id}
                                                    onChange={(v) => setData('zone_id', v)}
                                                    placeholder="Search zones..."
                                                />
                                            ) : (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                    <p className="text-xs font-bold text-amber-800">
                                                        No zones have been created yet.{' '}
                                                        <Link href="/admin/zones" className="underline hover:text-amber-900">
                                                            Create a zone
                                                        </Link>
                                                    </p>
                                                </div>
                                            )}
                                            {errors.zone_id && <p className="mt-2 text-xs font-bold text-red-600">{errors.zone_id}</p>}
                                            {errors.zone && <p className="mt-2 text-xs font-bold text-red-600">{errors.zone}</p>}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="h-px w-full bg-slate-100" />

                            {/* SECTION 4: STATUS */}
                            <section>
                                <div className="mb-4">
                                    <h2 className="text-[13px] font-black text-slate-900">Status</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Active assignments grant administrative access.</p>
                                </div>
                                <div className="max-w-xl">
                                    <div
                                        className={`rounded-xl border p-4 transition-colors ${
                                            data.is_active ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={data.is_active}
                                                onClick={() => setData('is_active', !data.is_active)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 focus:outline-none ${
                                                    data.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                                                }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                        data.is_active ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                            <div>
                                                <span className="text-sm font-black text-slate-900">
                                                    {data.is_active ? 'Authority is active' : 'Authority is inactive'}
                                                </span>
                                                {!data.is_active && (
                                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-amber-600">
                                                        <ShieldAlert className="h-3.5 w-3.5" />
                                                        Administrative access is currently suspended.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {errors.assignment && (
                                <div className="max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-bold text-red-800">{errors.assignment}</p>
                                </div>
                            )}
                        </div>

                        {/* LIVE SUMMARY & ACTIONS FOOTER */}
                        <div className="border-t border-slate-100 bg-slate-50/50 p-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1">
                                    {isReadyToSubmit && (
                                        <>
                                            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Authority summary</h3>
                                            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                                                <span className="font-black text-slate-900">{assignment.user.name}</span> will have{' '}
                                                <span className="font-black text-slate-900">
                                                    {roles
                                                        .filter((r) => data.role_ids.map(String).includes(r.id.toString()))
                                                        .map((r) => r.name)
                                                        .join(', ')}
                                                </span>{' '}
                                                responsibility across{' '}
                                                <span className="font-black text-slate-900">
                                                    {data.scope_type === 'estate' ? 'the entire estate' : selectedZone?.name}
                                                </span>
                                                .
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <Link
                                        href={index.url()}
                                        className="rounded-xl px-5 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-800"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={!isReadyToSubmit || processing}
                                        className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
