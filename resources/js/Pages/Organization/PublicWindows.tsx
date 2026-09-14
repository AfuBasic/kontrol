import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

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

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
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
        <OrganizationLayout title="Access - Public Times">
            <Head title={`${organization.name} - Public Access Times`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Public access times
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 mt-1">
                            Times when visitors can enter without individual access codes.
                        </p>
                    </div>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add schedule</span>
                        </button>
                    )}
                </div>

                {/* Sub Navigation */}
                <AccessTabs
                    activeTab="public_windows"
                    hasPublicWindows={true}
                />

                {/* Editorial List */}
                {windows.length === 0 ? (
                    <div className="py-6 space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-800">
                            No public access schedules yet.
                        </p>
                        <p className="text-sm text-slate-500">
                            Add weekly service times or open hours when attendees can visit without individual passes.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {windows.map((w) => (
                            <div
                                key={w.id}
                                className="py-4 flex items-center justify-between gap-4"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <p className="font-bold text-base text-slate-900">
                                            {w.name}
                                        </p>
                                        <span className="text-xs font-semibold text-slate-500">
                                            · {DAYS[w.day_of_week]}s, {w.start_time} – {w.end_time}
                                        </span>
                                        {w.is_open_now && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                                Open now
                                            </span>
                                        )}
                                    </div>
                                    {w.notes && (
                                        <p className="text-xs text-slate-400">{w.notes}</p>
                                    )}
                                </div>

                                {membership.is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(w.id)}
                                        className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors p-1"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Add public access schedule</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">Schedule Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sunday Service"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">Day of the Week</label>
                                    <select
                                        value={data.day_of_week}
                                        onChange={(e) => setData('day_of_week', parseInt(e.target.value, 10))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    >
                                        {DAYS.map((day, idx) => (
                                            <option key={day} value={idx}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">End Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.end_time}
                                            onChange={(e) => setData('end_time', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">
                                        Notes <span className="text-slate-400 normal-case font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Open to all congregation members"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Add schedule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
