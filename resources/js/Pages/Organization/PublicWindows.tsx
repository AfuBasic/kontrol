import { Head, useForm, router } from '@inertiajs/react';
import {
    Calendar,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    X,
    AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
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
        if (confirm('Are you sure you want to delete this public access window?')) {
            router.delete(`/org/public-windows/${id}`);
        }
    };

    return (
        <OrganizationLayout title="Public Access Windows">
            <Head title={`${organization.name} - Public Windows`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                            Public Access Windows
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Define recurring open worship or community hours when visitors can enter without private invitation passes.
                        </p>
                    </div>

                    {membership.is_admin && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Access Window
                        </button>
                    )}
                </div>

                {/* Windows Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {windows.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            No public access windows scheduled. Click "Add Access Window" to define one.
                        </div>
                    ) : (
                        windows.map((window) => (
                            <div
                                key={window.id}
                                className={`rounded-xl border p-4 space-y-3 shadow-sm ${
                                    window.is_open_now
                                        ? 'bg-emerald-950/15 border-emerald-500/30'
                                        : 'bg-zinc-900/40 border-zinc-800/80'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{window.name}</h3>
                                        <div className="text-xs text-indigo-400 font-medium mt-0.5">
                                            {DAYS[window.day_of_week]}
                                        </div>
                                    </div>

                                    {window.is_open_now ? (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                                            Open Now
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                            Scheduled
                                        </span>
                                    )}
                                </div>

                                <div className="text-xs text-zinc-300 flex items-center gap-1.5 font-mono">
                                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>{window.start_time} — {window.end_time}</span>
                                </div>

                                {window.notes && (
                                    <p className="text-[11px] text-zinc-500 italic">{window.notes}</p>
                                )}

                                {membership.is_admin && (
                                    <div className="pt-2 border-t border-zinc-800/60 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(window.id)}
                                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                                <h3 className="text-sm font-semibold text-white">Add Public Access Window</h3>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-1 rounded text-zinc-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">Window Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. Sunday Morning Service"
                                    />
                                    {errors.name && <p className="text-rose-400 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">Day of the Week</label>
                                    <select
                                        value={data.day_of_week}
                                        onChange={(e) => setData('day_of_week', parseInt(e.target.value, 10))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
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
                                        <label className="block text-zinc-300 font-medium mb-1">Start Time (24h)</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        />
                                        {errors.start_time && <p className="text-rose-400 mt-1">{errors.start_time}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-zinc-300 font-medium mb-1">End Time (24h)</label>
                                        <input
                                            type="time"
                                            required
                                            value={data.end_time}
                                            onChange={(e) => setData('end_time', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        />
                                        {errors.end_time && <p className="text-rose-400 mt-1">{errors.end_time}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-zinc-300 font-medium mb-1">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. Main auditorium open to all worshippers"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save Window'}
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
