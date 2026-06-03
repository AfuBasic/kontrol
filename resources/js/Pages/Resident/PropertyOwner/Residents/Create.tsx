import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, Link as LinkIcon, Mail, Power, RefreshCw, Share2, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { SharedData } from '@/types';
import {
    index,
    store,
    storeInviteLink,
    regenerateInviteLink,
    toggleInviteLink,
    destroyInviteLink,
} from '@/actions/App/Http/Controllers/Resident/PropertyOwner/ResidentController';

type TabType = 'invite_link' | 'single';

interface InviteLink {
    token: string;
    url: string;
    is_active: boolean;
    usage_count: number;
    max_usages: number | null;
    requires_approval: boolean;
    expires_at: string | null;
    is_expired: boolean;
}

interface Props {
    inviteLink: InviteLink | null;
    properties?: { id: number; name: string }[];
}

export default function CreateResident({ inviteLink, properties = [] }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('invite_link');
    const { auth } = usePage<SharedData>().props;
    const [isCopied, setIsCopied] = useState(false);
    const [isEditingSettings, setIsEditingSettings] = useState(false);

    const [inviteSettings, setInviteSettings] = useState({
        max_usages: inviteLink?.max_usages || '',
        requires_approval: inviteLink?.requires_approval ?? true,
        expires_at: inviteLink?.expires_at ? inviteLink.expires_at.split(' ')[0] : '',
    });

    useEffect(() => {
        if (inviteLink) {
            setInviteSettings({
                max_usages: inviteLink.max_usages ?? '',
                requires_approval: inviteLink.requires_approval,
                expires_at: inviteLink.expires_at ? inviteLink.expires_at.split(' ')[0] : '',
            });
        }
    }, [inviteLink]);

    // Single resident manual form
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        unit_number: '',
        address: '',
        property_id: '',
    });

    const handleSubmitSingle = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleCopyLink = () => {
        if (inviteLink?.url) {
            navigator.clipboard.writeText(inviteLink.url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleShareWhatsApp = () => {
        if (inviteLink?.url) {
            const text = encodeURIComponent(
                `Hi! You've been invited to join Kontrol as a resident under my property.\n\nClick the link below to sign up: ${inviteLink.url}`,
            );
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleGenerateLink = () => {
        router.post(
            storeInviteLink.url(),
            {
                max_usages: inviteSettings.max_usages || null,
                requires_approval: inviteSettings.requires_approval,
                expires_at: inviteSettings.expires_at || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditingSettings(false);
                },
            },
        );
    };

    const handleRegenerateLink = () => {
        if (!confirm('Are you sure? This will invalidate the previous link and reset its usage count.')) return;

        router.post(
            regenerateInviteLink.url(),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleToggleLink = () => {
        router.post(
            toggleInviteLink.url(),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleClearLink = () => {
        if (!confirm('Are you sure you want to delete this invite link? Users will no longer be able to use it to join.')) return;
        router.delete(
            destroyInviteLink.url(),
            {
                preserveScroll: true,
            },
        );
    };

    const tabs = [
        { id: 'invite_link' as const, label: 'Invite Link', icon: LinkIcon },
        { id: 'single' as const, label: 'Single Resident', icon: User },
    ];

    return (
        <div className="mx-auto max-w-2xl pb-16">
            <Head title="Invite Resident" />

            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={index.url()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
                >
                    <X className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Invite Resident</h1>
                    <p className="mt-1 text-sm text-slate-500">Add residents to your properties on Kontrol.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex rounded-xl bg-slate-100 p-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-lg bg-white shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <Icon className="relative z-10 h-4 w-4" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                {activeTab === 'single' && (
                    <motion.form
                        key="single"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleSubmitSingle}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    >
                        <div className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                    placeholder="Enter resident's full name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                            </div>

                            {/* Email Address */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                    placeholder="resident@example.com"
                                />
                                <p className="mt-1 text-xs text-slate-400">An invitation email will be sent to setup their password.</p>
                                {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                                    Phone Number <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                    placeholder="+234..."
                                />
                                {errors.phone && <p className="mt-1 text-sm text-rose-600">{errors.phone}</p>}
                            </div>

                            {/* Property Assignment */}
                            <div>
                                <label htmlFor="property_id" className="block text-sm font-semibold text-slate-700">
                                    Property Assignment <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <select
                                    id="property_id"
                                    value={data.property_id}
                                    onChange={(e) => setData('property_id', e.target.value)}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none bg-white"
                                >
                                    <option value="">None</option>
                                    {properties.map((prop) => (
                                        <option key={prop.id} value={prop.id}>
                                            {prop.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.property_id && <p className="mt-1 text-sm text-rose-600">{errors.property_id}</p>}
                            </div>

                            {/* Unit Number */}
                            <div>
                                <label htmlFor="unit_number" className="block text-sm font-semibold text-slate-700">
                                    Unit Number <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="unit_number"
                                    value={data.unit_number}
                                    onChange={(e) => setData('unit_number', e.target.value)}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                    placeholder="e.g., Flat 4, Block B"
                                />
                                {errors.unit_number && <p className="mt-1 text-sm text-rose-600">{errors.unit_number}</p>}
                            </div>

                            {/* Street Address */}
                            <div>
                                <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
                                    Street Address <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                    placeholder="Enter resident's full address"
                                />
                                {errors.address && <p className="mt-1 text-sm text-rose-600">{errors.address}</p>}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                            <Link
                                href={index.url()}
                                className="px-6 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-850"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-750 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50"
                            >
                                {processing ? 'Sending Invite...' : 'Invite Resident'}
                            </button>
                        </div>
                    </motion.form>
                )}

                {activeTab === 'invite_link' && (
                    <motion.div
                        key="invite_link"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <LinkIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">Configure Invite Link</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Let residents join your property using a shared URL.</p>
                                </div>
                            </div>

                            {/* Active Link Details Card */}
                            {inviteLink ? (
                                <div className="rounded-[2rem] bg-slate-50/50 p-6 ring-1 ring-slate-100/50">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                                inviteLink.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {inviteLink.is_active ? <CheckCircle className="h-6 w-6" /> : <Power className="h-6 w-6" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-800">{inviteLink.url}</p>
                                                <p className="mt-0.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    Used {inviteLink.usage_count} times
                                                    {inviteLink.max_usages ? ` · Limit ${inviteLink.max_usages}` : ''}
                                                    {inviteLink.expires_at ? ` · Expires ${inviteLink.expires_at.split(' ')[0]}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={handleCopyLink}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-xs ring-1 ring-slate-200 transition-all hover:text-slate-900 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                                title="Copy Link"
                                            >
                                                {isCopied ? <span className="text-[10px] font-semibold text-emerald-600">Copied</span> : <Copy className="h-4.5 w-4.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleShareWhatsApp}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xs transition-all hover:bg-[#20ba5a] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                                title="Share on WhatsApp"
                                            >
                                                <Share2 className="h-4.5 w-4.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleToggleLink}
                                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                                                inviteLink.is_active
                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm shadow-rose-500/5 hover:shadow'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm shadow-emerald-500/5 hover:shadow'
                                            }`}
                                        >
                                            <Power className="h-3.5 w-3.5" />
                                            {inviteLink.is_active ? 'Disable Link' : 'Enable Link'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRegenerateLink}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm hover:shadow"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Regenerate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingSettings(!isEditingSettings)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm hover:shadow"
                                        >
                                            Settings
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearLink}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm shadow-rose-500/5 hover:shadow"
                                        >
                                            Delete Link
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[2rem] bg-indigo-50/50 p-6 text-center ring-1 ring-indigo-100/50">
                                    <p className="text-sm font-medium text-slate-600">No active invitation link generated yet.</p>
                                    <button
                                        type="button"
                                        onClick={handleGenerateLink}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-750 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:from-indigo-500 hover:to-indigo-650 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                                    >
                                        Generate Invite Link
                                    </button>
                                </div>
                            )}

                            {/* Link Settings Form */}
                            {(isEditingSettings || !inviteLink) && (
                                <div className="space-y-4 border-t border-slate-100 pt-6">
                                    <h4 className="text-sm font-bold text-slate-800">Invite Link Settings</h4>
                                    
                                    {/* Max Usages */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Maximum Usage Limit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={inviteSettings.max_usages}
                                                onChange={(e) => setInviteSettings((prev) => ({ ...prev, max_usages: e.target.value }))}
                                                placeholder="Unlimited"
                                                className="block w-full rounded-2xl border border-slate-200 py-2.5 pr-12 pl-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-xs text-slate-400 font-semibold">uses</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Leave blank or set to 0 for unlimited uses.</p>
                                    </div>

                                    {/* Require Approval checkbox */}
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100/50">
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={inviteSettings.requires_approval}
                                                onChange={(e) => setInviteSettings((prev) => ({ ...prev, requires_approval: e.target.checked }))}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">Require Admin Approval</span>
                                                <span className="text-xs text-slate-400 mt-0.5">
                                                    If checked, new residents must be approved by the estate administrator after signing up.
                                                </span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Expiry Date */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Expiry Date</label>
                                        <input
                                            type="date"
                                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                            value={inviteSettings.expires_at}
                                            onChange={(e) => setInviteSettings((prev) => ({ ...prev, expires_at: e.target.value }))}
                                            className="block w-full rounded-2xl border border-slate-200 py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 focus:outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400">Link will automatically expire after this date.</p>
                                    </div>

                                    {inviteLink && (
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingSettings(false)}
                                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleGenerateLink}
                                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                            >
                                                Save Settings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

CreateResident.layout = (page: React.ReactNode) => <ResidentLayout children={page} />;
