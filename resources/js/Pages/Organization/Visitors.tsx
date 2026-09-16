import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    Search,
    Tag,
    Users,
    Copy,
    Share2,
    Check,
    X,
    ShieldAlert,
    Link as LinkIcon,
    Clock,
    Loader2,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import BulkInviteModal from './BulkInviteModal';
import AccessActionMenu from '@/Components/Organization/AccessActionMenu';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import PassCard from '@/Components/Resident/PassCard';
import CustomSelect from '@/Components/UI/CustomSelect';
import { shareAccessCode } from '@/Utils/share';

interface Organization {
    id: number;
    name: string;
}

interface AccessLog {
    id: number;
    created_at: string;
    entry_point: string | null;
}

interface VisitorPass {
    id: number;
    code: string;
    pass_uuid: string;
    qr_token: string;
    visitor_name: string;
    visitor_phone: string | null;
    purpose: string;
    type: string;
    status: 'active' | 'used' | 'revoked' | 'expired';
    starts_at: string;
    expires_at: string;
    created_at?: string;
    arrival_time?: string | null;
    arrival_date?: string | null;
    expires_time?: string | null;
    access_logs?: AccessLog[];
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    organization: Organization;
    membership: { role: string; is_admin: boolean };
    visitors: PaginatedData<VisitorPass>;
    filters: { search: string | null };
}

