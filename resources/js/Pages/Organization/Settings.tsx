import { Head, useForm, router } from '@inertiajs/react';
import {
    User,
    Shield,
    Clock,
    Users,
    Trash2,
    Plus,
    Building2,
    Check,
    HelpCircle,
    Phone,
    Mail,
    LifeBuoy,
} from 'lucide-react';
import React from 'react';
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
        policyForm.patch('/org/settings/confirmation-policy');
    };

    const handleInviteStaff = (e: React.FormEvent) => {
        e.preventDefault();
        inviteForm.post('/org/settings/staff', {
            onSuccess: () => inviteForm.reset(),
        });
    };

    const handleRemoveStaff = (id: number) => {
        if (confirm('Remove team member from Kontrol portal?')) {
            router.delete(`/org/settings/staff/${id}`);
        }
    };

    return (
        <OrganizationLayout title="Profile & Preferences">
            <Head title={`${organization.name} - Profile`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Profile & Team
                    </h1>
                    <p className="text-sm text-stone-500 mt-0.5">
                        Manage your team, arrival preferences, and organization details for {organization.name}.
                    </p>
                </div>

                {/* Organization Details Card */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                            {organization.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{organization.name}</h2>
                            <p className="text-xs text-stone-500 capitalize">
                                {organization.type} • {organization.estate_name || 'Estate Community'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                            <span className="text-stone-400 font-medium">Your Role</span>
                            <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">
                                {membership.role}
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                            <span className="text-stone-400 font-medium">Access Setup</span>
                            <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">
                                {organization.is_unrestricted ? 'Open Destination' : 'Managed Facility'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Arrival Preferences (Clean Plain Language) */}
                {!organization.is_unrestricted && membership.is_admin && (
                    <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Arrival Confirmations</h2>
                            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                                Keep track of visitors when they reach your reception desk or gate.
                            </p>
                        </div>

                        <form onSubmit={handleUpdatePolicy} className="space-y-4 text-xs sm:text-sm">
                            <label className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/60 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={policyForm.data.arrival_confirmation_required}
                                    onChange={(e) =>
                                        policyForm.setData('arrival_confirmation_required', e.target.checked)
                                    }
                                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
                                />
                                <div>
                                    <span className="font-bold text-slate-900">Confirm visitor arrivals</span>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        When security admits someone coming to {organization.name}, we'll ask your team to confirm when they reach you.
                                    </p>
                                </div>
                            </label>

                            {policyForm.data.arrival_confirmation_required && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-slate-700 font-medium mb-1">
                                            How long should we wait?
                                        </label>
                                        <select
                                            value={policyForm.data.confirmation_window_minutes}
                                            onChange={(e) =>
                                                policyForm.setData('confirmation_window_minutes', parseInt(e.target.value, 10))
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value={10}>10 minutes</option>
                                            <option value={15}>15 minutes (Recommended)</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={45}>45 minutes</option>
                                            <option value={60}>1 hour</option>
                                        </select>
                                        <p className="text-xs text-stone-500 mt-1">
                                            If not confirmed within this time, the arrival will be highlighted as needing attention.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-slate-700 font-medium mb-1">
                                            If an arrival isn't confirmed
                                        </label>
                                        <select
                                            value={policyForm.data.confirmation_escalation}
                                            onChange={(e) =>
                                                policyForm.setData('confirmation_escalation', e.target.value)
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="alert_only">Highlight on our dashboard only</option>
                                            <option value="flag_security">Notify estate gate security</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={policyForm.processing}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 shadow-xs"
                                >
                                    {policyForm.processing ? 'Saving...' : 'Save preferences'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Team Access Management */}
                {membership.is_admin && (
                    <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Team Members</h2>
                            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                                Invite administrators and team members who can manage access for {organization.name}.
                            </p>
                        </div>

                        {/* Invite Form */}
                        <form onSubmit={handleInviteStaff} className="flex flex-col sm:flex-row gap-2.5 text-xs sm:text-sm pt-2">
                            <input
                                type="email"
                                required
                                placeholder="Colleague's email address"
                                value={inviteForm.data.email}
                                onChange={(e) => inviteForm.setData('email', e.target.value)}
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            <select
                                value={inviteForm.data.role}
                                onChange={(e) => inviteForm.setData('role', e.target.value)}
                                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="member">Staff Member</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <button
                                type="submit"
                                disabled={inviteForm.processing}
                                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors shrink-0 shadow-xs"
                            >
                                {inviteForm.processing ? 'Inviting...' : 'Invite team member'}
                            </button>
                        </form>
                        {inviteForm.errors.email && (
                            <p className="text-xs text-rose-600">{inviteForm.errors.email}</p>
                        )}

                        {/* Team List */}
                        <div className="divide-y divide-stone-100 pt-2">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="py-3 flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-bold text-xs sm:text-sm text-slate-900">{member.name}</p>
                                        <p className="text-xs text-stone-500">{member.email}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] capitalize font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                                            {member.role}
                                        </span>
                                        {member.id !== membership.role && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStaff(member.id)}
                                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Remove member"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Help & Support */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                        <LifeBuoy className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-bold text-slate-900">Help & Support</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500">
                        Need assistance with estate gate admission, security passes, or facility queries?
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                        <a
                            href="mailto:support@kontrol.app"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5 text-stone-500" />
                            <span>Contact Estate Office</span>
                        </a>
                    </div>
                </div>
            </div>
        </OrganizationLayout>
    );
}
