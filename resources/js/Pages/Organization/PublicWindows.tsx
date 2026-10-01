import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import ConfirmationSheet from '@/Components/ConfirmationSheet';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface WalkInWindow {
    id: number;
    name: string;
    day_of_week: number;
    start_time: string; // HH:mm
    end_time: string; // HH:mm
    is_active: boolean;
    notes: string | null;
    is_open_now: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
        policy_lock: 'hospital' | 'estate' | null;
        walk_in: { open: boolean; label: string };
    };
    membership: { role: string; is_admin: boolean };
    windows: WalkInWindow[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Week shown Monday first.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const formatTime = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const POLICY_OPTIONS = [
    { value: 'managed', title: 'No walk-ins', description: 'Only members and visitors with a pass are admitted.' },
    { value: 'public_window', title: 'During our hours', description: 'Walk-ins are admitted only during the hours you set below.' },
] as const;

// "Any time" is granted by the estate admin only, so it is never offered as a choice here.
const LOCKED_COPY = {
    hospital: 'Hospitals and clinics always admit walk-ins. This cannot be changed.',
    estate: 'The estate admin allows walk-ins at any hour for this organization. Ask them if you need to change it.',
} as const;

export default function PublicWindows({ organization, membership, windows }: Props) {
    const [sheet, setSheet] = useState<'add' | 'edit' | null>(null);
    const [editing, setEditing] = useState<WalkInWindow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const addForm = useForm<{ name: string; days: number[]; start_time: string; end_time: string; notes: string }>({
        name: '',
        days: [],
        start_time: '08:00',
        end_time: '12:00',
        notes: '',
    });

    const editForm = useForm({ name: '', day_of_week: 1, start_time: '08:00', end_time: '12:00', is_active: true, notes: '' });

    const byDay = (day: number) => windows.filter((w) => w.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const usesHours = organization.access_policy === 'public_window';

    // The organization's own choice of who can walk in; the estate admin can still change it too.
    const [policy, setPolicy] = useState(organization.access_policy);
    const [savingPolicy, setSavingPolicy] = useState(false);
    const policyChanged = policy !== organization.access_policy;
    const canEditPolicy = membership.is_admin && organization.policy_lock === null;

    const savePolicy = () => {
        setSavingPolicy(true);
        router.patch('/org/walk-in-policy', { access_policy: policy }, { preserveScroll: true, onFinish: () => setSavingPolicy(false) });
    };

    const openAdd = () => {
        addForm.reset();
        addForm.clearErrors();
        // First time: most organizations open on weekdays, so start there.
        if (windows.length === 0) addForm.setData('days', [1, 2, 3, 4, 5]);
        setSheet('add');
    };

    const openEdit = (window: WalkInWindow) => {
        if (!membership.is_admin) return;
        setEditing(window);
        editForm.setData({
            name: window.name,
            day_of_week: window.day_of_week,
            start_time: window.start_time,
            end_time: window.end_time,
            is_active: window.is_active,
            notes: window.notes ?? '',
        });
        editForm.clearErrors();
        setSheet('edit');
    };

    const toggleDay = (day: number) =>
        addForm.setData('days', addForm.data.days.includes(day) ? addForm.data.days.filter((d) => d !== day) : [...addForm.data.days, day]);

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/org/public-windows', { preserveScroll: true, onSuccess: () => setSheet(null) });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.patch(`/org/public-windows/${editing.id}`, { preserveScroll: true, onSuccess: () => setSheet(null) });
    };

    const removeWindow = () => {
        if (!editing) return;
        setDeleting(true);
        router.delete(`/org/public-windows/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDelete(false);
                setSheet(null);
            },
            onFinish: () => setDeleting(false),
        });
    };

    const inputClass =
        'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] text-[#071f4b] focus:border-[#1a5dbf] focus:ring-4 focus:ring-[#1a5dbf]/10 focus:outline-none';

    return (
        <OrganizationLayout title="Walk-in hours" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - Walk-in hours`} />

            <div className="mx-auto flex max-w-[560px] flex-col px-4 pt-1 pb-28">
                <Link
                    href="/org/settings"
                    className="-ml-1.5 inline-flex min-h-[44px] items-center gap-0.5 self-start pr-3 text-[14px] text-[#1a5dbf]"
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                    Profile
                </Link>

                <header className="mt-1 flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-[#071f4b]">Walk-ins</h1>
                        <p className="mt-1 text-[13px] text-slate-500">Whether security can admit visitors who have no pass.</p>
                    </div>
                    {membership.is_admin && usesHours && (
                        <button
                            type="button"
                            onClick={openAdd}
                            className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3.5 text-[13px] font-semibold text-[#1a5dbf] active:scale-95"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Add hours
                        </button>
                    )}
                </header>

                {/* Right now */}
                <div
                    className={`mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 ${
                        organization.walk_in.open ? 'bg-emerald-50/70 ring-emerald-100' : 'bg-slate-50 ring-slate-200/70'
                    }`}
                >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${organization.walk_in.open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <div>
                        <p className={`text-[15px] font-medium ${organization.walk_in.open ? 'text-emerald-800' : 'text-[#071f4b]'}`}>
                            {organization.walk_in.label}
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {organization.walk_in.open ? 'Security is admitting walk-ins now.' : 'Walk-ins are turned away at the gate.'}
                        </p>
                    </div>
                </div>

                {/* Who can walk in */}
                <section className="mt-6" aria-labelledby="walk-in-policy-heading">
                    <h2 id="walk-in-policy-heading" className="mb-2 px-0.5 text-[13px] font-medium text-slate-500">
                        Who can walk in
                    </h2>

                    {organization.policy_lock ? (
                        <p className="rounded-2xl border border-slate-200/60 bg-white px-4 py-3.5 text-[14px] text-[#071f4b]">
                            Any time
                            <span className="mt-0.5 block text-[12px] text-slate-500">{LOCKED_COPY[organization.policy_lock]}</span>
                        </p>
                    ) : (
                        <div
                            role="radiogroup"
                            aria-labelledby="walk-in-policy-heading"
                            className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white"
                        >
                            {POLICY_OPTIONS.map((option) => {
                                const selected = policy === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        disabled={!canEditPolicy}
                                        onClick={() => setPolicy(option.value)}
                                        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50 disabled:active:bg-transparent"
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                selected ? 'border-[#1a5dbf]' : 'border-slate-300'
                                            }`}
                                        >
                                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#1a5dbf]" />}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[15px] text-[#071f4b]">{option.title}</span>
                                            <span className="block text-[12px] text-slate-500">{option.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!canEditPolicy && !organization.policy_lock && (
                        <p className="mt-2 px-0.5 text-[12px] text-slate-500">Only organization admins can change this.</p>
                    )}

                    {canEditPolicy && policyChanged && (
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-[12px] text-slate-500">
                                {policy === 'managed'
                                    ? 'Security will turn away everyone without a pass.'
                                    : 'Security will admit walk-ins only during your hours.'}
                            </p>
                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPolicy(organization.access_policy)}
                                    disabled={savingPolicy}
                                    className="min-h-[44px] rounded-xl px-3 text-[14px] text-slate-600 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={savePolicy}
                                    disabled={savingPolicy}
                                    className="min-h-[44px] rounded-xl bg-[#071f4b] px-4 text-[14px] font-medium text-white disabled:opacity-60"
                                >
                                    {savingPolicy ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {usesHours && windows.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 px-5 py-6 text-center">
                        <p className="text-[16px] font-semibold text-amber-950">No walk-in hours yet</p>
                        <p className="mx-auto mt-1 max-w-xs text-[13px] text-amber-900/80">
                            Until you add them, security turns away anyone who arrives for {organization.name} without a pass.
                        </p>
                        {membership.is_admin ? (
                            <button
                                type="button"
                                onClick={openAdd}
                                className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#071f4b] px-5 text-[15px] font-medium text-white active:scale-95"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                Add your hours
                            </button>
                        ) : (
                            <p className="mt-3 text-[13px] text-amber-900">Ask an organization admin to add them.</p>
                        )}
                    </div>
                )}

                {/* Week (only meaningful when walk-ins follow the organization's hours) */}
                {usesHours && (
                    <section className="mt-6">
                        <h2 className="mb-2 px-0.5 text-[13px] font-medium text-slate-500">This week</h2>
                        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                            {WEEK_ORDER.map((day) => {
                                const dayWindows = byDay(day);
                                const isToday = new Date().getDay() === day;
                                return (
                                    <li key={day} className="flex gap-3 px-4 py-3">
                                        <span
                                            className={`w-12 shrink-0 pt-0.5 text-[13px] ${isToday ? 'font-semibold text-[#1a5dbf]' : 'text-slate-500'}`}
                                        >
                                            {SHORT_DAYS[day]}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            {dayWindows.length === 0 ? (
                                                <p className="pt-0.5 text-[14px] text-slate-400">Closed</p>
                                            ) : (
                                                <div className="-my-1 flex flex-col">
                                                    {dayWindows.map((w) => (
                                                        <button
                                                            key={w.id}
                                                            type="button"
                                                            onClick={() => openEdit(w)}
                                                            disabled={!membership.is_admin}
                                                            className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg py-1 text-left active:bg-slate-50 disabled:active:bg-transparent"
                                                        >
                                                            <span className="min-w-0">
                                                                <span
                                                                    className={`block text-[14px] ${w.is_active ? 'text-[#071f4b]' : 'text-slate-400 line-through'}`}
                                                                >
                                                                    {formatTime(w.start_time)} – {formatTime(w.end_time)}
                                                                    {w.is_open_now && (
                                                                        <span className="ml-2 text-[12px] font-medium text-emerald-700">
                                                                            Open now
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {w.name && w.name !== 'Walk-in hours' && (
                                                                    <span className="block truncate text-[12px] text-slate-500">{w.name}</span>
                                                                )}
                                                            </span>
                                                            {membership.is_admin && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {!membership.is_admin && (
                            <p className="mt-2 px-0.5 text-[12px] text-slate-500">Only organization admins can change these hours.</p>
                        )}
                    </section>
                )}
            </div>

            {/* Add hours */}
            <ResponsiveSheet isOpen={sheet === 'add'} onClose={() => setSheet(null)}>
                <form onSubmit={submitAdd} className="space-y-5">
                    <div>
                        <h3 className="text-[18px] font-semibold text-[#071f4b]">Add walk-in hours</h3>
                        <p className="mt-0.5 text-[13px] text-slate-500">Pick every day these hours apply to.</p>
                    </div>

                    <div>
                        <span className="text-[12px] font-medium text-slate-600">Days</span>
                        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                            {WEEK_ORDER.map((day) => {
                                const selected = addForm.data.days.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        aria-pressed={selected}
                                        className={`min-h-[44px] rounded-xl text-[13px] font-medium transition active:scale-95 ${
                                            selected ? 'bg-[#071f4b] text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'
                                        }`}
                                    >
                                        {SHORT_DAYS[day].slice(0, 2)}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex gap-3 text-[12px]">
                            <button type="button" className="text-[#1a5dbf]" onClick={() => addForm.setData('days', [1, 2, 3, 4, 5])}>
                                Weekdays
                            </button>
                            <button type="button" className="text-[#1a5dbf]" onClick={() => addForm.setData('days', [0, 1, 2, 3, 4, 5, 6])}>
                                Every day
                            </button>
                        </div>
                        {addForm.errors.days && <p className="mt-1.5 text-[12px] text-rose-600">{addForm.errors.days}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-[12px] font-medium text-slate-600">Opens</span>
                            <input
                                type="time"
                                value={addForm.data.start_time}
                                onChange={(e) => addForm.setData('start_time', e.target.value)}
                                className={inputClass}
                            />
                        </label>
                        <label className="block">
                            <span className="text-[12px] font-medium text-slate-600">Closes</span>
                            <input
                                type="time"
                                value={addForm.data.end_time}
                                onChange={(e) => addForm.setData('end_time', e.target.value)}
                                className={inputClass}
                            />
                        </label>
                    </div>
                    {(addForm.errors.end_time || addForm.errors.start_time) && (
                        <p className="-mt-3 text-[12px] text-rose-600">{addForm.errors.end_time || addForm.errors.start_time}</p>
                    )}

                    <label className="block">
                        <span className="text-[12px] font-medium text-slate-600">Label (optional)</span>
                        <input
                            type="text"
                            placeholder="e.g. School run, Sunday service"
                            value={addForm.data.name}
                            onChange={(e) => addForm.setData('name', e.target.value)}
                            className={inputClass}
                        />
                    </label>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" onClick={() => setSheet(null)} className="min-h-[44px] rounded-xl px-4 text-[14px] text-slate-600">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addForm.processing || addForm.data.days.length === 0}
                            className="min-h-[44px] rounded-xl bg-[#071f4b] px-5 text-[14px] font-medium text-white disabled:opacity-50"
                        >
                            {addForm.processing ? 'Saving…' : 'Save hours'}
                        </button>
                    </div>
                </form>
            </ResponsiveSheet>

            {/* Edit hours */}
            <ResponsiveSheet isOpen={sheet === 'edit' && !confirmDelete} onClose={() => setSheet(null)}>
                <form onSubmit={submitEdit} className="space-y-5">
                    <h3 className="text-[18px] font-semibold text-[#071f4b]">Edit walk-in hours</h3>

                    <label className="block">
                        <span className="text-[12px] font-medium text-slate-600">Day</span>
                        <select
                            value={editForm.data.day_of_week}
                            onChange={(e) => editForm.setData('day_of_week', parseInt(e.target.value, 10))}
                            className={inputClass}
                        >
                            {WEEK_ORDER.map((day) => (
                                <option key={day} value={day}>
                                    {DAYS[day]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-[12px] font-medium text-slate-600">Opens</span>
                            <input
                                type="time"
                                value={editForm.data.start_time}
                                onChange={(e) => editForm.setData('start_time', e.target.value)}
                                className={inputClass}
                            />
                        </label>
                        <label className="block">
                            <span className="text-[12px] font-medium text-slate-600">Closes</span>
                            <input
                                type="time"
                                value={editForm.data.end_time}
                                onChange={(e) => editForm.setData('end_time', e.target.value)}
                                className={inputClass}
                            />
                        </label>
                    </div>
                    {editForm.errors.end_time && <p className="-mt-3 text-[12px] text-rose-600">{editForm.errors.end_time}</p>}

                    <label className="block">
                        <span className="text-[12px] font-medium text-slate-600">Label (optional)</span>
                        <input
                            type="text"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            className={inputClass}
                        />
                    </label>

                    <label className="flex min-h-[44px] items-center justify-between rounded-xl bg-slate-50 px-3.5 ring-1 ring-slate-200/70">
                        <span className="text-[14px] text-[#071f4b]">In use</span>
                        <input
                            type="checkbox"
                            checked={editForm.data.is_active}
                            onChange={(e) => editForm.setData('is_active', e.target.checked)}
                            className="h-5 w-5 rounded accent-[#1a5dbf]"
                        />
                    </label>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-[14px] text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setSheet(null)} className="min-h-[44px] rounded-xl px-4 text-[14px] text-slate-600">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="min-h-[44px] rounded-xl bg-[#071f4b] px-5 text-[14px] font-medium text-white disabled:opacity-50"
                            >
                                {editForm.processing ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </ResponsiveSheet>

            <ConfirmationSheet
                isOpen={confirmDelete}
                onClose={() => !deleting && setConfirmDelete(false)}
                onConfirm={removeWindow}
                title="Remove these hours?"
                message={
                    editing
                        ? `${DAYS[editing.day_of_week]} ${formatTime(editing.start_time)} – ${formatTime(editing.end_time)} will no longer admit walk-ins.`
                        : ''
                }
                confirmLabel="Remove"
                type="danger"
                isLoading={deleting}
            />
        </OrganizationLayout>
    );
}
