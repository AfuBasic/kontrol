import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    BadgeCheck,
    CalendarClock,
    Check,
    ChevronRight,
    Clock,
    Copy,
    DoorOpen,
    EyeOff,
    Plus,
    Radio,
    Search,
    Shield,
    ShieldCheck,
    Trash2,
    User,
    UserCheck,
    Users,
    X,
    Share2,
    Loader2,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { KONTROL_LOGO_BASE64 } from '@/Utils/logo';
import { shareAccessCode } from '@/Utils/share';
import AccessHeader from '@/Components/Organization/AccessHeader';
import FilterChips, { FilterChipOption } from '@/Components/Organization/FilterChips';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import PassCard from '@/Components/Resident/PassCard';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import { ChevronDown, MapPin } from 'lucide-react';

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

interface PublicWindowItem {
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
        arrival_confirmation_required?: boolean;
        confirmation_window_minutes?: number;
        confirmation_escalation?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    members: PaginatedMembers;
    windows?: PublicWindowItem[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

const categoryOptions = ['all', 'staff', 'parent', 'student', 'member', 'contractor', 'visitor'];
const statusOptions = ['all', 'active', 'suspended'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initialsFor = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export default function AccessList({ organization, membership, members, windows = [], filters }: Props) {
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

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
            setAddPersonModalOpen(true);
        }
    }, []);

    const hasPublicWindows = organization.access_policy === 'public_window';
    const activeMembers = members.data.filter((member) => member.status === 'active').length;
    const suspendedMembers = members.data.filter((member) => member.status === 'suspended').length;

    const getMemberStatus = (member: Member) => {
        if (member.status === 'suspended') return { label: 'Suspended', color: 'rose' };
        if (member.is_valid_now) return { label: 'Active', color: 'emerald' };
        if (member.valid_until && new Date(member.valid_until) < new Date()) return { label: 'Expired', color: 'slate' };
        return { label: 'Pending', color: 'amber' };
    };

