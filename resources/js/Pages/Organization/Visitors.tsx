
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Search, Copy, Share2, Check, ShieldAlert, Link as LinkIcon, Clock, Loader2, User, Phone, ChevronRight, Plus } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import AccessHeader from '@/Components/Organization/AccessHeader';
import PassTimingPicker, { defaultPassTiming, passStart, type PassTiming } from '@/Components/Organization/PassTimingPicker';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import SubscriptionGateSheet from '@/Components/Organization/SubscriptionGateSheet';
import PassCard from '@/Components/Resident/PassCard';
import CustomSelect from '@/Components/UI/CustomSelect';
import Button from '@/Components/UI/Button';
import TextInput from '@/Components/UI/TextInput';
import { shareAccessCode } from '@/Utils/share';
import { useSubscriptionGate } from '@/Hooks/useSubscriptionGate';

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
    durationOptions: { minutes: number; label: string }[];
    durationConstraints: { min: number; max: number };
}

export default function Visitors({ organization, membership, visitors, filters, durationOptions, durationConstraints }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const { gated, gateSheetOpen, closeGateSheet } = useSubscriptionGate();
    const [bulkSummaryOpen, setBulkSummaryOpen] = useState(false);
    const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const initialDuration = durationOptions.find((o) => o.minutes === 60)?.minutes ?? durationOptions[0]?.minutes ?? durationConstraints.min;
    const [timing, setTiming] = useState<PassTiming>(() => defaultPassTiming(initialDuration));

    const purposeOptions = [
        { value: 'meeting', label: 'Meeting' },
        { value: 'delivery', label: 'Delivery' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'interview', label: 'Interview' },
        { value: 'event', label: 'Event' },
        { value: 'other', label: 'Other' },
    ];

    useEffect(() => {
        if (flash.bulk_passes && flash.bulk_passes.length > 0) {
            setBulkSummaryOpen(true);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'invite_visitor') {
            gated(() => setInviteModalOpen(true))();
        }
    }, [flash.bulk_passes, gated]);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        visitor_name: '',
        visitor_phone: '',
        purpose: '',
    });

    const [copiedCode, setCopiedCode] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<number>(120);
    const [extending, setExtending] = useState(false);

    const [copying, setCopying] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/org/visitors', { search: search || undefined }, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const copyCodeOnly = async (pass: VisitorPass) => {
        if (copying) return;
        setCopying(true);
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(pass.code);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = pass.code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2500);
        } catch (err) {
            console.error('Failed to copy access code', err);
        } finally {
            setCopying(false);
        }
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
        if (!selectedPass || extending) return;
        setExtending(true);
        router.post(
            `/org/visitors/${selectedPass.id}/extend`,
            { duration_minutes: selectedDuration },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsExtendModalOpen(false);
                    setExtending(false);
                    // Update local selectedPass expiration in the open drawer
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
        transform((form) => ({
            ...form,
            starts_at: passStart(timing)?.toISOString() ?? null,
            duration_minutes: timing.durationMinutes,
        }));
        post('/org/visitors', {
            preserveScroll: true,
            onSuccess: () => {
                setInviteModalOpen(false);
                reset();
                setTiming(defaultPassTiming(initialDuration));
            },
        });
    };

    const handleRevoke = (passId: number) => {
        if (!confirm('Are you sure you want to revoke this pass? It will immediately become invalid.')) return;
        setRevoking(true);
        router.delete(`/org/visitors/${passId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setRevoking(false);
                if (selectedPass?.id === passId) {
                    setSelectedPass(null);
                }
            },
            onError: () => {
                setRevoking(false);
            },
        });
    };

    const formatTimeWindow = (startsAtStr: string, expiresAtStr: string) => {
        const start = new Date(startsAtStr);
        const end = new Date(expiresAtStr);

        // If it spans whole day 00:00 to 23:59
        const isWholeDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() === 59;

        if (isWholeDay) {
            return 'All Day (Ends 11:59 PM)';
        }

        const startFormatted = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const endFormatted = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (start.toDateString() !== end.toDateString()) {
            const day = (d: Date) => d.toLocaleDateString([], { day: 'numeric', month: 'short' });
            return `${day(start)}, ${startFormatted} - ${day(end)}, ${endFormatted}`;
        }

        return `${startFormatted} - ${endFormatted}`;
    };

    return (
        <OrganizationLayout title="Access - Visitors" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - Visitors`} />

            <div className="flex flex-col gap-3.5 px-4 pt-1 pb-24 max-w-[480px] mx-auto">
                <AccessHeader
                    activeTab="visitors"
                    primaryAction={
                        membership.is_admin ? (
                            <button
                                type="button"
                                onClick={gated(() => setInviteModalOpen(true))}
                                className="flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a5dbf] shadow-[0_2px_8px_rgba(26,93,191,0.10)] transition active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Invite
                            </button>
                        ) : undefined
                    }
                />

                {/* Directory with search, filters, and list */}
                <div className="flex flex-col gap-3">
                    {/* Native Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search visitors..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2 pr-4 pl-10 text-xs !text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>


                    {/* Recent Visitors Header */}
                    <div className="flex items-center justify-between px-1 pt-2">
                        <h2 className="text-[15px] font-bold text-slate-800">Recent Visitors</h2>
                        <button className="flex items-center text-[13px] font-medium text-slate-500 hover:text-[#0b1f40]">
                            View all <ChevronRight className="ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Visitors Directory List: Card Rows */}
                    {visitors.data.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No matching visitors found</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {search ? `No visitors matched "${search}".` : 'No visitors found in this category.'}
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                            {visitors.data.map((pass, index) => {
                                // Status styling mappings
                                const statusMap = {
                                    active: { label: 'Active', color: 'text-emerald-600 font-semibold', bg: 'bg-emerald-100' },
                                    used: { label: 'Pending', color: 'text-amber-600 font-semibold', bg: 'bg-amber-100' },
                                    revoked: { label: 'Revoked', color: 'text-rose-600 font-semibold', bg: 'bg-rose-100' },
                                    expired: { label: 'Expired', color: 'text-slate-600 font-semibold', bg: 'bg-slate-100' },
                                };
                                const s = statusMap[pass.status] || statusMap.active;

                                return (
                                    <div
                                        key={pass.id}
                                        onClick={() => setSelectedPass(pass)}
                                        className={`flex min-h-[64px] cursor-pointer items-center justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 ${
                                            index !== visitors.data.length - 1 ? 'border-b border-slate-100' : ''
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-start gap-3.5">
                                            {/* Avatar/Initial */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tracking-tight text-slate-600">
                                                {pass.visitor_name.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Identity & Metadata */}
                                            <div className="min-w-0 flex-1 py-0.5">
                                                <div className="truncate text-[15px] font-bold text-slate-900 leading-tight">{pass.visitor_name}</div>
                                                <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                    <span className="capitalize">{pass.purpose}</span>
                                                    {' · '}
                                                    <span className={s.color}>{s.label}</span>
                                                </p>
                                                <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                                    {formatTimeWindow(pass.starts_at, pass.expires_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="flex shrink-0 items-center justify-end">
                                            <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pass Details Drawer */}
                <ResponsiveSheet isOpen={!!selectedPass} onClose={() => setSelectedPass(null)} title="Pass Details">
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
                            <div className="mx-auto w-full max-w-sm space-y-3 pt-1">
                                <div className="flex w-full gap-3">
                                    <button
                                        type="button"
                                        onClick={() => copyCodeOnly(selectedPass)}
                                        disabled={copying}
                                        className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold shadow-xs transition-all active:scale-98 disabled:opacity-70 ${
                                            copiedCode
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                        }`}
                                    >
                                        {copying ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                        ) : copiedCode ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-slate-500" />
                                        )}
                                        <span>{copiedCode ? 'Copied Code!' : copying ? 'Copying...' : 'Copy Code'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleShare(selectedPass)}
                                        disabled={sharing}
                                        className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold shadow-xs transition-all active:scale-98 disabled:opacity-75 ${
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

                                {/* Extend Pass Button (for active passes) */}
                                {selectedPass.status === 'active' && selectedPass.type !== 'long_lived' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsExtendModalOpen(true)}
                                        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200/80 bg-indigo-50/80 px-4 py-4 text-sm font-bold text-indigo-700 shadow-xs transition hover:bg-indigo-100 active:scale-98"
                                    >
                                        <Clock className="h-4 w-4 text-indigo-600" />
                                        <span>Extend Pass Duration</span>
                                    </button>
                                )}

                                {/* Revoke Action */}
                                {membership.is_admin && selectedPass.status === 'active' && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(selectedPass.id)}
                                            disabled={revoking}
                                            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-4 text-sm font-bold text-rose-600 shadow-xs transition hover:bg-rose-100/70 active:scale-98 disabled:opacity-50"
                                        >
                                            {revoking ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                                            ) : (
                                                <ShieldAlert className="h-4 w-4" />
                                            )}
                                            <span>{revoking ? 'Revoking Pass...' : 'Revoke Pass Immediately'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ResponsiveSheet>

                {/* Extend Pass Duration Modal (using ResponsiveSheet so it stacks correctly above Pass Details) */}
                <ResponsiveSheet
                    isOpen={isExtendModalOpen && !!selectedPass}
                    onClose={() => setIsExtendModalOpen(false)}
                    title="Extend Visitor Pass"
                    maxWidth="sm"
                >
                    {selectedPass && (
                        <div className="p-1">
                            <p className="mb-4 text-xs text-slate-500">
                                Add extra validity time to <span className="font-semibold text-slate-800">{selectedPass.visitor_name}</span>'s pass.
                            </p>

                            <form onSubmit={handleExtendPass} className="space-y-4" noValidate>
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

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExtendModalOpen(false)}
                                        disabled={extending}
                                        className="min-h-[56px] flex-1 rounded-2xl border border-slate-200 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={extending}
                                        className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-75"
                                    >
                                        {extending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Extending...</span>
                                            </>
                                        ) : (
                                            <span>Confirm Extension</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </ResponsiveSheet>

                {/* Invite Visitor Modal */}
                <ResponsiveSheet isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-slate-900">Invite visitor</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">Create a temporary pass for a visitor.</p>
                        </div>
                    </div>

                    <form onSubmit={handleInvite} className="mt-6 space-y-5">
                        <TextInput
                            label="Visitor Name"
                            icon={User}
                            placeholder="John Doe"
                            required
                            value={data.visitor_name}
                            onChange={(e) => setData('visitor_name', e.target.value)}
                            error={errors.visitor_name}
                        />

                        <TextInput
                            label="Phone Number"
                            icon={Phone}
                            type="tel"
                            placeholder="+234 801 234 5678"
                            value={data.visitor_phone}
                            onChange={(e) => setData('visitor_phone', e.target.value)}
                            error={errors.visitor_phone}
                        />

                        <PassTimingPicker
                            value={timing}
                            onChange={setTiming}
                            durationOptions={durationOptions}
                            constraints={durationConstraints}
                            errors={errors as { starts_at?: string; duration_minutes?: string }}
                        />

                        <CustomSelect
                            label="Purpose"
                            value={data.purpose}
                            onChange={(val) => setData('purpose', String(val))}
                            options={purposeOptions}
                        />
                        {errors.purpose && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.purpose}</p>}

                        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="secondary" isLoading={processing}>
                                Invite Visitor
                            </Button>
                        </div>
                    </form>
                </ResponsiveSheet>

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
                            <div className="max-h-[50vh] space-y-3 overflow-y-auto pt-4">
                                {flash.bulk_passes.map((pass, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{pass.visitor_name}</div>
                                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                <LinkIcon className="h-3 w-3" /> kontrol.test/pass/{pass.code}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyCode(pass)}
                                            className="rounded-md border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:text-slate-700"
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

                {/* Subscription Gate Sheet */}
                <SubscriptionGateSheet open={gateSheetOpen} onClose={closeGateSheet} />
            </div>
        </OrganizationLayout>
    );
}
