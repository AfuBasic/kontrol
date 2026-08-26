import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Clock,
    DollarSign,
    ExternalLink,
    FileText,
    History,
    Home,
    Mail,
    Phone,
    Shield,
    User,
    UserCheck,
    UserMinus,
    Users,
    Pencil,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';

type ResidentProp = {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
    property_id: number | null;
    property_name: string | null;
    is_active: boolean;
    email_verified_at: string | null;
    is_verified: boolean;
    has_password: boolean;
    can_resend_invitation: boolean;
    role_label: string;
};

type ProvenanceProp = {
    created_via: string;
    avenue: string;
    initiated_by_name: string | null;
    initiated_at: string;
    last_invited_by_name: string | null;
    last_invited_at: string | null;
    accepted_at: string | null;
    import_batch: string | null;
    invite_link_url: string | null;
    invitation: {
        id: number;
        token: string;
        created_at: string;
        accepted_at: string | null;
    } | null;
};

type ResidenceProp = {
    property_owner_name: string | null;
    property_owner_id: number | null;
    zone_name: string;
    residents_count: number;
};

type PaymentItem = {
    id: number;
    name: string;
    amount: number;
    status: string;
    date: string;
};

type PropertyOwnerFinancialItem = {
    id: number;
    name: string;
    amount_due: number;
    amount_paid: number;
    outstanding: number;
    status: string;
};

type FinancialsProp = {
    total_paid: number;
    total_outstanding: number;
    recent_payments: PaymentItem[];
    property_owner_financials: PropertyOwnerFinancialItem[];
};

type ActivityProp = {
    id: number;
    description: string;
    causer_name: string;
    created_at: string;
};

type HouseholdMemberProp = {
    id: number;
    name: string;
    type: string;
    is_primary: boolean;
};

type Props = {
    resident: ResidentProp;
    provenance: ProvenanceProp;
    residence: ResidenceProp;
    financials: FinancialsProp;
    activities: ActivityProp[];
    household: HouseholdMemberProp[];
};