    const statusColorMap = {
        rose: 'bg-rose-50 text-rose-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-700',
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
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
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
        router.post(
            `/org/access-list/${member.id}/suspend`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedMember(null),
            },
        );
    };

    const handleActivate = (member: Member) => {
        router.post(
            `/org/access-list/${member.id}/activate`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedMember(null),
            },
        );
    };

    const handleRevoke = (member: Member) => {
        if (!member.active_credential) return;
        router.post(
            `/org/credentials/${member.active_credential.id}/revoke`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedMember(null),
            },
        );
    };

    const handleIssue = (member: Member) => {
        router.post(
            `/org/credentials/issue/${member.id}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedMember(null),
            },
        );
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
        <OrganizationLayout title="Access - People" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Access`} />

            <div className="space-y-4 pt-1 sm:pt-4">
                <AccessHeader
                    activeTab="people"
                    primaryAction={
                        membership.is_admin ? (
                            <button
                                type="button"
                                onClick={() => setAddPersonModalOpen(true)}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-bold text-[#0b4aa2] hover:bg-[#0b4aa2]/10"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                <span>Add person</span>
                            </button>
                        ) : undefined
                    }
                />

                {/* Tab Panel: People */}
                {members.total === 0 && !search && category === 'all' && status === 'all' ? (
                    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-xs sm:p-12">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">No people yet</h2>
                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            Add staff, parents, contractors or anyone who regularly needs recurring access.
                        </p>
                        {membership.is_admin && (
                            <button
                                type="button"
                                onClick={() => setAddPersonModalOpen(true)}
                                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b4aa2] px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0a408b] active:scale-[0.98]"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.25} />
                                <span>Add person</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Directory with search, filters, and list */
                    <div className="space-y-4 pt-2">
                        {/* Native Search Field */}
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                                strokeWidth={2.5}
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search people..."
                                className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                            />
                        </div>

                        {/* Category Filters */}
                        <FilterChips
                            variant="category"
                            value={category}
                            onChange={(id) => {
                                if (id === 'more') {
                                    // Normally opens a filter sheet, doing nothing for now to keep UI clean
                                } else {
                                    setCategory(id);
                                    applyFilters({ category: id });
                                }
                            }}
                            options={[
                                { id: 'all', label: 'All', count: category === 'all' ? members.total : undefined },
                                { id: 'staff', label: 'Staff' },
                                { id: 'parent', label: 'Parents' },
                                { id: 'more', label: 'More' },
                            ]}
                        />

                        {/* Section Header */}
                        <div className="flex items-center justify-between px-1 pt-2 pb-2">
                            <h2 className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
                                {members.total} {members.total === 1 ? 'Person' : 'People'}
                            </h2>
                        </div>

                        {/* People Directory List: Card Rows */}
                        {members.data.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                                <p className="text-sm font-bold text-slate-900">No matching people found</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {search ? `No members matched "${search}".` : 'No members found in this category.'}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                                {members.data.map((member, index) => {
                                    const memberStatus = getMemberStatus(member);
                                    const statusLabel = memberStatus.label === 'Active' ? 'Active' : memberStatus.label;
                                    const dateLabel = member.valid_until ? `Until ${member.valid_until}` : 'No end date';

                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => setSelectedMember(member)}
                                            className={`flex min-h-[64px] cursor-pointer items-center justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 ${
                                                index !== members.data.length - 1 ? 'border-b border-slate-100' : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 items-start gap-3.5">
                                                {/* Avatar */}
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tracking-tight text-slate-600">
                                                    {initialsFor(member.name)}
                                                </div>

                                                {/* Identity */}
                                                <div className="min-w-0 flex-1 py-0.5">
                                                    <div className="truncate text-[15px] font-bold text-slate-900 leading-tight">{member.name}</div>
                                                    <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                        <span className="capitalize">{member.category}</span>
                                                        {' · '}
                                                        <span className={statusLabel === 'Active' ? 'text-emerald-600 font-semibold' : ''}>{statusLabel}</span>
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                                        {dateLabel}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column: Chevron */}
                                            <div className="flex shrink-0 items-center justify-end">
                                                <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Someone Sheet / Modal */}
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
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold tracking-tight text-slate-700">
                                        {initialsFor(selectedMember.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-950">{selectedMember.name}</h3>
                                        <p className="mt-0.5 text-sm text-slate-500 capitalize">{selectedMember.category}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-6">
                                {/* Profile Info */}
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
                                            <dd className="text-sm font-semibold text-slate-900">{selectedMember.identifier || '—'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-sm font-medium text-slate-500">Valid Until</dt>
                                            <dd className="text-sm font-semibold text-slate-900">
                                                {selectedMember.valid_until ? new Date(selectedMember.valid_until).toLocaleDateString() : 'Forever'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Active Access Code */}
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

                                            {/* Action Buttons: Copy & Share */}
                                            <div className="mt-4 flex w-full gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyCode(selectedMember.active_credential!.code, selectedMember.active_credential!.id)
                                                    }
                                                    className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xs transition-all active:scale-98 ${
                                                        copiedCodeId === selectedMember.active_credential.id
                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                                    }`}
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
                                                    className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xs transition-all active:scale-98 disabled:opacity-75 ${
                                                        shareCopied
                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                                    }`}
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
                                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Issue new code
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Danger Zone */}
                                {membership.is_admin && (
                                    <div className="pt-2">
                                        <h4 className="text-xs font-semibold tracking-wider text-rose-400 uppercase">Danger Zone</h4>
                                        <div className="mt-3 space-y-2">
                                            <button
                                                onClick={() =>
                                                    selectedMember.status === 'suspended'
                                                        ? handleActivate(selectedMember)
                                                        : handleSuspend(selectedMember)
                                                }
                                                className={`flex w-full items-center justify-between rounded-xl border p-4 transition-colors disabled:opacity-50 ${
                                                    selectedMember.status === 'suspended'
                                                        ? 'border-emerald-100 bg-emerald-50 hover:border-emerald-200'
                                                        : 'border-orange-100 bg-orange-50 hover:border-orange-200'
                                                }`}
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

                                            {selectedMember.active_credential ? (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to permanently revoke this code?')) {
                                                            handleRevoke(selectedMember);
                                                        }
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-4 transition-colors hover:border-rose-200 disabled:opacity-50"
                                                >
                                                    <div className="flex items-center gap-3 text-left">
                                                        <EyeOff className="h-5 w-5 text-rose-600" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-rose-900">Revoke code</p>
                                                            <p className="text-xs text-rose-700">Delete active access code</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </ResponsiveSheet>
            </div>
        </OrganizationLayout>
    );
}
