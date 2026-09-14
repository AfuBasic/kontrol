import { Head, useForm, router } from '@inertiajs/react';
import {
    Calendar,
    Plus,
    Clock,
    Trash2,
    X,
    CheckCircle2,
    Shield,
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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Access
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Public access schedules for worship services and community events at {organization.name}.
                        </p>
                    </div>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add public time</span>
                        </button>
                    )}
                </div>

                {/* Unified Access Tabs */}
                <AccessTabs
                    activeTab="public_windows"
                    hasPublicWindows={true}
                />

                {/* Explanatory Banner */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-indigo-950">Open Entry Without Passes</h3>
                        <p className="text-xs sm:text-sm text-indigo-900/80 mt-0.5">
                            During these designated times, visitors and congregants can enter the estate without individual access codes.
                        </p>
                    </div>
                </div>

                {/* Windows List */}
                <div className="space-y-3">
                    {windows.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-12 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No public access times scheduled</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                                Add weekly service times or open hours when attendees can visit without passes.
                            </p>
                            {membership.is_admin && (
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(true)}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add schedule</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        windows.map((w) => (
                            <div
                                key={w.id}
                                className="rounded-2xl bg-white border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-slate-800 font-bold text-sm shrink-0 mt-0.5">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                                {w.name}
                                            </h3>
                                            {w.is_open_now && (
                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Open Now
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-medium">
                                            <span>{DAYS[w.day_of_week]}s</span>
                                            <span>•</span>
                                            <span>{w.start_time} – {w.end_time}</span>
                                        </p>
                                        {w.notes && (
                                            <p className="text-xs text-stone-400 mt-1">
                                                {w.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {membership.is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(w.id)}
                                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors self-start sm:self-auto"
                                        title="Delete schedule"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xl text-xs sm:text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                                <h3 className="text-base font-bold text-slate-900">Add Public Access Schedule</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Schedule Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sunday Service or Friday Prayers"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Day of the Week</label>
                                    <select
                                        value={data.day_of_week}
                                        onChange={(e) => setData('day_of_week', parseInt(e.target.value, 10))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                        <label className="block text-slate-700 font-medium mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-medium mb-1">End Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.end_time}
                                            onChange={(e) => setData('end_time', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">
                                        Notes <span className="text-stone-400">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Open to all congregation members"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-stone-600 hover:text-slate-900 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 shadow-xs"
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