export default function Visitors({ organization, membership, visitors, filters }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkInviteModalOpen, setBulkInviteModalOpen] = useState(false);
    const [bulkSummaryOpen, setBulkSummaryOpen] = useState(false);
    const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [isCustomTime, setIsCustomTime] = useState(false);

    useEffect(() => {
        if (flash.bulk_passes && flash.bulk_passes.length > 0) {
            setBulkSummaryOpen(true);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'invite_visitor') setInviteModalOpen(true);
        if (params.get('action') === 'invite_multiple') setBulkInviteModalOpen(true);
    }, [flash.bulk_passes]);

    const { data, setData, post, processing, errors, reset } = useForm({
        visitor_name: '',
        visitor_phone: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
    });

    const [copiedCode, setCopiedCode] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<number>(120);
    const [extending, setExtending] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/org/visitors', { search }, { preserveState: true, preserveScroll: true });
    };

    const copyCodeOnly = (pass: VisitorPass) => {
        navigator.clipboard.writeText(pass.code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleShare = async (pass: VisitorPass) => {
        if (sharing) return;
        setSharing(true);
        try {
            const result = await shareAccessCode(
                {
                    ...pass,
                    estate_name: organization.name,
                } as any,
                cardRef.current,
            );
            if (result?.method === 'copy' && result.success) {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
            }
        } finally {
            setSharing(false);
        }
    };

    const handleExtendPass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPass) return;
        setExtending(true);
        router.post(
            `/org/visitors/${selectedPass.id}/extend`,
            { duration_minutes: selectedDuration },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsExtendModalOpen(false);
                    setExtending(false);
                    // Update local selectedPass expiration if still open
                    setSelectedPass((prev) => {
                        if (!prev) return null;
                        const baseTime = prev.expires_at ? new Date(prev.expires_at) : new Date();
                        const newExpiry = new Date((baseTime < new Date() ? new Date() : baseTime).getTime() + selectedDuration * 60000);
                        return {
                            ...prev,
                            expires_at: newExpiry.toISOString(),
                            status: 'active',
                        };
                    });
                },
                onError: () => {
                    setExtending(false);
                },
            },
        );
    };

    const copyCode = (pass: { pass_uuid: string; id?: number }) => {
        const link = `${window.location.origin}/pass/${pass.pass_uuid}`;
        navigator.clipboard.writeText(link);
        if (pass.id) {
            setCopiedCodeId(pass.id);
            setTimeout(() => setCopiedCodeId(null), 2000);
        }
    };

    const copyAllLinks = () => {
        if (!flash.bulk_passes) return;
        const textToCopy = flash.bulk_passes.map((pass) => `${pass.visitor_name}: ${window.location.origin}/pass/${pass.pass_uuid}`).join('\n');
        navigator.clipboard.writeText(textToCopy);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        post('/org/visitors', {
            preserveScroll: true,
            onSuccess: () => {
                setInviteModalOpen(false);
                reset();
                setIsCustomTime(false);
            },
        });
    };

    const handleRevoke = (passId: number) => {
        if (!confirm('Are you sure you want to revoke this pass?')) return;

        router.delete(`/org/visitors/${passId}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedPass?.id === passId) {
                    setSelectedPass(null);
                }
            },
        });
    };

    const formatTimeWindow = (startsAtStr: string, expiresAtStr: string) => {
        const start = new Date(startsAtStr);
        const end = new Date(expiresAtStr);

        // If it spans whole day 00:00 to 23:59
        const isWholeDay =
            start.getHours() === 0 &&
            start.getMinutes() === 0 &&
            end.getHours() === 23 &&
            end.getMinutes() === 59;

        if (isWholeDay) {
            return 'All Day (Ends 11:59 PM)';
        }

        const startFormatted = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const endFormatted = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        return `${startFormatted} – ${endFormatted}`;
    };

    return (
        <OrganizationLayout title="Visitors">
            <Head title="Visitors - Organization" />

            <div className="mx-auto max-w-4xl py-2 sm:py-4">
                {/* Header & Actions */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Hub</h1>
                        <p className="mt-1 text-sm text-slate-500">Manage people, visitors, and active arrivals.</p>
                    </div>

                    {membership.is_admin && (
                        <div className="flex items-center gap-3">
                            <AccessActionMenu 
                                onInviteVisitor={() => setInviteModalOpen(true)}
                                onInviteMultiple={() => setBulkInviteModalOpen(true)}
                            />
                        </div>
                    )}
                </div>

                <AccessTabs activeTab="visitors" />

                <div className="mt-8 rounded-2xl bg-white shadow-xs ring-1 ring-slate-900/5">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-xl border-0 bg-slate-50 pr-4 pl-10 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:bg-white focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                            />
                        </form>
                    </div>

                    {/* Visitors List */}
                    <div className="divide-y divide-slate-100">
                        {visitors.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                                    <Users className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-slate-900">No visitors found</h3>
                                <p className="mt-1 max-w-xs text-sm text-slate-500">
                                    {search ? "We couldn't find any visitors matching your search." : 'Get started by inviting your first visitor.'}
                                </p>
                            </div>
                        ) : (
                            visitors.data.map((pass) => (
                                <div
                                    key={pass.id}
                                    onClick={() => setSelectedPass(pass)}
                                    className="group flex cursor-pointer flex-col justify-between gap-4 px-4 py-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:px-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold tracking-tight text-slate-700 transition group-hover:bg-slate-200">
                                            {pass.visitor_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-slate-950 transition group-hover:text-indigo-600">
                                                    {pass.visitor_name}
                                                </h3>
                                                {pass.status === 'active' && (
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-100 ring-inset">
                                                        Active
                                                    </span>
                                                )}
                                                {pass.status === 'used' && (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase ring-1 ring-slate-200 ring-inset">
                                                        Used
                                                    </span>
                                                )}
                                                {pass.status === 'revoked' && (
                                                    <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-700 uppercase ring-1 ring-rose-100 ring-inset">
                                                        Revoked
                                                    </span>
                                                )}
                                                {pass.status === 'expired' && (
                                                    <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase ring-1 ring-amber-100 ring-inset">
                                                        Expired
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(pass.starts_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatTimeWindow(pass.starts_at, pass.expires_at)}
                                                </span>
                                                {pass.purpose && (
                                                    <span className="flex items-center gap-1 capitalize text-slate-500">
                                                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                                                        {pass.purpose}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-2xs">
                                            <span className="font-mono text-base font-bold tracking-widest text-slate-900">{pass.code}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyCode(pass)}
                                                className="ml-2 text-slate-400 transition hover:text-slate-700"
                                                title="Copy Pass Link"
                                            >
                                                {copiedCodeId === pass.id ? (
                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>

                                        {membership.is_admin && pass.status === 'active' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRevoke(pass.id)}
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                title="Revoke Pass"
                                            >
                                                <ShieldAlert className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pass Details Drawer */}
                <ResponsiveSheet
                    isOpen={!!selectedPass}
                    onClose={() => setSelectedPass(null)}
                    title="Pass Details"
                >
                    {selectedPass && (
                        <div className="space-y-6">
                            {/* Reusable Pass Card with visual QR Ticket */}
                            <div ref={cardRef} className="mx-auto w-full max-w-sm">
                                <PassCard
                                    pass={{
                                        ...selectedPass,
                                        host_name: organization.name,
                                        estate_name: organization.name,
                                    }}
                                    qrUrl={`kontrol://pass/${selectedPass.pass_uuid}?token=${selectedPass.qr_token}`}
                                />
                            </div>

                            {/* Action Buttons: Copy & Share */}
                            <div className="mx-auto w-full max-w-sm space-y-2.5">
                                <div className="flex w-full gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => copyCodeOnly(selectedPass)}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-98 ${
                                            copiedCode
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleShare(selectedPass)}
                                        disabled={sharing}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-98 disabled:opacity-75 ${
                                            shareCopied
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        <span>{shareCopied ? 'Shared / Copied!' : 'Share Pass'}</span>
                                    </button>
                                </div>

                                {/* Extend Pass Button (for active passes) */}
                                {selectedPass.status === 'active' && selectedPass.type !== 'long_lived' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsExtendModalOpen(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-98"
                                    >
                                        <Clock className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>Extend Pass Duration</span>
                                    </button>
                                )}

                                {/* Revoke Action */}
                                {membership.is_admin && selectedPass.status === 'active' && (
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(selectedPass.id)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100/70 active:scale-98"
                                        >
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            <span>Revoke Pass Immediately</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ResponsiveSheet>

                {/* Extend Pass Duration Modal */}
                {isExtendModalOpen && selectedPass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                        <div className="animate-in fade-in zoom-in w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl duration-150">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Extend Visitor Pass</h3>
                                </div>
                                <button
                                    onClick={() => setIsExtendModalOpen(false)}
                                    disabled={extending}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleExtendPass} className="mt-4 space-y-4" noValidate>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Extension Duration</label>
                                    <CustomSelect
                                        value={selectedDuration}
                                        onChange={(val) => setSelectedDuration(Number(val))}
                                        disabled={extending}
                                        options={[
                                            { value: 60, label: '+1 hour' },
                                            { value: 120, label: '+2 hours' },
                                            { value: 240, label: '+4 hours' },
                                            { value: 480, label: '+8 hours' },
                                            { value: 1440, label: '+1 day' },
                                        ]}
                                    />
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExtendModalOpen(false)}
                                        disabled={extending}
                                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={extending}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-75"
                                    >
                                        {extending ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>Extending...</span>
                                            </>
                                        ) : (
                                            <span>Confirm Extension</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Invite Visitor Modal */}
                <ResponsiveSheet isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">Invite visitor</h3>
                            <p className="mt-0.5 text-xs text-slate-500">Create a temporary pass for a visitor.</p>
                        </div>
                    </div>

                    <form onSubmit={handleInvite} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Visitor Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={data.visitor_name}
                                onChange={(e) => setData('visitor_name', e.target.value)}
                                className="mt-2 block w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:bg-white focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                            />
                            {errors.visitor_name && <p className="mt-1 text-xs text-rose-500">{errors.visitor_name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+1 234 567 8900"
                                value={data.visitor_phone}
                                onChange={(e) => setData('visitor_phone', e.target.value)}
                                className="mt-2 block w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:bg-white focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                            />
                            {errors.visitor_phone && <p className="mt-1 text-xs text-rose-500">{errors.visitor_phone}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Date of Visit <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="mt-2 block w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:bg-white focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                            />
                            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Timeframe
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomTime(!isCustomTime);
                                        if (isCustomTime) {
                                            setData((prev) => ({ ...prev, start_time: '', end_time: '' }));
                                        }
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    {isCustomTime ? 'Switch to All Day' : 'Set Specific Hours'}
                                </button>
                            </div>

                            {isCustomTime ? (
                                <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                        />
                                        {errors.start_time && <p className="mt-1 text-xs text-rose-500">{errors.start_time}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={data.end_time}
                                            onChange={(e) => setData('end_time', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                        />
                                        {errors.end_time && <p className="mt-1 text-xs text-rose-500">{errors.end_time}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600">
                                    Valid entire day (expires at 11:59 PM)
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">Purpose</label>
                            <select
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                className="mt-2 block w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:bg-white focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                            >
                                <option value="">Select purpose</option>
                                <option value="meeting">Meeting</option>
                                <option value="delivery">Delivery</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="interview">Interview</option>
                                <option value="event">Event</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.purpose && <p className="mt-1 text-xs text-rose-500">{errors.purpose}</p>}
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setInviteModalOpen(false)}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
                            >
                                {processing ? 'Inviting...' : 'Invite Visitor'}
                            </button>
                        </div>
                    </form>
                </ResponsiveSheet>

                {/* Bulk Invite Modal */}
                <BulkInviteModal
                    isOpen={bulkInviteModalOpen}
                    onClose={() => setBulkInviteModalOpen(false)}
                />

                {/* Bulk Summary Modal */}
                <ResponsiveSheet isOpen={bulkSummaryOpen && !!flash.bulk_passes} onClose={() => setBulkSummaryOpen(false)}>
                    {flash.bulk_passes && (
                        <>
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-950">Passes Generated Successfully!</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">You can now copy and share these links with your visitors.</p>
                                </div>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto pt-4 space-y-3">
                                {flash.bulk_passes.map((pass, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{pass.visitor_name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><LinkIcon className="w-3 h-3"/> kontrol.test/pass/{pass.code}</div>
                                        </div>
                                        <button
                                            onClick={() => copyCode(pass)}
                                            className="p-2 text-slate-400 hover:text-slate-700 transition bg-white rounded-md border border-slate-200 shadow-sm"
                                            title="Copy link"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 border-t border-slate-100 pt-4">
                                <button
                                    onClick={copyAllLinks}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    {copiedAll ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    {copiedAll ? 'Copied All Links!' : 'Copy All Links to Clipboard'}
                                </button>
                            </div>
                        </>
                    )}
                </ResponsiveSheet>
            </div>
        </OrganizationLayout>
    );
}
