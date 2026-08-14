import Toast from '@/Components/Toast';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Copy, Link as LinkIcon, Plus, Power, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface InviteLink {
    id: number;
    token: string;
    url: string;
    is_active: boolean;
    usage_count: number;
    max_usages: number | null;
    requires_approval: boolean;
    expires_at: string | null;
    is_expired: boolean;
    zone_id: number | null;
    zone_name: string;
}

interface InviteLinksTabProps {
    inviteLinks: InviteLink[];
    zones: { id: number; name: string }[];
    urls: {
        store: string;
        toggle: string;
        regenerate: string;
        destroy: string;
    };
    estateName: string;
}

export default function InviteLinksTab({ inviteLinks, zones, urls, estateName }: InviteLinksTabProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdLink, setCreatedLink] = useState<InviteLink | null>(null);
    const [isCopied, setIsCopied] = useState<number | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const [settings, setSettings] = useState({
        zone_id: '',
        max_usages: '',
        requires_approval: true,
        expires_at: '',
    });

    const handleGenerateLink = () => {
        router.post(
            urls.store,
            {
                zone_id: settings.zone_id || null,
                max_usages: settings.max_usages || null,
                requires_approval: settings.requires_approval,
                expires_at: settings.expires_at || null,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setShowCreateModal(false);
                    // Find the newest link (highest ID) as the created one
                    const newLinks = page.props.inviteLinks as InviteLink[];
                    if (newLinks && newLinks.length > 0) {
                        const latest = [...newLinks].sort((a, b) => b.id - a.id)[0];
                        setCreatedLink(latest);
                        setShowSuccessModal(true);
                    }
                    setSettings({ zone_id: '', max_usages: '', requires_approval: true, expires_at: '' });
                },
            },
        );
    };

    const fallbackCopy = (id: number, url: string) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setIsCopied(id);
            setToast({
                show: true,
                message: 'Invite link copied to clipboard!',
                type: 'success',
            });
            setTimeout(() => setIsCopied(null), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    };

    const handleCopy = (id: number, url: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard
                .writeText(url)
                .then(() => {
                    setIsCopied(id);
                    setToast({
                        show: true,
                        message: 'Invite link copied to clipboard!',
                        type: 'success',
                    });
                    setTimeout(() => setIsCopied(null), 2000);
                })
                .catch(() => {
                    fallbackCopy(id, url);
                });
            return;
        }

        fallbackCopy(id, url);
    };

    const handleToggle = (id: number) => {
        router.post(urls.toggle, { id }, { preserveScroll: true });
    };

    const handleRegenerate = (id: number) => {
        if (!confirm('Are you sure? This will invalidate the previous link and reset its usage count.')) return;
        router.post(urls.regenerate, { id }, { preserveScroll: true });
    };

    const handleDelete = (id: number, isActive: boolean) => {
        if (isActive) {
            alert('Please disable the link before deleting it.');
            return;
        }
        if (!confirm('Are you sure you want to delete this invite link?')) return;
        router.delete(urls.destroy, { data: { id }, preserveScroll: true });
    };

    const handleShareWhatsApp = (url: string) => {
        const text = encodeURIComponent(
            `Hi! You've been invited to join ${estateName} on Kontrol. 🚀\n\nClick the link below to get started: ${url}`,
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invite Links</h3>
                    <p className="text-sm text-gray-500">Manage shareable links for your estate or specific zones.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    New Link
                </button>
            </div>

            {/* Links Table */}
            {inviteLinks.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Zone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">URL</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Usages</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {inviteLinks.map((link) => (
                                    <tr key={link.id} className={!link.is_active || link.is_expired ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">{link.zone_name}</td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">{link.token.substring(0, 12)}...</span>
                                                <button
                                                    onClick={() => handleCopy(link.id, link.url)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="Copy full URL"
                                                >
                                                    {isCopied === link.id ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                            {link.usage_count} {link.max_usages ? `/ ${link.max_usages}` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                                                    link.is_expired
                                                        ? 'bg-red-100 text-red-800'
                                                        : link.is_active
                                                          ? 'bg-green-100 text-green-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {link.is_expired ? 'Expired' : link.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRegenerate(link.id)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Regenerate token"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(link.id)}
                                                    className={`${link.is_active ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                                                    title={link.is_active ? 'Disable link' : 'Enable link'}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(link.id, link.is_active)}
                                                    disabled={link.is_active}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-30"
                                                    title={link.is_active ? 'Disable before deleting' : 'Delete link'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                    <LinkIcon className="mb-3 h-10 w-10 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900">No Invite Links</h3>
                    <p className="mt-1 text-sm text-gray-500">Create an invite link to allow self-registration.</p>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">Create Invite Link</h3>
                            </div>
                            <div className="space-y-4 p-6">
                                {/* Zone Assignment */}
                                {zones.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Zone Scope</label>
                                        <select
                                            value={settings.zone_id}
                                            onChange={(e) => setSettings({ ...settings, zone_id: e.target.value })}
                                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        >
                                            <option value="">Entire Estate</option>
                                            {zones.map((zone) => (
                                                <option key={zone.id} value={zone.id}>
                                                    {zone.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Max Usages */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Maximum Usages</label>
                                    <input
                                        type="number"
                                        value={settings.max_usages}
                                        onChange={(e) => setSettings({ ...settings, max_usages: e.target.value })}
                                        placeholder="Unlimited"
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Approval Required */}
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <div className="mt-1 flex h-5 items-center">
                                            <input
                                                type="checkbox"
                                                checked={settings.requires_approval}
                                                onChange={(e) => setSettings({ ...settings, requires_approval: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">Require Approval</span>
                                            <span className="text-xs text-gray-500">Users will stay pending until an admin approves them.</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Expiry */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                                    <input
                                        type="date"
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                        value={settings.expires_at}
                                        onChange={(e) => setSettings({ ...settings, expires_at: e.target.value })}
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateLink}
                                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                                    >
                                        Generate Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && createdLink && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="bg-primary-600 p-8 text-center text-white">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Invite Link Ready!</h3>
                            </div>

                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Shareable URL</label>
                                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                            <input
                                                type="text"
                                                readOnly
                                                value={createdLink.url}
                                                className="flex-1 bg-transparent font-mono text-sm text-gray-600 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleCopy(createdLink.id, createdLink.url)}
                                                className={`rounded-lg p-2 transition-colors ${isCopied === createdLink.id ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {isCopied === createdLink.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <button
                                            onClick={() => handleShareWhatsApp(createdLink.url)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:opacity-90"
                                        >
                                            <Share2 className="h-5 w-5" />
                                            Share on WhatsApp
                                        </button>
                                        <button
                                            onClick={() => setShowSuccessModal(false)}
                                            className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                                        >
                                            Close and Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type || 'success'}
                onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
        </div>
    );
}
