import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ChevronRight, CreditCard, Crown, LogOut, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import ConfirmationSheet from '@/Components/ConfirmationSheet';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';

import { useExternalBilling } from '@/Hooks/useExternalBilling';

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
        is_unrestricted: boolean;
        estate_name?: string;
        walk_in: { open: boolean; label: string };
        needs_walk_in_hours?: boolean;
        walk_in_windows: { id: number; name: string; day_of_week: number; start_time: string; end_time: string }[];
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

    const [activeModal, setActiveModal] = useState<'details' | 'team' | 'help' | 'signout' | 'personal' | null>(null);

    const inviteForm = useForm({
        email: '',
        role: 'member',
    });

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

    const { openExternalBilling } = useExternalBilling();
    const subscription = user.resident_subscription;

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



                {/* 1.5 SUBSCRIPTION CARD (Resident profile dark card style) */}
                {subscription && (subscription.current_period_end || subscription.trial_ends_at) && (
                    <button
                        type="button"
                        onClick={() => openExternalBilling()}
                        className="group relative w-full overflow-hidden rounded-3xl bg-[#0B101E] p-6 text-left shadow-xl ring-1 ring-white/5 transition-all duration-300 hover:shadow-2xl hover:ring-white/10 active:scale-[0.99]"
                    >
                        {/* Subtle Top Edge Highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Soft Deep Glow */}
                        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/10 blur-[60px]" />

                        <div className="relative z-10 flex flex-col gap-8">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <Crown className="h-4 w-4 text-indigo-400" strokeWidth={2.5} />
                                    <h2 className="text-[14px] font-medium tracking-wide">{subscription.plan_name || 'Organization Subscription'}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {subscription.status === 'active' || subscription.status === 'trial' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                                            <span className="text-[13px] font-medium text-emerald-400">
                                                {subscription.status === 'active' ? 'Active' : 'Trial'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"></span>
                                            <span className="text-[13px] font-medium text-rose-400">Expired</span>
                                        </div>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col gap-1">
                                {(() => {
                                    const targetDate = subscription.current_period_end || subscription.trial_ends_at;
                                    const formattedDate = targetDate
                                        ? new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                        : '';
                                    const diffTime = targetDate ? new Date(targetDate).getTime() - new Date().getTime() : 0;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    return (
                                        <>
                                            <h3 className="text-[28px] font-medium tracking-tight text-white">{formattedDate}</h3>
                                            <p className="text-[14px] font-medium text-slate-500">
                                                {diffDays > 0 ? `${diffDays} Days Remaining` : `${Math.abs(diffDays)} Days Ago`}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </button>
                )}

                {/* 2. ACCOUNT SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Account</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setActiveModal('personal')}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Personal information</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>
                        <Link
                            href="/org/notifications"
                            className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Notifications</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                    </div>
                </section>

                {/* 2.5 BALANCES & BILLING SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Balances & Billing</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <button
                            type="button"
                            onClick={() => openExternalBilling()}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                                <CreditCard className="h-4 w-4 shrink-0 text-slate-500" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-bold text-slate-900">Subscription & Billing</span>
                                    <p className="truncate text-xs text-slate-400">Manage plan, billing cycle & receipts</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                        </button>
                        <Link
                            href="/org/payments"
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                                <CreditCard className="h-4 w-4 shrink-0 text-slate-500" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-bold text-slate-900">Estate Payments & Dues</span>
                                    <p className="truncate text-xs text-slate-400">View balances, dues & payments</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                    </div>
                </section>

                {/* 3. ORGANIZATION SECTION */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">{organization.name}</h2>
                    <div className="divide-y divide-slate-50 overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200/80">
                        <Link
                            href="/org/public-windows"
                            className="group flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <div className="min-w-0">
                                <span className="block text-sm font-bold text-slate-900">Walk-in hours</span>
                                <span
                                    className={`mt-0.5 flex items-center gap-1.5 text-xs ${
                                        organization.needs_walk_in_hours
                                            ? 'font-semibold text-amber-700'
                                            : organization.walk_in.open
                                              ? 'text-emerald-700'
                                              : 'text-slate-500'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            organization.needs_walk_in_hours
                                                ? 'bg-amber-500'
                                                : organization.walk_in.open
                                                  ? 'bg-emerald-500'
                                                  : 'bg-slate-400'
                                        }`}
                                    />
                                    {organization.needs_walk_in_hours ? 'Not set · walk-ins are turned away' : organization.walk_in.label}
                                </span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setActiveModal('details')}
                            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-slate-900">Organization details</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>
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

                        <button
                            type="button"
                            onClick={() => setActiveModal('signout')}
                            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-rose-50/50 sm:p-5"
                        >
                            <span className="text-sm font-bold text-rose-600">Sign out</span>
                            <LogOut className="h-4 w-4 text-rose-400" />
                        </button>
                    </div>
                </section>

                {/* FOCUSED MODAL: ORGANIZATION DETAILS */}
                {/* FOCUSED MODAL: ORGANIZATION DETAILS */}
                <ResponsiveSheet isOpen={activeModal === 'details'} onClose={() => setActiveModal(null)}>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Organization Details</h3>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 text-xs sm:text-sm">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Name</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{organization.name}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Estate</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{organization.estate_name || 'Estate'}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Category</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{organization.type}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Walk-ins</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {organization.access_policy === 'unrestricted'
                                    ? 'Always admitted'
                                    : organization.access_policy === 'public_window'
                                      ? 'Admitted during walk-in hours'
                                      : 'Not admitted'}
                            </p>
                            {organization.access_policy === 'public_window' && (
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {organization.walk_in_windows.length === 0 ? (
                                        <li>No hours set, so walk-ins are turned away.</li>
                                    ) : (
                                        organization.walk_in_windows.map((w) => (
                                            <li key={w.id}>
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w.day_of_week]} · {w.start_time} – {w.end_time}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        >
                            Close
                        </button>
                    </div>
                </ResponsiveSheet>

                {/* FOCUSED MODAL: PERSONAL INFORMATION */}
                <ResponsiveSheet isOpen={activeModal === 'personal'} onClose={() => setActiveModal(null)}>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Personal Information</h3>
                            <p className="mt-1 text-sm text-slate-500">Your account details across Kontrol.</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 text-xs sm:text-sm">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Full Name</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{user.name}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Email Address</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{user.email}</p>
                        </div>
                        {user.phone && (
                            <div>
                                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Phone</span>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{user.phone}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Role</span>
                            <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{membership.role || 'Member'}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        >
                            Close
                        </button>
                    </div>
                </ResponsiveSheet>

                {/* FOCUSED MODAL: TEAM */}
                {/* FOCUSED MODAL: TEAM */}
                <ResponsiveSheet isOpen={activeModal === 'team'} onClose={() => setActiveModal(null)}>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Team Members</h3>
                        </div>
                    </div>

                    <div className="pt-4">
                        {membership.is_admin && (
                            <form
                                noValidate
                                onSubmit={handleInviteStaff}
                                className="mb-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                                <span className="block text-xs font-semibold text-slate-900">Invite someone</span>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="email"
                                        placeholder="colleague@example.com"
                                        value={inviteForm.data.email}
                                        onChange={(e) => inviteForm.setData('email', e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                    />
                                    <select
                                        value={inviteForm.data.role}
                                        onChange={(e) => inviteForm.setData('role', e.target.value)}
                                        className="rounded-xl border border-slate-200 px-2 py-2 text-sm capitalize focus:outline-none"
                                    >
                                        <option value="member">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={inviteForm.processing}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {inviteForm.processing ? 'Inviting...' : 'Invite Member'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="divide-y divide-slate-100">
                            {staff.map((member) => (
                                <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 capitalize">
                                            {member.role}
                                        </span>
                                        {membership.is_admin && member.user_id !== user.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStaff(member.id)}
                                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                title="Remove"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        >
                            Done
                        </button>
                    </div>
                </ResponsiveSheet>

                {/* FOCUSED MODAL: HELP & SUPPORT */}
                <ResponsiveSheet isOpen={activeModal === 'help'} onClose={() => setActiveModal(null)}>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Help & Support</h3>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <p className="text-sm leading-relaxed text-slate-600">
                            For security escalation, gate passes, or estate inquiries, you can reach out directly to the estate management office or
                            Kontrol support.
                        </p>

                        <div className="pt-2">
                            <a
                                href="mailto:support@kontrol.app"
                                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                            >
                                Email Kontrol Support
                            </a>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        >
                            Close
                        </button>
                    </div>
                </ResponsiveSheet>

                {/* SIGN OUT CONFIRMATION MODAL */}
                <ConfirmationSheet
                    isOpen={activeModal === 'signout'}
                    onClose={() => setActiveModal(null)}
                    onConfirm={() => router.post('/logout')}
                    title="Sign Out"
                    message="Are you sure you want to sign out of your account? You will need to log in again to access Kontrol."
                    confirmLabel="Sign out"
                    type="danger"
                />
            </div>
        </OrganizationLayout>
    );
}
