import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { Globe, MapPin, Loader2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import SearchableSelect from '@/Components/UI/SearchableSelect';

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

    const isReadyToSubmit = data.user_id && data.role_id && (data.scope_type === 'estate' || data.zone_id);

    return (
        <>
            <Head title="Assign Authority" />

            <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
                <div className="mb-8">
                    <Link
                        href={index.url()}
                        className="mb-4 inline-flex items-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Staff & Authority
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Assign authority</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                        Give a member of your estate responsibility to manage operations across the estate or specific zones.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-10">
                    {/* SECTION 1: PERSON */}
                    <section>
                        <div className="mb-4">
                            <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Person</h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Choose the estate member who should receive this responsibility.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50">
                            {users.length > 0 ? (
                                <SearchableSelect
                                    options={users.map((u) => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`,
                                    }))}
                                    value={data.user_id}
                                    onChange={(v) => setData('user_id', v)}
                                    placeholder="Search members by name or email..."
                                    className="w-full"
                                />
                            ) : (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-xs font-bold text-amber-800">No eligible estate members are available.</p>
                                </div>
                            )}
                            {errors.user_id && <p className="mt-2 text-xs font-bold text-red-600">{errors.user_id}</p>}
                            {errors.user && <p className="mt-2 text-xs font-bold text-red-600">{errors.user}</p>}
                        </div>
                    </section>

                    {/* SECTION 2: RESPONSIBILITY */}
                    <section>
                        <div className="mb-4">
                            <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Responsibility</h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">Choose the role that defines what they can manage.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {roles.map((role) => (
                                    <label
                                        key={role.id}
                                        className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                                            data.role_id === role.id.toString()
                                                ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role_id"
                                            value={role.id}
                                            checked={data.role_id === role.id.toString()}
                                            onChange={(e) => setData('role_id', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{role.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.role_id && <p className="mt-2 text-xs font-bold text-red-600">{errors.role_id}</p>}
                            {errors.role && <p className="mt-2 text-xs font-bold text-red-600">{errors.role}</p>}
                        </div>
                    </section>

                    {/* SECTION 3: COVERAGE */}
                    <section>
                        <div className="mb-4">
                            <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Coverage</h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">Choose where this responsibility applies.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50">
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
                                        <span className="mt-0.5 text-[11px] font-semibold text-slate-500">Authority applies across the estate</span>
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
                                <div className="mt-5 border-t border-slate-100 pt-5">
                                    <label className="mb-2 block text-xs font-black text-slate-800">Select Zone</label>
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

                    {errors.assignment && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-bold text-red-800">{errors.assignment}</p>
                        </div>
                    )}

                    {/* LIVE SUMMARY & ACTIONS */}
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                {isReadyToSubmit ? (
                                    <>
                                        <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Authority Summary</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                            <span className="font-black text-slate-900">{selectedPerson?.name}</span> will receive{' '}
                                            <span className="font-black text-slate-900">{selectedRole?.name}</span> responsibility across{' '}
                                            <span className="font-black text-slate-900">
                                                {data.scope_type === 'estate' ? 'the entire estate' : selectedZone?.name}
                                            </span>
                                            .
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm font-semibold text-slate-400">
                                        Select a person, responsibility, and coverage to view the summary.
                                    </p>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                                <Link
                                    href={index.url()}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase transition-colors hover:bg-slate-100"
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
                                            Assigning...
                                        </>
                                    ) : (
                                        'Assign authority'
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </>
    );
}
