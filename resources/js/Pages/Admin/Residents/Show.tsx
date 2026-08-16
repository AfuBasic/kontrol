import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    FileText,
    History,
    Home,
    Mail,
    Phone,
    Shield,
    ShieldAlert,
    User,
    UserCheck,
    UserMinus,
    Users,
    Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

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
    const [isSuspending, setIsSuspending] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleToggleSuspend = () => {
        setIsSuspending(true);
        router.patch(
            `/admin/residents/${resident.id}/suspend`,
            {},
            {
                onFinish: () => setIsSuspending(false),
            },
        );
    };

    const handleResendInvitation = () => {
        setIsResending(true);
        router.post(
            `/admin/residents/${resident.id}/resend-invitation`,
            {},
            {
                onFinish: () => setIsResending(false),
            },
        );
    };

    // Style helper for badges
    const getAvenueColor = (via: string) => {
        switch (via) {
            case 'single_form':
                return 'bg-blue-50 text-blue-700 ring-blue-600/10';
            case 'bulk_upload':
                return 'bg-purple-50 text-purple-700 ring-purple-600/10';
            case 'email_paste':
                return 'bg-indigo-50 text-indigo-700 ring-indigo-600/10';
            case 'invite_link':
                return 'bg-pink-50 text-pink-700 ring-pink-600/10';
            case 'property_owner_invite':
                return 'bg-teal-50 text-teal-700 ring-teal-600/10';
            default:
                return 'bg-slate-50 text-slate-700 ring-slate-600/10';
        }
    };

    return (
        <>
            <Head title={`Resident Profile: ${resident.name}`} />

            <div className="animate-fade-in mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Navigation Row */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/residents"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Resident Directory
                    </Link>

                    <div className="flex items-center gap-3">
                        {resident.can_resend_invitation && (
                            <button
                                onClick={handleResendInvitation}
                                disabled={isResending}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                <Clock className="h-4 w-4 text-slate-500" />
                                {isResending ? 'Resending...' : 'Resend Invitation'}
                            </button>
                        )}
                        <button
                            onClick={handleToggleSuspend}
                            disabled={isSuspending}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
                                resident.is_active ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            {resident.is_active ? (
                                <>
                                    <UserMinus className="h-4 w-4" />
                                    {isSuspending ? 'Suspending...' : 'Suspend Account'}
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    {isSuspending ? 'Activating...' : 'Activate Account'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Hero Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md sm:p-8">
                    {/* Background Decorative Gradient Radial */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-500 to-indigo-600 text-2xl font-black text-white shadow-lg">
                                {resident.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-black tracking-tight sm:text-2xl">{resident.name}</h1>
                                    <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold text-white uppercase ring-1 ring-white/15 backdrop-blur-xs">
                                        {resident.role_label}
                                    </span>
                                    {resident.is_active ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/35">
                                            Suspended
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {resident.email}
                                    </span>
                                    {resident.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            {resident.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Setup Status */}
                        <div className="min-w-[200px] space-y-3 rounded-2xl bg-white/5 p-4.5 ring-1 ring-white/10 backdrop-blur-xs">
                            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Account Setup State</span>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">Email Verified:</span>
                                    {resident.is_verified ? (
                                        <span className="font-bold text-emerald-400">Yes</span>
                                    ) : (
                                        <span className="font-bold text-amber-400">Pending</span>
                                    )}
                                </div>
                                {resident.has_password && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300">Password Set:</span>
                                        <span className="font-bold text-emerald-400">Yes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Main Grid Layout */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* COLUMN 1: Provenance & Registration Provenance (THE CORE OBJECTIVE) */}
                    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Shield className="h-5 w-5 text-indigo-600" />
                            <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">Registration Provenance</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Avenue / Pathway */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Registration Avenue</span>
                                <div>
                                    <span
                                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-black tracking-wide uppercase ring-1 ${getAvenueColor(provenance.created_via)}`}
                                    >
                                        {provenance.avenue}
                                    </span>
                                </div>
                            </div>

                            {/* Initiator */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Initiated By</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{provenance.initiated_by_name || 'System / Automated'}</span>
                                </div>
                            </div>

                            {/* Timestamps Chain */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-400">Invited / Created:</span>
                                    <span className="font-semibold text-slate-700">{provenance.initiated_at}</span>
                                </div>

                                {provenance.last_invited_at && (
                                    <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Resent By:</span>
                                            <span className="font-semibold text-slate-700">{provenance.last_invited_by_name || 'System'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Resent At:</span>
                                            <span className="font-semibold text-slate-700">{provenance.last_invited_at}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-400">Invitation Accepted:</span>
                                    {provenance.accepted_at ? (
                                        <span className="font-semibold text-emerald-600">{provenance.accepted_at}</span>
                                    ) : (
                                        <span className="font-semibold text-amber-500">Pending</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-400">Account Activated:</span>
                                    {resident.email_verified_at ? (
                                        <span className="font-semibold text-emerald-600">{resident.email_verified_at}</span>
                                    ) : (
                                        <span className="font-semibold text-amber-500">Unverified</span>
                                    )}
                                </div>
                            </div>

                            {/* Pathway Specific Metadata */}
                            {provenance.import_batch && (
                                <div className="space-y-1 rounded-2xl border border-purple-100 bg-purple-50/20 p-3">
                                    <span className="block text-[9px] font-black tracking-widest text-purple-400 uppercase">Import Batch</span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{provenance.import_batch}</span>
                                    </div>
                                </div>
                            )}

                            {provenance.invite_link_url && (
                                <div className="space-y-1 rounded-2xl border border-pink-100 bg-pink-50/20 p-3">
                                    <span className="block text-[9px] font-black tracking-widest text-pink-400 uppercase">Via Invite Link</span>
                                    <a
                                        href={provenance.invite_link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-850 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                    >
                                        View Registration URL
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}

                            {provenance.invitation && (
                                <div className="space-y-1 rounded-2xl border border-blue-100 bg-blue-50/20 p-3 text-xs">
                                    <span className="block text-[9px] font-black tracking-widest text-blue-400 uppercase">
                                        Invitation Token details
                                    </span>
                                    <div className="flex items-center justify-between text-blue-900">
                                        <span className="font-bold">Token:</span>
                                        <code className="rounded bg-white/70 px-1 font-mono text-[10px] ring-1 ring-blue-600/5">
                                            {provenance.invitation.token.slice(0, 10)}...
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: Estate Context & Residence */}
                    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Home className="h-5 w-5 text-blue-600" />
                            <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">Residence & Belongings</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Zone */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Zone / Sector</span>
                                <div className="text-xs font-bold text-slate-800">{residence.zone_name}</div>
                            </div>

                            {/* Property Details */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Associated Unit / Address</span>
                                <div className="space-y-1.5 rounded-2xl border border-slate-50 bg-slate-50/30 p-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                        <Home className="h-4 w-4 text-slate-400" />
                                        <span>{resident.property_name || 'No property associated'}</span>
                                    </div>
                                    {(resident.unit_number || resident.address) && (
                                        <div className="space-y-0.5 pl-6 text-xs text-slate-500">
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
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        {residence.property_owner_id ? (
                                            <Link href={`/admin/residents/${residence.property_owner_id}`} className="text-blue-600 hover:underline">
                                                {residence.property_owner_name}
                                            </Link>
                                        ) : (
                                            <span>{residence.property_owner_name}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-slate-400">None (Direct Property Owner or independent profile)</div>
                                )}
                            </div>

                            {/* Cohabitants / Occupancy */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Property Occupants count</span>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{residence.residents_count} occupant(s) associated with same property</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: Collections & Financial Summary */}
                    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">Collections & Financials</h2>
                        </div>

                        {/* Payment Cards row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-3 text-center">
                                <span className="block text-[9px] font-black tracking-widest text-emerald-500 uppercase">Total Paid</span>
                                <span className="mt-1 block text-lg font-black text-slate-900">₦{financials.total_paid.toLocaleString()}</span>
                            </div>
                            <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-3 text-center">
                                <span className="block text-[9px] font-black tracking-widest text-rose-500 uppercase">Outstanding</span>
                                <span className="mt-1 block text-lg font-black text-slate-900">₦{financials.total_outstanding.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Recent Payments Section */}
                        <div className="space-y-3">
                            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Recent Payments</span>
                            {financials.recent_payments.length > 0 ? (
                                <div className="max-h-36 space-y-2 overflow-y-auto">
                                    {financials.recent_payments.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/20 p-2.5 text-xs"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-slate-800">{p.name}</div>
                                                <div className="text-[9px] text-slate-400">{p.date}</div>
                                            </div>
                                            <div className="shrink-0 font-bold text-emerald-600">+₦{p.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-2 text-center text-xs font-semibold text-slate-400">No payments recorded.</div>
                            )}
                        </div>

                        {/* Property Owner Financials Section (If tenant) */}
                        {residence.property_owner_name && financials.property_owner_financials.length > 0 && (
                            <div className="space-y-3 border-t border-slate-50 pt-2">
                                <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    Property Owner's Collections
                                </span>
                                <div className="max-h-36 space-y-2 overflow-y-auto">
                                    {financials.property_owner_financials.map((po) => (
                                        <div
                                            key={po.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/20 p-2.5 text-xs"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-slate-800">{po.name}</div>
                                                <div className="text-[9px] text-slate-400">
                                                    Paid: ₦{po.amount_paid.toLocaleString()} / Due: ₦{po.amount_due.toLocaleString()}
                                                </div>
                                            </div>
                                            {po.outstanding > 0 ? (
                                                <div className="shrink-0 text-right font-bold text-rose-500">
                                                    ₦{po.outstanding.toLocaleString()}
                                                    <span className="block text-[8px] text-slate-400 uppercase">Owed</span>
                                                </div>
                                            ) : (
                                                <div className="shrink-0 font-bold text-emerald-600">Paid</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2 Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Household Composition */}
                    <div className="space-y-6 self-start rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">Household Composition</h2>
                        </div>

                        {household.length > 0 ? (
                            <div className="space-y-3">
                                {household.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-600">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{member.name}</div>
                                                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{member.type}</div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/admin/residents/${member.id}`}
                                            className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="mb-3 rounded-full bg-slate-50 p-3">
                                    <User className="h-6 w-6 text-slate-400" />
                                </div>
                                <div className="text-sm font-bold text-slate-700">No Household Members</div>
                                <div className="mt-1 max-w-[250px] text-xs text-slate-500">
                                    This resident has not added any additional household members to their account.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUMN 4: Activity Log / Audit Trail Timeline */}
                    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <History className="h-5 w-5 text-slate-600" />
                            <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">Activity Log / Audit Trail</h2>
                        </div>

                        {activities.length > 0 ? (
                            <div className="relative ml-3 space-y-6 border-l-2 border-slate-100 py-2 pl-6">
                                {activities.map((act) => (
                                    <div key={act.id} className="relative">
                                        {/* Timeline Marker Dot */}
                                        <div className="absolute top-1 -left-9 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white">
                                            <Calendar className="h-3 w-3" />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-slate-800">{act.description}</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
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
