import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import {
    ChevronRight,
    Users,
    Clock,
    Building2,
    HelpCircle,
    Shield,
    Trash2,
    X,
    LogOut,
} from 'lucide-react';
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

            <div className="space-y-8 max-w-xl">
                {/* 1. Profile Header (Resident-style avatar & identity) */}
                <div className="flex items-center gap-4 py-2">
                    <div className="h-16 w-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                            {user.name || 'Account'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-400 truncate">
                            {user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-500">
                            <span>{organization.name}</span>
                            <span>·</span>
                            <span className="capitalize">{membership.role || 'Member'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. ACCOUNT SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Account
                    </h2>
                    <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80 divide-y divide-slate-50">
                        <Link
                            href="/resident/profile"
                            className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group"
                        >
                            <span className="text-sm font-bold text-slate-900">Personal information</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link
                            href="/resident/activity?tab=notifications"
                            className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group"
                        >
                            <span className="text-sm font-bold text-slate-900">Notifications</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                    </div>
                </section>

                {/* 3. ORGANIZATION SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        {organization.name}
                    </h2>
                    <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80 divide-y divide-slate-50">
                        <button
                            type="button"
                            onClick={() => setActiveModal('details')}
                            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group text-left"
                        >
                            <span className="text-sm font-bold text-slate-900">Organization details</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('team')}
                            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group text-left"
                        >
                            <span className="text-sm font-bold text-slate-900">Team</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        {!organization.is_unrestricted && membership.is_admin && (
                            <button
                                type="button"
                                onClick={() => setActiveModal('preferences')}
                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group text-left"
                            >
                                <span className="text-sm font-bold text-slate-900">Arrival preferences</span>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                            </button>
                        )}
                    </div>
                </section>

                {/* 4. KONTROL SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Kontrol
                    </h2>
                    <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80 divide-y divide-slate-50">
                        <button
                            type="button"
                            onClick={() => setActiveModal('help')}
                            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group text-left"
                        >
                            <span className="text-sm font-bold text-slate-900">Help & Support</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>

                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-rose-50/50 transition-colors text-left"
                        >
                            <span className="text-sm font-bold text-rose-600">Sign out</span>
                            <LogOut className="h-4 w-4 text-rose-400" />
                        </Link>
                    </div>
                </section>

                {/* FOCUSED MODAL: ORGANIZATION DETAILS */}
                {activeModal === 'details' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Organization Details</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 py-2 text-xs sm:text-sm">
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-bold">Name</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{organization.name}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-bold">Estate</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{organization.estate_name || 'Estate'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-bold">Category</span>
                                    <p className="font-bold text-slate-900 capitalize mt-0.5">{organization.type}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-bold">Policy Setup</span>
                                    <p className="font-bold text-slate-900 mt-0.5">
                                        {organization.is_unrestricted ? 'Unrestricted destination (Open entry)' : 'Managed facility'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOCUSED MODAL: TEAM */}
                {activeModal === 'team' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl text-sm max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {membership.is_admin && (
                                <form onSubmit={handleInviteStaff} className="space-y-2 pt-1 pb-3 border-b border-slate-100">
                                    <span className="text-xs font-bold text-slate-700">Invite someone</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            required
                                            placeholder="colleague@example.com"
                                            value={inviteForm.data.email}
                                            onChange={(e) => inviteForm.setData('email', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                        />
                                        <select
                                            value={inviteForm.data.role}
                                            onChange={(e) => inviteForm.setData('role', e.target.value)}
                                            className="px-2 py-2 rounded-xl border border-slate-200 text-xs capitalize focus:outline-none"
                                        >
                                            <option value="member">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={inviteForm.processing}
                                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50"
                                        >
                                            {inviteForm.processing ? 'Inviting...' : 'Invite'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="divide-y divide-slate-100 py-1">
                                {staff.map((member) => (
                                    <div key={member.id} className="py-2.5 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{member.name}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                {member.role}
                                            </span>
                                            {membership.is_admin && member.user_id !== user.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStaff(member.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOCUSED MODAL: ARRIVAL PREFERENCES */}
                {activeModal === 'preferences' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Arrival Preferences</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-1 text-xs sm:text-sm">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={policyForm.data.arrival_confirmation_required}
                                        onChange={(e) =>
                                            policyForm.setData('arrival_confirmation_required', e.target.checked)
                                        }
                                        className="mt-1 w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-900">Confirm visitor arrivals</span>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Ask team to confirm when visitors reach your reception desk.
                                        </p>
                                    </div>
                                </label>

                                {policyForm.data.arrival_confirmation_required && (
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">
                                                How long should we wait?
                                            </label>
                                            <select
                                                value={policyForm.data.confirmation_window_minutes}
                                                onChange={(e) =>
                                                    policyForm.setData('confirmation_window_minutes', parseInt(e.target.value, 10))
                                                }
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                                            >
                                                <option value={10}>10 minutes</option>
                                                <option value={15}>15 minutes</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={45}>45 minutes</option>
                                                <option value={60}>1 hour</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-slate-700 font-bold mb-1 text-xs uppercase tracking-wider">
                                                If unconfirmed
                                            </label>
                                            <select
                                                value={policyForm.data.confirmation_escalation}
                                                onChange={(e) =>
                                                    policyForm.setData('confirmation_escalation', e.target.value)
                                                }
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                                            >
                                                <option value="alert_only">Highlight on dashboard only</option>
                                                <option value="flag_security">Flag for security gate</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModal(null)}
                                        className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={policyForm.processing}
                                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Help & Support</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-slate-600 text-xs sm:text-sm">
                                For security escalation, gate passes, or estate inquiries, you can reach out directly to the estate management office or Kontrol support.
                            </p>

                            <div className="py-2 space-y-2 text-xs">
                                <a
                                    href="mailto:support@kontrol.app"
                                    className="block p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-900 transition-colors"
                                >
                                    Email Kontrol Support (support@kontrol.app)
                                </a>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
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
