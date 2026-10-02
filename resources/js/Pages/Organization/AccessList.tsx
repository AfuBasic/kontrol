import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    Ban,
    Calendar,
    Check,
    ChevronRight,
    Copy,
    EyeOff,
    Loader2,
    MapPin,
    Plus,
    Search,
    Share2,
    Shield,
    ShieldCheck,
    UserPlus,
    Users,
    Trash2,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { shareAccessCode } from '@/Utils/share';
import FilterChips from '@/Components/Organization/FilterChips';
import AccessTabs from '@/Components/Organization/AccessTabs';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import SubscriptionGateSheet from '@/Components/Organization/SubscriptionGateSheet';
import PassCard from '@/Components/Resident/PassCard';
import WalkInHoursSetupCard from '@/Components/Organization/WalkInHoursSetupCard';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import { useSubscriptionGate } from '@/Hooks/useSubscriptionGate';

interface Member {
    id: number;
    name: string;
    identifier: string | null;
    category: string;
    status: string;
    valid_from: string | null;
    valid_until: string | null;
    is_valid_now: boolean;
    active_credential: {
        id: number;
        code: string;
        expires_at: string | null;
        expires_at_human: string | null;
        status: string;
    } | null;
    created_at: string;
}

interface PaginatedMembers {
    data: Member[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface MetricProps {
    currently_inside: number;
    today_entries: number;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
        walk_in?: { open: boolean; label: string };
        needs_walk_in_hours?: boolean;
        estate_name?: string;
        visitor_checkout_enabled?: boolean;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    members: PaginatedMembers;
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
    total_access_members?: number;
    metrics?: MetricProps;
}

const initialsFor = (name: string) => {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
};

const getAvatarColor = (name: string) => {
    const colors = [
        'bg-[#eef4ff] text-[#1a5dbf]',
        'bg-[#fdf4ff] text-[#9b1faa]',
        'bg-[#f0fdf4] text-[#0d7a44]',
        'bg-[#fff1f2] text-[#b01d38]',
        'bg-[#fffbeb] text-[#9a6010]',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function AccessList({ organization, membership, members, filters, total_access_members = 0, metrics }: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const { gated, gateSheetOpen, closeGateSheet } = useSubscriptionGate();
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status] = useState(filters.status ?? 'all');

    type ConfirmActionType = 'suspend' | 'activate' | 'revoke' | 'delete' | null;
    const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);

    const {
        data: memberData,
        setData: setMemberData,
        post: postMember,
        processing: processingMember,
        errors: memberErrors,
        reset: resetMember,
    } = useForm({
        name: '',
        identifier: '',
        category: 'staff',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        issue_credential: true,
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'add_person') {
            gated(() => setAddPersonModalOpen(true))();
        }
    }, [gated]);

    const currentlyHere = metrics?.currently_inside ?? 0;
    const userFirstName = user.name ? user.name.split(' ')[0] : 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getMemberStatus = (member: Member) => {
        if (member.status === 'suspended') return { label: 'Suspended', color: 'rose' };
        if (member.is_valid_now) return { label: 'Active', color: 'emerald' };
        if (member.valid_until && new Date(member.valid_until) < new Date()) return { label: 'Expired', color: 'slate' };
        return { label: 'Pending', color: 'amber' };
    };

    const applyFilters = (next?: { search?: string; category?: string; status?: string }) => {
        const query = {
            search: next?.search ?? search,
            category: next?.category ?? category,
            status: next?.status ?? status,
        };
        router.get(
            '/org/access-list',
            {
                search: query.search || undefined,
                category: query.category !== 'all' ? query.category : undefined,
                status: query.status !== 'all' ? query.status : undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const handleCreateMember = (e: React.FormEvent) => {
        e.preventDefault();
        postMember('/org/access-list', {
            onSuccess: () => {
                setAddPersonModalOpen(false);
                resetMember();
            },
        });
    };

    const handleSuspend = (member: Member) => {
        router.post(`/org/access-list/${member.id}/suspend`, {}, { preserveScroll: true, onSuccess: () => setSelectedMember(null) });
    };

    const handleActivate = (member: Member) => {
        router.post(`/org/access-list/${member.id}/activate`, {}, { preserveScroll: true, onSuccess: () => setSelectedMember(null) });
    };

    const handleRevoke = (member: Member) => {
        if (!member.active_credential) return;
        router.post(`/org/credentials/${member.active_credential.id}/revoke`, {}, { preserveScroll: true, onSuccess: () => setSelectedMember(null) });
    };

    const handleDeleteMember = (member: Member) => {
        router.delete(`/org/access-list/${member.id}`, {
            preserveScroll: true,
            onSuccess: () => setSelectedMember(null),
        });
    };

    const handleIssue = (member: Member) => {
        router.post(`/org/credentials/issue/${member.id}`, {}, { preserveScroll: true, onSuccess: () => setSelectedMember(null) });
    };

    const handleShareMemberPass = async (member: Member) => {
        if (sharing || !member.active_credential) return;
        setSharing(true);
        try {
            const passData = {
                id: member.active_credential.id,
                code: member.active_credential.code,
                visitor_name: member.name,
                visitor_phone: null,
                purpose: member.category,
                status: member.status === 'suspended' ? 'revoked' : member.is_valid_now ? 'expected' : 'expired',
                type: 'long_lived',
                expires_at: member.active_credential.expires_at,
                starts_at: member.valid_from,
                estate_name: organization.name,
                host_name: 'Admin',
            };
            const result = await shareAccessCode(passData as any, cardRef.current);
            if (result?.method === 'copy' && result.success) {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
            }
        } catch (err) {
            console.error('Failed to share pass', err);
        } finally {
            setSharing(false);
        }
    };

    const copyCode = async (code: string, id: number) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                await Clipboard.write({ string: code });
            }
            setCopiedCodeId(id);
            setTimeout(() => setCopiedCodeId(null), 2000);
        } catch (err) {
            console.error('Failed to copy code', err);
        }
    };

    return (
        <OrganizationLayout title="Access" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - Access`} />

            {/* ATMOSPHERIC BACKGROUND */}
            <div className="app-atmosphere" />

            <div className="mx-auto flex max-w-[480px] flex-col gap-3.5 px-4 pt-1 pb-24">
                {/* ORGANIZATION IDENTITY */}
                <header className="flex flex-col pt-1">
                    <p className="text-[12px] font-medium text-slate-500">
                        {getGreeting()}, {userFirstName}
                    </p>
                    <div className="mt-0.5 flex items-center justify-between">
                        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#071f4b]">{organization.name}</h1>
                        {membership.is_admin && (
                            <button
                                type="button"
                                onClick={gated(() => setAddPersonModalOpen(true))}
                                className="flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3 py-1.5 text-[12px] font-semibold text-[#1a5dbf] shadow-[0_2px_8px_rgba(26,93,191,0.10)] transition active:scale-95"
                            >
                                <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Add person
                            </button>
                        )}
                    </div>
                    {organization.estate_name && (
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {organization.estate_name}
                            <ChevronRight className="ml-0.5 h-3 w-3 text-slate-400" />
                        </p>
                    )}
                </header>

                {organization.needs_walk_in_hours && <WalkInHoursSetupCard organizationName={organization.name} isAdmin={membership.is_admin} />}

                {/* ACCESS OVERVIEW CARD */}
                <Link href="/org/access-list" className="brand-card flex items-center justify-between p-4 transition-transform active:scale-[0.98]">
                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="brand-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]">
                            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.1} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-[13px] font-semibold text-white/90">Access Overview</h2>
                            <p className="text-[11px] text-blue-200/70">Total people with access</p>
                            <span className="mt-0.5 text-[32px] leading-none font-extrabold tracking-tight text-white">{total_access_members}</span>
                        </div>
                    </div>
                    <ChevronRight className="relative z-10 h-5 w-5 text-white/50" strokeWidth={2.5} />
                </Link>

                {/* PRIMARY ACCESS TABS */}
                <div className="soft-card overflow-hidden p-0">
                    <AccessTabs activeTab="people" activeCount={currentlyHere} showOnSiteTab={organization.visitor_checkout_enabled} />
                </div>

                {/* TODAY MODULE */}
                {metrics && (
                    <div className="soft-card flex flex-col p-3.5">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-[14px] font-bold text-[#071f4b]">Today</h2>
                            {organization.walk_in && (
                                <Link
                                    href="/org/public-windows"
                                    className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        organization.walk_in.open ? 'bg-emerald-50/70 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${organization.walk_in.open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    Walk-ins · {organization.walk_in.label}
                                </Link>
                            )}
                        </div>

                        <div className="flex items-stretch justify-between">
                            <Link
                                href="/org/on-site"
                                className="group flex flex-1 flex-col items-start rounded-xl px-1.5 py-1 transition hover:bg-slate-50/80"
                            >
                                <div className="icon-tile-mint mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg">
                                    <Users className="h-3.5 w-3.5" strokeWidth={2.2} />
                                </div>
                                <span className="mb-0.5 text-[20px] leading-none font-extrabold text-[#071f4b]">{currentlyHere}</span>
                                <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500">
                                    Inside <ChevronRight className="h-2.5 w-2.5 text-slate-300 transition group-hover:text-slate-400" />
                                </span>
                            </Link>

                            <div className="mx-0.5 w-px self-stretch bg-slate-100" />

                            <Link
                                href="/org/on-site/history"
                                className="group flex flex-1 flex-col items-start rounded-xl px-1.5 py-1 transition hover:bg-slate-50/80"
                            >
                                <div className="icon-tile-sky mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg">
                                    <Calendar className="h-3.5 w-3.5" strokeWidth={2.2} />
                                </div>
                                <span className="mb-0.5 text-[20px] leading-none font-extrabold text-[#071f4b]">{metrics.today_entries}</span>
                                <span className="flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap text-slate-500">
                                    Arrivals today <ChevronRight className="h-2.5 w-2.5 text-slate-300 transition group-hover:text-slate-400" />
                                </span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* PEOPLE DIRECTORY */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-0.5">
                        <h2 className="text-[14px] font-bold text-[#071f4b]">People</h2>
                        <span className="text-[11px] font-medium text-slate-400">{members.total} total</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Search people..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2 pr-4 pl-10 !text-xs text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>

                    {/* Category Filters */}
                    <FilterChips
                        variant="category"
                        value={category}
                        onChange={(id) => {
                            setCategory(id);
                            applyFilters({ category: id });
                        }}
                        options={[
                            { id: 'all', label: 'All', count: category === 'all' ? members.total : undefined },
                            { id: 'staff', label: 'Staff' },
                            { id: 'parent', label: 'Parents' },
                        ]}
                    />

                    {/* Directory List */}
                    {members.total === 0 && !search && category === 'all' ? (
                        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-xs">
                            <Shield className="mb-3 h-8 w-8 text-slate-200" />
                            <h3 className="text-[15px] font-bold text-slate-900">No people yet</h3>
                            <p className="mt-1 text-[13px] text-slate-500">Add staff, parents or anyone needing recurring access.</p>
                            {membership.is_admin && (
                                <button
                                    type="button"
                                    onClick={gated(() => setAddPersonModalOpen(true))}
                                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b4aa2] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0a408b] active:scale-[0.98]"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                                    Add person
                                </button>
                            )}
                        </div>
                    ) : members.data.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No matching people found</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {search ? `No members matched "${search}".` : 'No members found in this category.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                            {members.data.map((member, index) => {
                                const memberStatus = getMemberStatus(member);
                                const dateLabel = member.valid_until ? `Until ${member.valid_until}` : 'No end date';
                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => setSelectedMember(member)}
                                        className={`flex min-h-[64px] cursor-pointer items-center justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 ${index !== members.data.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        <div className="flex min-w-0 items-start gap-3.5">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-tight ${getAvatarColor(member.name)}`}
                                            >
                                                {initialsFor(member.name)}
                                            </div>
                                            <div className="min-w-0 flex-1 py-0.5">
                                                <div className="truncate text-[15px] leading-tight font-bold text-slate-900">{member.name}</div>
                                                <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                    <span className="capitalize">{member.category}</span>
                                                    {' · '}
                                                    <span className={memberStatus.label === 'Active' ? 'font-semibold text-emerald-600' : ''}>
                                                        {memberStatus.label}
                                                    </span>
                                                </p>
                                                <p className="mt-0.5 truncate text-[12px] text-slate-400">{dateLabel}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.5} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add Someone Sheet */}
                <ResponsiveSheet isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)}>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Add someone</h3>
                            <p className="mt-0.5 text-xs text-slate-500">Create access for {organization.name}.</p>
                        </div>
                    </div>

                    <form noValidate onSubmit={handleCreateMember} className="space-y-4 pt-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-800">Full name</label>
                            <input
                                type="text"
                                placeholder="e.g. Janet Adebayo"
                                value={memberData.name}
                                onChange={(event) => setMemberData('name', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                            />
                            {memberErrors.name && <p className="mt-1 text-xs text-rose-600">{memberErrors.name}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-800">Relationship</label>
                            <select
                                value={memberData.category}
                                onChange={(event) => setMemberData('category', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 capitalize focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                            >
                                <option value="staff">Staff</option>
                                <option value="parent">Parent</option>
                                <option value="student">Student</option>
                                <option value="member">Member</option>
                                <option value="contractor">Contractor</option>
                                <option value="visitor">Regular visitor</option>
                            </select>
                            {memberErrors.category && <p className="mt-1 text-xs text-rose-600">{memberErrors.category}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-800">ID number (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. STU-2026-042"
                                value={memberData.identifier}
                                onChange={(event) => setMemberData('identifier', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                            />
                            {memberErrors.identifier && <p className="mt-1 text-xs text-rose-600">{memberErrors.identifier}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-800">Valid from</label>
                                <input
                                    type="date"
                                    value={memberData.valid_from}
                                    onChange={(event) => setMemberData('valid_from', event.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                />
                                {memberErrors.valid_from && <p className="mt-1 text-xs text-rose-600">{memberErrors.valid_from}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-800">Valid until (optional)</label>
                                <input
                                    type="date"
                                    value={memberData.valid_until}
                                    onChange={(event) => setMemberData('valid_until', event.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                                />
                                {memberErrors.valid_until && <p className="mt-1 text-xs text-rose-600">{memberErrors.valid_until}</p>}
                            </div>
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                            <input
                                type="checkbox"
                                checked={memberData.issue_credential}
                                onChange={(event) => setMemberData('issue_credential', event.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span>
                                <span className="block text-xs font-semibold text-slate-900">Issue an access code now</span>
                                <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                                    The code can be copied from this directory after the person is added.
                                </span>
                            </span>
                        </label>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5">
                            <button
                                type="button"
                                onClick={() => setAddPersonModalOpen(false)}
                                className="rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processingMember}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                            >
                                {processingMember ? 'Adding...' : 'Add person'}
                            </button>
                        </div>
                    </form>
                </ResponsiveSheet>

                {/* Member Details Sheet */}
                <ResponsiveSheet isOpen={!!selectedMember} onClose={() => setSelectedMember(null)}>
                    {selectedMember && (
                        <>
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold tracking-tight ${getAvatarColor(selectedMember.name)}`}
                                    >
                                        {initialsFor(selectedMember.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-950">{selectedMember.name}</h3>
                                        <p className="mt-0.5 text-sm text-slate-500 capitalize">{selectedMember.category}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-6">
                                <div>
                                    <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Profile Details</h4>
                                    <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">Status</dt>
                                            <dd className="text-sm font-semibold text-slate-900">
                                                {selectedMember.status === 'suspended'
                                                    ? 'Suspended'
                                                    : selectedMember.is_valid_now
                                                      ? 'Active'
                                                      : 'Pending/Expired'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">ID Number</dt>
                                            <dd className="text-sm font-semibold text-slate-900">{selectedMember.identifier || '-'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">Valid Until</dt>
                                            <dd className="text-sm font-semibold text-slate-900">
                                                {selectedMember.valid_until ? new Date(selectedMember.valid_until).toLocaleDateString() : 'Forever'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Access Code</h4>
                                    {selectedMember.active_credential ? (
                                        <>
                                            <div ref={cardRef} className="mx-auto w-full max-w-sm">
                                                <PassCard
                                                    pass={
                                                        {
                                                            id: selectedMember.active_credential.id,
                                                            code: selectedMember.active_credential.code,
                                                            visitor_name: selectedMember.name,
                                                            visitor_phone: null,
                                                            purpose: selectedMember.category,
                                                            status:
                                                                selectedMember.status === 'suspended'
                                                                    ? 'revoked'
                                                                    : selectedMember.is_valid_now
                                                                      ? 'expected'
                                                                      : 'expired',
                                                            type: 'long_lived',
                                                            expires_at: selectedMember.active_credential.expires_at,
                                                            starts_at: selectedMember.valid_from,
                                                            estate_name: organization.name,
                                                            host_name: 'Admin',
                                                        } as any
                                                    }
                                                    qrUrl={selectedMember.active_credential.code}
                                                />
                                            </div>
                                            <div className="mt-4 flex w-full gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyCode(selectedMember.active_credential!.code, selectedMember.active_credential!.id)
                                                    }
                                                    className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xs transition-all active:scale-98 ${copiedCodeId === selectedMember.active_credential.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                                                >
                                                    {copiedCodeId === selectedMember.active_credential.id ? (
                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 text-slate-500" />
                                                    )}
                                                    <span>{copiedCodeId === selectedMember.active_credential.id ? 'Copied Code!' : 'Copy Code'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareMemberPass(selectedMember)}
                                                    disabled={sharing}
                                                    className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xs transition-all active:scale-98 disabled:opacity-75 ${shareCopied ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                                                >
                                                    {sharing ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                                    ) : shareCopied ? (
                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <Share2 className="h-4 w-4 text-slate-500" />
                                                    )}
                                                    <span>{shareCopied ? 'Shared / Copied!' : sharing ? 'Preparing...' : 'Share Pass'}</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                                            <Shield className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                                            <p className="text-sm font-medium text-slate-600">No active access code</p>
                                            <button
                                                onClick={() => handleIssue(selectedMember)}
                                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Issue new code
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {membership.is_admin && (
                                    <div className="pt-2">
                                        <h4 className="text-xs font-semibold tracking-wider text-rose-400 uppercase">Danger Zone</h4>
                                        <div className="mt-3 space-y-2">
                                            <button
                                                onClick={() => setConfirmAction(selectedMember.status === 'suspended' ? 'activate' : 'suspend')}
                                                className={`flex w-full items-center justify-between rounded-xl border p-4 transition-colors ${selectedMember.status === 'suspended' ? 'border-emerald-100 bg-emerald-50 hover:border-emerald-200' : 'border-orange-100 bg-orange-50 hover:border-orange-200'}`}
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    {selectedMember.status === 'suspended' ? (
                                                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <Ban className="h-5 w-5 text-orange-600" />
                                                    )}
                                                    <div>
                                                        <p
                                                            className={`text-sm font-semibold ${selectedMember.status === 'suspended' ? 'text-emerald-900' : 'text-orange-900'}`}
                                                        >
                                                            {selectedMember.status === 'suspended' ? 'Reactivate access' : 'Suspend access'}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${selectedMember.status === 'suspended' ? 'text-emerald-700' : 'text-orange-700'}`}
                                                        >
                                                            {selectedMember.status === 'suspended'
                                                                ? 'Restore access immediately'
                                                                : 'Temporarily disable all access'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>

                                            {selectedMember.active_credential && (
                                                <button
                                                    onClick={() => setConfirmAction('revoke')}
                                                    className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-4 transition-colors hover:border-rose-200"
                                                >
                                                    <div className="flex items-center gap-3 text-left">
                                                        <EyeOff className="h-5 w-5 text-rose-600" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-rose-900">Revoke code</p>
                                                            <p className="text-xs text-rose-700">Delete active access code</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setConfirmAction('delete')}
                                                className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 p-4 transition-colors hover:border-rose-300 hover:bg-rose-100/60"
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <Trash2 className="h-5 w-5 text-rose-600" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-rose-900">Delete person & access</p>
                                                        <p className="text-xs text-rose-700">Permanently delete pass and access</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </ResponsiveSheet>

                {/* Confirmation Sheet */}
                <ResponsiveSheet isOpen={!!confirmAction} onClose={() => setConfirmAction(null)}>
                    {confirmAction && selectedMember && (
                        <div className="flex flex-col gap-5 pt-2 pb-4">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${confirmAction === 'activate' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                                >
                                    {confirmAction === 'activate' ? (
                                        <BadgeCheck className="h-6 w-6" />
                                    ) : confirmAction === 'delete' ? (
                                        <Trash2 className="h-6 w-6" />
                                    ) : (
                                        <AlertTriangle className="h-6 w-6" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {confirmAction === 'suspend' && 'Suspend Access?'}
                                        {confirmAction === 'activate' && 'Reactivate Access?'}
                                        {confirmAction === 'revoke' && 'Revoke Code?'}
                                        {confirmAction === 'delete' && 'Delete Person & Access?'}
                                    </h3>
                                    <p className="mt-1.5 text-[15px] leading-snug text-slate-500">
                                        {confirmAction === 'suspend' &&
                                            `Are you sure you want to suspend access for ${selectedMember.name}? Their code will be temporarily disabled.`}
                                        {confirmAction === 'activate' &&
                                            `Are you sure you want to reactivate access for ${selectedMember.name}? Their previous code will be valid again.`}
                                        {confirmAction === 'revoke' &&
                                            'Are you sure you want to permanently revoke this code? You will need to issue a new code if they need access again.'}
                                        {confirmAction === 'delete' &&
                                            `Are you sure you want to permanently delete ${selectedMember.name}? This will remove their record and delete all associated access codes and passes permanently.`}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-100 text-[15px] font-bold text-slate-700 active:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmAction === 'suspend') handleSuspend(selectedMember);
                                        if (confirmAction === 'activate') handleActivate(selectedMember);
                                        if (confirmAction === 'revoke') handleRevoke(selectedMember);
                                        if (confirmAction === 'delete') handleDeleteMember(selectedMember);
                                        setConfirmAction(null);
                                    }}
                                    className={`flex h-12 flex-1 items-center justify-center rounded-2xl text-[15px] font-bold text-white shadow-xs ${confirmAction === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'}`}
                                >
                                    {confirmAction === 'suspend' && 'Yes, Suspend'}
                                    {confirmAction === 'activate' && 'Yes, Reactivate'}
                                    {confirmAction === 'revoke' && 'Yes, Revoke'}
                                    {confirmAction === 'delete' && 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    )}
                </ResponsiveSheet>

                {/* Subscription Gate Sheet */}
                <SubscriptionGateSheet open={gateSheetOpen} onClose={closeGateSheet} />
            </div>
        </OrganizationLayout>
    );
}
