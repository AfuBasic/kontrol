import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, 
    Copy, 
    Link as LinkIcon, 
    Power, 
    RefreshCw, 
    Share2, 
    Trash2, 
    AlertCircle,
    ArrowLeft,
    Clock,
    Users,
    Shield
} from 'lucide-react';
import { useState } from 'react';
import { index as residentsIndex, create as residentsCreate } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import { toggle as inviteLinkToggle, regenerate as inviteLinkRegenerate, destroy as inviteLinkDestroy } from '@/actions/App/Http/Controllers/Admin/InviteLinkController';
import AdminLayout from '@/layouts/AdminLayout';

// Wayfinder actions are used for routing

interface InviteLinkProps {
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
    inviteLink: InviteLinkProps | null;
}

export default function InviteLinkManagement({ inviteLink }: Props) {
    const { auth } = usePage<any>().props;
    const [isCopied, setIsCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleCopyLink = () => {
        if (inviteLink?.url) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(inviteLink.url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = inviteLink.url;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
        }
    };

    const handleShareWhatsApp = () => {
        if (inviteLink?.url) {
            const text = encodeURIComponent(`Hi! You've been invited to join ${auth.user.estate_name} on Kontrol. 🚀\n\nClick the link below to get started: ${inviteLink.url}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleToggleLink = () => {
        router.post(
            inviteLinkToggle.url(),
            {},
            { preserveScroll: true }
        );
    };

    const handleRegenerateLink = () => {
        if (!confirm('Are you sure? This will invalidate the current link and reset its usage count.')) return;
        router.post(
            inviteLinkRegenerate.url(),
            {},
            { preserveScroll: true }
        );
    };

    const handleDeleteLink = () => {
        if (!inviteLink || inviteLink.is_active) return;
        
        setIsDeleting(true);
        router.delete(inviteLinkDestroy.url(), {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteConfirm(false);
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Manage Invite Link" />

            <div className="mx-auto max-w-3xl">
                {/* Header with Back Button */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link 
                            href={residentsIndex.url()}
                            className="group mb-2 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary-600"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Residents
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Invite Link Management</h1>
                        <p className="mt-1 text-gray-500">Configure and monitor your public estate invite link.</p>
                    </div>
                    {!inviteLink && (
                        <Link
                            href={residentsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
                        >
                            <LinkIcon className="h-4 w-4" />
                            Generate New Link
                        </Link>
                    )}
                </div>

                {inviteLink ? (
                    <div className="space-y-6">
                        {/* Main Status & Actions */}
                        <motion.div 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${inviteLink.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                        <LinkIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-900">Active Invite Link</h2>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                inviteLink.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {inviteLink.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">Share this link with anyone you want to invite to the estate.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleToggleLink}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                                            inviteLink.is_active 
                                                ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' 
                                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                    >
                                        <Power className="h-4 w-4" />
                                        {inviteLink.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>

                            {/* Share Field */}
                            <div className="mt-8">
                                <div className="group relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteLink.url}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 pr-36 font-mono text-sm text-gray-600 shadow-inner outline-none transition-all focus:border-primary-300"
                                    />
                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-sm ring-1 ring-gray-200 transition-all ${
                                                isCopied ? 'bg-green-50 text-green-700 ring-green-300' : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                                        title="Share on WhatsApp"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        Share on WhatsApp
                                    </button>
                                    
                                    <button
                                        onClick={handleRegenerateLink}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary-600"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Regenerate Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats & Settings Grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <motion.div 
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Signups</p>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <p className="text-2xl font-bold text-gray-900">{inviteLink.usage_count}</p>
                                    {inviteLink.max_usages && (
                                        <p className="text-sm text-gray-400">/ {inviteLink.max_usages} max</p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approval Mode</p>
                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    {inviteLink.requires_approval ? 'Manual' : 'Automatic'}
                                </p>
                                <p className="text-[10px] text-gray-400">Admin must approve signup</p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expiration</p>
                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    {inviteLink.expires_at ? new Date(inviteLink.expires_at).toLocaleDateString() : 'Never'}
                                </p>
                                <p className="text-[10px] text-gray-400">Link validity status</p>
                            </motion.div>
                        </div>

                        {/* Dangerous Zone */}
                        <motion.div 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border border-red-100 bg-red-50/30 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-red-900">
                                        <AlertCircle className="h-5 w-5" />
                                        Danger Zone
                                    </h3>
                                    <p className="mt-1 text-sm text-red-700">
                                        Deleting the link will permanently disable it. This cannot be undone.
                                    </p>
                                </div>
                                <div className="group relative">
                                    <button
                                        disabled={inviteLink.is_active}
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shrink-0 transition-all ${
                                            inviteLink.is_active 
                                                ? 'cursor-not-allowed bg-gray-200 text-gray-400' 
                                                : 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95'
                                        }`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Link
                                    </button>
                                    {inviteLink.is_active && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                                            Disable link before deleting
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-32 text-center"
                    >
                        <div className="mb-6 rounded-full bg-gray-50 p-6">
                            <LinkIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No Invite Link Found</h3>
                        <p className="mt-2 max-w-sm text-gray-500">
                            You haven't generated a public invite link for your estate yet.
                        </p>
                        <Link
                            href={residentsCreate.url()}
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-200 transition-all hover:bg-primary-700 active:scale-95"
                        >
                            <LinkIcon className="h-4 w-4" />
                            Generate My First Link
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Delete Permanently?</h3>
                            <p className="mt-2 text-gray-500">
                                This action will permanently remove the invite link and its usage statistics. This cannot be undone.
                            </p>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteLink}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Link'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