export default function Show({ resident, provenance, residence, financials, activities, household }: Props) {
    const { confirm } = useAdminConfirmation();
    const [isResending, setIsResending] = useState(false);

    const handleToggleSuspend = () => {
        const isInactive = !resident.is_active;
        confirm({
            title: isInactive ? 'Activate account' : 'Suspend account',
            message: isInactive
                ? `Are you sure you want to activate ${resident.name}'s account? They will regain access.`
                : `Are you sure you want to suspend ${resident.name}'s account? They will no longer be able to log in.`,
            confirmLabel: isInactive ? 'Activate account' : 'Suspend account',
            type: isInactive ? 'info' : 'warning',
            onConfirm: () => router.patch(`/admin/residents/${resident.id}/suspend`, {}, { preserveScroll: true }),
        });
    };

    const handleResendInvitation = () => {
        confirm({
            title: 'Resend Invitation',
            message: `Send a new invitation email to ${resident.email}?`,
            confirmLabel: 'Resend Invitation',
            type: 'info',
            onConfirm: () => {
                setIsResending(true);
                router.post(
                    `/admin/residents/${resident.id}/resend-invitation`,
                    {},
                    {
                        preserveScroll: true,
                        onFinish: () => setIsResending(false),
                    },
                );
            },
        });
    };

    // Style helper for badges
    const getAvenueColor = (via: string) => {
        switch (via) {
            case 'single_form':
                return 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-300';
            case 'bulk_upload':
                return 'bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/40 dark:text-purple-300';
            case 'email_paste':
                return 'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/40 dark:text-indigo-300';
            case 'invite_link':
                return 'bg-pink-50 text-pink-700 ring-pink-600/10 dark:bg-pink-950/40 dark:text-pink-300';
            case 'property_owner_invite':
                return 'bg-teal-50 text-teal-700 ring-teal-600/10 dark:bg-teal-950/40 dark:text-teal-300';
            default:
                return 'bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <>
            <Head title={`Resident Profile: ${resident.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
                {/* Top Navigation & Action Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/admin/residents"
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Resident Directory</span>
                    </Link>

                    {/* Action buttons (full-width stacked on mobile, grouped on tablet+) */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/admin/residents/${resident.id}/edit`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 sm:flex-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                            <span>Edit Profile</span>
                        </Link>

                        {resident.can_resend_invitation && (
                            <button
                                onClick={handleResendInvitation}
                                disabled={isResending}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span>{isResending ? 'Resending...' : 'Resend Invite'}</span>
                            </button>
                        )}

                        <button
                            onClick={handleToggleSuspend}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition sm:flex-none ${
                                resident.is_active
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            {resident.is_active ? (
                                <>
                                    <UserMinus className="h-3.5 w-3.5" />
                                    <span>Suspend Account</span>
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-3.5 w-3.5" />
                                    <span>Activate Account</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Hero Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-md sm:p-7">
                    {/* Background Decorative Subtle Gradients */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5 sm:items-center sm:gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-500 to-indigo-600 text-xl font-black text-white shadow-md sm:h-16 sm:w-16 sm:text-2xl">
                                {resident.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-lg font-black tracking-tight sm:text-2xl">{resident.name}</h1>
                                    <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white uppercase ring-1 ring-white/15 backdrop-blur-xs">
                                        {resident.role_label}
                                    </span>
                                    {resident.is_active ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/35 uppercase">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/35 uppercase">
                                            Suspended
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                                    {resident.email && (
                                        <a href={`mailto:${resident.email}`} className="flex items-center gap-1.5 hover:text-white">
                                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{resident.email}</span>
                                        </a>
                                    )}
                                    {resident.phone && (
                                        <a href={`tel:${resident.phone}`} className="flex items-center gap-1.5 hover:text-white">
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span>{resident.phone}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Setup Status */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:min-w-[210px] sm:p-4">
                            <span className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Account Setup State</span>
                            <div className="mt-2 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-300">Email Verified:</span>
                                    {resident.is_verified ? (
                                        <span className="font-bold text-emerald-400">Yes</span>
                                    ) : (
                                        <span className="font-bold text-amber-400">Pending</span>
                                    )}
                                </div>
                                {resident.has_password && (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-300">Password Set:</span>
                                        <span className="font-bold text-emerald-400">Yes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                                {/* Dashboard Main Grid Layout */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                    {/* COLUMN 1: Provenance & Registration Provenance */}
                    <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Shield className="h-4 w-4" />
                            </div>
                            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Registration Provenance</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Avenue / Pathway */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Registration Avenue</span>
                                <div>
                                    <span
                                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black tracking-wide uppercase ring-1 ${getAvenueColor(provenance.created_via)}`}
                                    >
                                        {provenance.avenue}
                                    </span>
                                </div>
                            </div>

                            {/* Initiator */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Initiated By</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{provenance.initiated_by_name || 'System / Automated'}</span>
                                </div>
                            </div>

                            {/* Timestamps Chain */}
                            <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">Invited / Created:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{provenance.initiated_at}</span>
                                </div>

                                {provenance.last_invited_at && (
                                    <div className="space-y-1 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Resent By:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{provenance.last_invited_by_name || 'System'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Resent At:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{provenance.last_invited_at}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">Invitation Accepted:</span>
                                    {provenance.accepted_at ? (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{provenance.accepted_at}</span>
                                    ) : (
                                        <span className="font-bold text-amber-500">Pending</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">Account Activated:</span>
                                    {resident.email_verified_at ? (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{resident.email_verified_at}</span>
                                    ) : (
                                        <span className="font-bold text-amber-500">Unverified</span>
                                    )}
                                </div>
                            </div>

                            {/* Pathway Specific Metadata */}
                            {provenance.import_batch && (
                                <div className="space-y-1 rounded-2xl border border-purple-100 bg-purple-50/40 p-3 dark:border-purple-900/30 dark:bg-purple-950/20">
                                    <span className="block text-[9px] font-black tracking-widest text-purple-600 uppercase dark:text-purple-400">Import Batch</span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                                        <FileText className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                                        <span className="truncate">{provenance.import_batch}</span>
                                    </div>
                                </div>
                            )}

                            {provenance.invite_link_url && (
                                <div className="space-y-1 rounded-2xl border border-pink-100 bg-pink-50/40 p-3 dark:border-pink-900/30 dark:bg-pink-950/20">
                                    <span className="block text-[9px] font-black tracking-widest text-pink-600 uppercase dark:text-pink-400">Via Invite Link</span>
                                    <a
                                        href={provenance.invite_link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-pink-700 hover:underline dark:text-pink-300"
                                    >
                                        <span>View Registration URL</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}

                            {provenance.invitation && (
                                <div className="space-y-1.5 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 text-xs dark:border-blue-900/30 dark:bg-blue-950/20">
                                    <span className="block text-[9px] font-black tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                        Invitation Token Details
                                    </span>
                                    <div className="flex items-center justify-between gap-2 text-blue-900 dark:text-blue-200">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Token:</span>
                                        <code className="rounded-lg bg-white px-2 py-0.5 font-mono text-[10px] ring-1 ring-blue-600/10 dark:bg-slate-800 dark:ring-blue-400/20">
                                            {provenance.invitation.token.slice(0, 10)}...
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: Estate Context & Residence */}
                    <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <Home className="h-4 w-4" />
                            </div>
                            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Residence & Belongings</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Zone */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Zone / Sector</span>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{residence.zone_name}</div>
                            </div>

                            {/* Property Details */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Associated Unit / Address</span>
                                <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <Home className="h-4 w-4 text-slate-400" />
                                        <span>{resident.property_name || 'No property associated'}</span>
                                    </div>
                                    {(resident.unit_number || resident.address) && (
                                        <div className="space-y-0.5 pl-6 text-xs text-slate-500 dark:text-slate-400">
                                            {resident.unit_number && <div>Unit: {resident.unit_number}</div>}
                                            {resident.address && <div>Address: {resident.address}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Property Owner */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Associated Property Owner</span>
                                {residence.property_owner_name ? (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        {residence.property_owner_id ? (
                                            <Link href={`/admin/residents/${residence.property_owner_id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                                {residence.property_owner_name}
                                            </Link>
                                        ) : (
                                            <span>{residence.property_owner_name}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs font-semibold text-slate-400">None (Direct Property Owner or independent profile)</div>
                                )}
                            </div>

                            {/* Cohabitants / Occupancy */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Property Occupants Count</span>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{residence.residents_count} occupant(s) associated with same property</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: Collections & Financial Summary */}
                    <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Collections & Financials</h2>
                        </div>

                        {/* Payment Cards row */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                <span className="block text-[9px] font-black tracking-widest text-emerald-600 uppercase dark:text-emerald-400">Total Paid</span>
                                <span className="mt-1 block text-lg font-black text-slate-900 dark:text-slate-100">₦{financials.total_paid.toLocaleString()}</span>
                            </div>
                            <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-3 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
                                <span className="block text-[9px] font-black tracking-widest text-rose-600 uppercase dark:text-rose-400">Outstanding</span>
                                <span className="mt-1 block text-lg font-black text-slate-900 dark:text-slate-100">₦{financials.total_outstanding.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Recent Payments Section */}
                        <div className="space-y-2.5">
                            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Recent Payments</span>
                            {financials.recent_payments.length > 0 ? (
                                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {financials.recent_payments.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                                                <div className="text-[10px] text-slate-400">{p.date}</div>
                                            </div>
                                            <div className="shrink-0 font-black text-emerald-600 dark:text-emerald-400">+₦{p.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-400 dark:border-slate-800">
                                    No payments recorded.
                                </div>
                            )}
                        </div>

                        {/* Property Owner Financials Section (If tenant) */}
                        {residence.property_owner_name && financials.property_owner_financials.length > 0 && (
                            <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    Property Owner's Collections
                                </span>
                                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {financials.property_owner_financials.map((po) => (
                                        <div
                                            key={po.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-slate-800 dark:text-slate-200">{po.name}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Paid: ₦{po.amount_paid.toLocaleString()} / Due: ₦{po.amount_due.toLocaleString()}
                                                </div>
                                            </div>
                                            {po.outstanding > 0 ? (
                                                <div className="shrink-0 text-right font-black text-rose-500">
                                                    ₦{po.outstanding.toLocaleString()}
                                                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Owed</span>
                                                </div>
                                            ) : (
                                                <div className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">Paid</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2 Grid */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                    {/* Household Composition */}
                    <div className="space-y-5 self-start rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Users className="h-4 w-4" />
                            </div>
                            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Household Composition</h2>
                        </div>

                        {household.length > 0 ? (
                            <div className="space-y-2.5">
                                {household.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{member.name}</div>
                                                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{member.type}</div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/admin/residents/${member.id}`}
                                            className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-white px-3 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                                        >
                                            View
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No Household Members</div>
                                <div className="mt-0.5 max-w-[240px] text-[11px] text-slate-400">
                                    This resident has not added any additional household members.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Activity Log / Audit Trail Timeline */}
                    <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <History className="h-4 w-4" />
                            </div>
                            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-slate-100">Activity Log / Audit Trail</h2>
                        </div>

                        {activities.length > 0 ? (
                            <div className="relative ml-2 space-y-4 border-l-2 border-slate-100 py-1 pl-5 sm:ml-3 sm:pl-6 dark:border-slate-800">
                                {activities.map((act) => (
                                    <div key={act.id} className="relative">
                                        {/* Timeline Marker Dot */}
                                        <div className="absolute top-0.5 -left-7 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white sm:-left-8 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-900">
                                            <Calendar className="h-2.5 w-2.5" />
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.description}</div>
                                            <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-slate-400">
                                                <span>Initiated by: {act.causer_name}</span>
                                                <span>•</span>
                                                <span>{act.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs font-semibold text-slate-400">No log events captured.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
