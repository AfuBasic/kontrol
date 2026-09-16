import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Clock, DoorOpen, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';

interface PublicWindow {
    id: number;
    name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    notes: string | null;
    is_open_now: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    windows: PublicWindow[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PublicWindows({ organization, membership, windows }: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        day_of_week: 0,
        start_time: '08:00',
        end_time: '12:00',
        is_active: true,
        notes: '',
    });

    const handleCreate = (event: React.FormEvent) => {
        event.preventDefault();

        post('/org/public-windows', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this public access time?')) {
            router.delete(`/org/public-windows/${id}`);
        }
    };

    return (
        <OrganizationLayout title="Access - Public Times" contentClassName="max-w-[86rem]">
            <Head title={`${organization.name} - Public Access Times`} />

            <div className="space-y-5">
                <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-black text-[#0b4aa2]">Public access policy</p>
                            <h1 className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                                Times visitors can enter without individual codes
                            </h1>
                            <p className="mt-3 text-sm leading-6 font-semibold text-slate-500 sm:text-base">
                                Use this for services, clinic hours, school runs, or other predictable access windows.
                            </p>
                        </div>

                        {membership.is_admin && (
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(true)}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.20)]"
                            >
                                <Plus className="h-4 w-4" />
                                Add time
                            </button>
                        )}
                    </div>

                    <div className="mt-6">
                        <AccessTabs activeTab="public_windows" hasPublicWindows={true} />
                    </div>
                </section>

                {windows.length === 0 ? (
                    <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-8">
                        <div className="flex max-w-2xl gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0b4aa2]">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-950">No public access times yet.</h2>
                                <p className="mt-3 text-sm leading-6 font-semibold text-slate-500">
                                    Add the regular windows when the estate gate should expect visitors for {organization.name}.
                                </p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {windows.map((window) => (
                            <article
                                key={window.id}
                                className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                                        <DoorOpen className="h-6 w-6" />
                                    </div>
                                    {window.is_open_now && (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
                                            Open now
                                        </span>
                                    )}
                                </div>

                                <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">{window.name}</h2>
                                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {DAYS[window.day_of_week]}s, {window.start_time} to {window.end_time}
                                </p>
                                {window.notes && <p className="mt-3 text-sm leading-6 font-semibold text-slate-500">{window.notes}</p>}

                                {membership.is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(window.id)}
                                        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-rose-50 px-3 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                    </button>
                                )}
                            </article>
                        ))}
                    </section>
                )}

                <ResponsiveSheet isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)}>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">Add public time</h3>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Tell security when this destination is open to the public.
                            </p>
                        </div>
                    </div>

                    <form noValidate onSubmit={handleCreate} className="space-y-4 pt-5">
                        <div>
                            <label className="text-sm font-black text-slate-950">Schedule name</label>
                            <input
                                type="text"
                                placeholder="e.g. Sunday service"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                            />
                            {errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-black text-slate-950">Day</label>
                            <select
                                value={data.day_of_week}
                                onChange={(event) => setData('day_of_week', parseInt(event.target.value, 10))}
                                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                            >
                                {DAYS.map((day, index) => (
                                    <option key={day} value={index}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                            {errors.day_of_week && <p className="mt-1 text-xs font-bold text-rose-600">{errors.day_of_week}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-black text-slate-950">Start</label>
                                <input
                                    type="time"
                                    value={data.start_time}
                                    onChange={(event) => setData('start_time', event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                                />
                                {errors.start_time && <p className="mt-1 text-xs font-bold text-rose-600">{errors.start_time}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-black text-slate-950">End</label>
                                <input
                                    type="time"
                                    value={data.end_time}
                                    onChange={(event) => setData('end_time', event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                                />
                                {errors.end_time && <p className="mt-1 text-xs font-bold text-rose-600">{errors.end_time}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-black text-slate-950">Notes</label>
                            <input
                                type="text"
                                placeholder="e.g. Open to congregation members"
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 focus:border-[#0b4aa2] focus:ring-4 focus:ring-[#0b4aa2]/10 focus:outline-none"
                            />
                            {errors.notes && <p className="mt-1 text-xs font-bold text-rose-600">{errors.notes}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="rounded-2xl px-4 py-2.5 text-sm font-black text-slate-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl bg-[#0f172a] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Add time'}
                            </button>
                        </div>
                    </form>
                </ResponsiveSheet>
            </div>
        </OrganizationLayout>
    );
}
