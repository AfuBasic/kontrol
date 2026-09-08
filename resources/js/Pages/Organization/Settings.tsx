import { Head, useForm, router } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Shield,
    Clock,
    Users,
    AlertTriangle,
    Check,
    Trash2,
    Plus,
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
        if (confirm('Are you sure you want to remove this staff member?')) {
            router.delete(`/org/settings/staff/${id}`);
        }
    };

    return (
        <OrganizationLayout title="Settings & Policy">
            <Head title={`${organization.name} - Settings`} />

            <div className="space-y-8 max-w-4xl">
                {/* Header */}
                <div className="pb-4 border-b border-zinc-800/80">
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-indigo-400" />
                        Settings & Arrival Policy
                    </h1>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Configure arrival confirmation rules and organization staff permissions for {organization.name}.
                    </p>
                </div>

                {/* Policy Configuration Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-sm font-semibold text-white">Arrival Confirmation Policy</h2>
                    </div>

                    {organization.is_unrestricted ? (
                        <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
                            This organization operates under an <strong>Unrestricted</strong> destination policy (Hospital/Emergency).
                            Arrival confirmations are not required.
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePolicy} className="space-y-4 text-xs">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="arrival_confirmation_required"
                                    checked={policyForm.data.arrival_confirmation_required}
                                    onChange={(e) =>
                                        policyForm.setData('arrival_confirmation_required', e.target.checked)
                                    }
                                    className="mt-0.5 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <label
                                        htmlFor="arrival_confirmation_required"
                                        className="font-medium text-zinc-200 cursor-pointer"
                                    >
                                        Require Facility Arrival Confirmation
                                    </label>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                        When enabled, security admissions create a pending arrival record. Staff must confirm
                                        physical arrival at your building within the window below.
                                    </p>
                                </div>
                            </div>

                            {policyForm.data.arrival_confirmation_required && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-800/60">
                                    <div>
                                        <label className="block text-zinc-300 font-medium mb-1">
                                            Confirmation Window (Minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="120"
                                            value={policyForm.data.confirmation_window_minutes}
                                            onChange={(e) =>
                                                policyForm.setData(
                                                    'confirmation_window_minutes',
                                                    parseInt(e.target.value, 10) || 15
                                                )
                                            }
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">
                                            Arrivals unconfirmed after this duration will flag as OVERDUE.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-zinc-300 font-medium mb-1">
                                            Overdue Escalation Mode
                                        </label>
                                        <select
                                            value={policyForm.data.confirmation_escalation}
                                            onChange={(e) =>
                                                policyForm.setData('confirmation_escalation', e.target.value)
                                            }
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="alert_only">Alert Only (Internal dashboard alert)</option>
                                            <option value="flag_security">
                                                Flag Security (Highlight on security console queue)
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {membership.is_admin && (
                                <div className="flex justify-end pt-3">
                                    <button
                                        type="submit"
                                        disabled={policyForm.processing}
                                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {policyForm.processing ? 'Saving...' : 'Save Policy Changes'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Staff Members Management */}
                {membership.is_admin && (
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-5">
                        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <h2 className="text-sm font-semibold text-white">Organization Staff & Administrators</h2>
                        </div>

                        {/* Invite Staff Form */}
                        <form onSubmit={handleInviteStaff} className="flex flex-col sm:flex-row gap-3 text-xs">
                            <input
                                type="email"
                                required
                                placeholder="Staff member's registered email"
                                value={inviteForm.data.email}
                                onChange={(e) => inviteForm.setData('email', e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                            />
                            <select
                                value={inviteForm.data.role}
                                onChange={(e) => inviteForm.setData('role', e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="member">Staff Member</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <button
                                type="submit"
                                disabled={inviteForm.processing}
                                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold border border-zinc-700 transition-colors shrink-0"
                            >
                                Grant Access
                            </button>
                        </form>
                        {inviteForm.errors.email && (
                            <p className="text-xs text-rose-400">{inviteForm.errors.email}</p>
                        )}

                        {/* Staff Table */}
                        <div className="divide-y divide-zinc-800/60 border border-zinc-800/60 rounded-lg overflow-hidden text-xs">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-3.5 flex items-center justify-between hover:bg-zinc-800/20"
                                >
                                    <div>
                                        <div className="font-medium text-zinc-200">{member.name}</div>
                                        <div className="text-[11px] text-zinc-500">{member.email}</div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                            {member.role}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStaff(member.id)}
                                            className="text-rose-400 hover:text-rose-300 p-1"
                                            title="Revoke Staff Access"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
