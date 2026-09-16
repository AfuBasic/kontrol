import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { ChevronRight, LogOut, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface StaffMember {
    id: number;
    user_id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        access_policy: string;
        arrival_confirmation_required: boolean;
        confirmation_window_minutes: number;
        confirmation_escalation: string;
        is_unrestricted: boolean;
        estate_name?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    staff: StaffMember[];
}

export default function Settings({ organization, membership, staff }: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const [activeModal, setActiveModal] = useState<'details' | 'team' | 'preferences' | 'help' | null>(null);

    const policyForm = useForm({
        arrival_confirmation_required: organization.arrival_confirmation_required,
        confirmation_window_minutes: organization.confirmation_window_minutes || 15,
        confirmation_escalation: organization.confirmation_escalation || 'alert_only',
    });

    const inviteForm = useForm({
        email: '',
        role: 'member',
    });

    const handleUpdatePolicy = (e: React.FormEvent) => {
        e.preventDefault();
        policyForm.patch('/org/settings/confirmation-policy', {
            onSuccess: () => setActiveModal(null),
        });
    };

    const handleInviteStaff = (e: React.FormEvent) => {
        e.preventDefault();
        inviteForm.post('/org/settings/staff', {
            onSuccess: () => inviteForm.reset(),
        });
    };

    const handleRemoveStaff = (id: number) => {
        if (confirm('Remove this team member from organization management?')) {
            router.delete(`/org/settings/staff/${id}`);
        }
    };

    return (
        <OrganizationLayout title="Profile">
            <Head title={`${organization.name} - Profile`} />

            <div className="max-w-xl space-y-8">
                {/* 1. Profile Header (Resident-style avatar & identity) */}
                <div className="flex items-center gap-4 py-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-2xl font-black text-white shadow-md">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{user.name || 'Account'}</h1>
                        <p className="truncate text-xs font-semibold text-slate-400">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span>{organization.name}</span>
                            <span>·</span>
                            <span className="capitalize">{membership.role || 'Member'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. ACCOUNT SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Account</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <Link
                            href="/resident/profile"
                            className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Personal information</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link
                            href="/org/notifications"
                            className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Notifications</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                    </div>
                </section>

                {/* 3. ORGANIZATION SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">{organization.name}</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setActiveModal('details')}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Organization details</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('team')}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Team</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        {!organization.is_unrestricted && membership.is_admin && (
                            <button
                                type="button"
                                onClick={() => setActiveModal('preferences')}
                                className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                            >
                                <span className="text-sm font-bold text-slate-900">Arrival preferences</span>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                            </button>
                        )}
                    </div>
                </section>

                {/* 4. KONTROL SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Kontrol</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setActiveModal('help')}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Help & Support</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-rose-50/50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-rose-600">Sign out</span>
                            <LogOut className="h-4 w-4 text-rose-400" />
                        </Link>
                    </div>
                </section>

                {/* FOCUSED MODAL: ORGANIZATION DETAILS */}
                {activeModal === 'details' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 text-sm shadow-xl sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Organization Details</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-3 py-2 text-xs sm:text-sm">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Name</span>
                                    <p className="mt-0.5 font-bold text-slate-900">{organization.name}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Estate</span>
                                    <p className="mt-0.5 font-bold text-slate-900">{organization.estate_name || 'Estate'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Category</span>
                                    <p className="mt-0.5 font-bold text-slate-900 capitalize">{organization.type}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Policy Setup</span>
                                    <p className="mt-0.5 font-bold text-slate-900">
                                        {organization.is_unrestricted ? 'Unrestricted destination (Open entry)' : 'Managed facility'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOCUSED MODAL: TEAM */}
                {activeModal === 'team' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                        <div className="max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-white p-6 text-sm shadow-xl sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {membership.is_admin && (
                                <form noValidate onSubmit={handleInviteStaff} className="space-y-2 border-b border-slate-100 pt-1 pb-3">
                                    <span className="text-xs font-bold text-slate-700">Invite someone</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="email"
                                            placeholder="colleague@example.com"
                                            value={inviteForm.data.email}
                                            onChange={(e) => inviteForm.setData('email', e.target.value)}
                                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                        />
                                        <select
                                            value={inviteForm.data.role}
                                            onChange={(e) => inviteForm.setData('role', e.target.value)}
                                            className="rounded-xl border border-slate-200 px-2 py-2 text-xs capitalize focus:outline-none"
                                        >
                                            <option value="member">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={inviteForm.processing}
                                            className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                        >
                                            {inviteForm.processing ? 'Inviting...' : 'Invite'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="divide-y divide-slate-100 py-1">
                                {staff.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 sm:text-sm">{member.name}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                                                {member.role}
                                            </span>
                                            {membership.is_admin && member.user_id !== user.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStaff(member.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOCUSED MODAL: ARRIVAL PREFERENCES */}
                {activeModal === 'preferences' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 text-sm shadow-xl sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Arrival Preferences</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-1 text-xs sm:text-sm">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={policyForm.data.arrival_confirmation_required}
                                        onChange={(e) => policyForm.setData('arrival_confirmation_required', e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-900">Confirm visitor arrivals</span>
                                        <p className="mt-0.5 text-xs text-slate-500">Ask team to confirm when visitors reach your reception desk.</p>
                                    </div>
                                </label>

                                {policyForm.data.arrival_confirmation_required && (
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                How long should we wait?
                                            </label>
                                            <select
                                                value={policyForm.data.confirmation_window_minutes}
                                                onChange={(e) => policyForm.setData('confirmation_window_minutes', parseInt(e.target.value, 10))}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                            >
                                                <option value={10}>10 minutes</option>
                                                <option value={15}>15 minutes</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={45}>45 minutes</option>
                                                <option value={60}>1 hour</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                                If unconfirmed
                                            </label>
                                            <select
                                                value={policyForm.data.confirmation_escalation}
                                                onChange={(e) => policyForm.setData('confirmation_escalation', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                            >
                                                <option value="alert_only">Highlight on dashboard only</option>
                                                <option value="flag_security">Flag for security gate</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModal(null)}
                                        className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={policyForm.processing}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                    >
                                        {policyForm.processing ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* FOCUSED MODAL: HELP & SUPPORT */}
                {activeModal === 'help' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 text-sm shadow-xl sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Help & Support</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 sm:text-sm">
                                For security escalation, gate passes, or estate inquiries, you can reach out directly to the estate management office
                                or Kontrol support.
                            </p>

                            <div className="space-y-2 py-2 text-xs">
                                <a
                                    href="mailto:support@kontrol.app"
                                    className="block rounded-2xl bg-slate-50 p-3 font-bold text-slate-900 transition-colors hover:bg-slate-100"
                                >
                                    Email Kontrol Support (support@kontrol.app)
                                </a>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
