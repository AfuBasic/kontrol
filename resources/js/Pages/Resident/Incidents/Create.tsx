import React, { useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Camera,
    CheckCircle2,
    Eye,
    EyeOff,
    MapPin,
    Send,
    Trash2,
} from 'lucide-react';
import { CATEGORY_CONFIG, normalizeCategoryKey } from '@/Components/Incidents/IncidentCategoryLabel';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncEngine } from '@/Resilience/SyncEngine';
import { SyncStatus } from '@/Resilience/SyncStatus';

interface Props {
    categories: Array<{ value: string; label: string }>;
    requirePhotoEvidence?: boolean;
}

async function getFileHash(file: File): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch {
            // Fallback
        }
    }
    return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function Create({ categories, requirePhotoEvidence = false }: Props) {
    const [step, setStep] = useState<'category' | 'details'>('category');

    const { data, setData, processing, errors } = useForm<{
        title: string;
        body: string;
        category: string;
        priority: string;
        attachment: File | null;
        location: string;
        is_private: boolean;
    }>({
        title: '',
        body: '',
        category: '',
        priority: 'medium',
        attachment: null,
        location: '',
        is_private: false,
    });

    const { isOnline, isServerReachable } = useNetworkQuality();
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [customError, setCustomError] = useState<string | null>(null);
    const [offlineSaved, setOfflineSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSelectCategory = (catValue: string) => {
        setData('category', catValue);
        setStep('details');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('attachment', file);
            setAttachmentType(file.type.startsWith('image/') ? 'image' : 'video');

            const reader = new FileReader();
            reader.onload = () => {
                setAttachmentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAttachment = () => {
        setData('attachment', null);
        setAttachmentPreview(null);
        setAttachmentType(null);
        setCustomError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCustomError(null);
        setOfflineSaved(false);

        const online = isOnline && (await isServerReachable(2500));

        // If offline
        if (!online) {
            if (data.attachment) {
                setCustomError(
                    'Photo/video attachments require an active internet connection. Remove the attachment to submit offline, or reconnect.'
                );
                return;
            }

            if (!data.title.trim() || !data.body.trim() || !data.category) {
                setCustomError('Title, description, and category are required.');
                return;
            }

            setUploadingMedia(true);
            try {
                const tempId = `incident-offline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const offlinePayload = {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    location: data.location || undefined,
                    is_private: data.is_private,
                };

                await ResidentStore.putPendingIncident({
                    id: tempId,
                    payload: offlinePayload,
                    status: SyncStatus.Pending,
                    createdAt: new Date().toISOString(),
                    title: data.title,
                    category: data.category,
                });

                await SyncEngine.enqueue({
                    type: 'CREATE_INCIDENT',
                    endpoint: '/resident/incidents',
                    method: 'POST',
                    payload: offlinePayload,
                });

                setOfflineSaved(true);
                setTimeout(() => {
                    router.visit('/resident/incidents');
                }, 1500);
            } catch (err: any) {
                setCustomError(err?.message || 'Failed to save offline incident report.');
            } finally {
                setUploadingMedia(false);
            }
            return;
        }

        // Online flow with signed upload if attachment exists
        if (data.attachment) {
            setUploadingMedia(true);
            try {
                const file = data.attachment;
                const fileHash = await getFileHash(file);

                const dedupRes = await fetch(
                    `/resident/incidents/check-deduplication?hash=${encodeURIComponent(fileHash)}`
                );
                const dedupData = await dedupRes.json();

                let secureUrl = dedupData.attachment_url;

                if (!dedupData.exists) {
                    const signatureRes = await fetch('/resident/incidents/signed-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN':
                                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                                    ?.content || '',
                        },
                        body: JSON.stringify({
                            folder: 'incidents',
                            resource_type: attachmentType === 'video' ? 'video' : 'image',
                        }),
                    });

                    if (!signatureRes.ok) {
                        throw new Error('Failed to generate upload authorization signature.');
                    }

                    const signData = await signatureRes.json();
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('api_key', signData.api_key);
                    formData.append('timestamp', signData.timestamp.toString());
                    formData.append('signature', signData.signature);
                    formData.append('folder', signData.folder);

                    const uploadRes = await fetch(
                        `https://api.cloudinary.com/v1_1/${signData.cloud_name}/${signData.resource_type || 'image'}/upload`,
                        {
                            method: 'POST',
                            body: formData,
                        }
                    );

                    if (!uploadRes.ok) {
                        throw new Error('Failed to upload media file. Please try again.');
                    }

                    const uploadData = await uploadRes.json();
                    secureUrl = uploadData.secure_url;
                }

                router.post(
                    '/resident/incidents',
                    {
                        title: data.title,
                        body: data.body,
                        category: data.category,
                        priority: data.priority,
                        location: data.location || undefined,
                        is_private: data.is_private,
                        attachment_url: secureUrl,
                        attachment_type: attachmentType,
                        attachment_hash: fileHash,
                    },
                    {
                        onFinish: () => setUploadingMedia(false),
                    }
                );
            } catch (err: any) {
                setCustomError(err.message || 'An error occurred during file upload.');
                setUploadingMedia(false);
            }
        } else {
            router.post(
                '/resident/incidents',
                {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    location: data.location || undefined,
                    is_private: data.is_private,
                },
                {
                    onFinish: () => setUploadingMedia(false),
                }
            );
        }
    };

    const selectedCategoryKey = normalizeCategoryKey(data.category);
    const selectedCategoryConfig = CATEGORY_CONFIG[selectedCategoryKey];

    return (
        <>
            <Head title="Report an Incident - Kontrol" />

            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
                {/* Header with Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/resident/incidents"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Incidents</span>
                    </Link>

                    {step === 'details' && (
                        <button
                            type="button"
                            onClick={() => setStep('category')}
                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            Change Category
                        </button>
                    )}
                </div>

                {/* Offline Success Banner */}
                {offlineSaved && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <p className="text-sm font-bold">Report Saved Offline</p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    Your report has been queued and will automatically submit when online.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Error Banner */}
                {customError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">{customError}</p>
                        </div>
                    </div>
                )}

                {/* STEP 1: Category Picker */}
                {step === 'category' ? (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                                What happened?
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Select the category that best describes the issue or maintenance request.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.map((cat) => {
                                const key = normalizeCategoryKey(cat.value);
                                const config = CATEGORY_CONFIG[key];
                                const Icon = config.icon;
                                const isSelected = data.category === cat.value;

                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => handleSelectCategory(cat.value)}
                                        className={`group flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all hover:border-indigo-400 hover:shadow-md ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${config.bg} ${config.text}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                {config.label}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Tap to report
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* STEP 2: Incident Form Details */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selected Category Pill */}
                        <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30">
                            <div className="flex items-center gap-2.5">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedCategoryConfig.bg} ${selectedCategoryConfig.text}`}>
                                    <selectedCategoryConfig.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                        Category Selected
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {selectedCategoryConfig.label}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep('category')}
                                className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Change
                            </button>
                        </div>

                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
                            {/* Incident Title */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Incident Summary / Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Streetlight flickering at Gate 2 entrance"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                />
                                {errors.title && (
                                    <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.title}</p>
                                )}
                            </div>

                            {/* Description Body */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Detailed Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    placeholder="Please provide full details so estate personnel or security can address it quickly..."
                                    rows={4}
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                />
                                {errors.body && (
                                    <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.body}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Location / Landmark (Optional)
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="e.g. Block C near children playground"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Photo / Media Attachment */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Photo or Video Evidence {requirePhotoEvidence && <span className="text-rose-500">*</span>}
                                </label>

                                {attachmentPreview ? (
                                    <div className="relative inline-block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                                        <img
                                            src={attachmentPreview}
                                            alt="Preview"
                                            className="h-44 w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveAttachment}
                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-950/40"
                                    >
                                        <Camera className="w-6 h-6 text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Tap to take a photo or choose an image
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            JPG, PNG, WebP or MP4 up to 15MB
                                        </p>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Privacy Toggle */}
                            <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    {data.is_private ? (
                                        <EyeOff className="w-4 h-4 text-amber-600 mt-0.5" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-slate-400 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            Private Report (Estate Admin & Security Only)
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {data.is_private
                                                ? 'Only management will see this report.'
                                                : 'Visible to neighbors in your estate feed for safety awareness.'}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.is_private}
                                    onChange={(e) => setData('is_private', e.target.checked)}
                                    className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('category')}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || uploadingMedia}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>
                                        {uploadingMedia
                                            ? 'Uploading Evidence...'
                                            : processing
                                            ? 'Submitting...'
                                            : 'Submit Report'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
