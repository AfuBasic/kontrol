import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Paperclip, Send, WifiOff } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncEngine } from '@/Resilience/SyncEngine';
import { SyncStatus } from '@/Resilience/SyncStatus';

type Props = {
    categories: Array<{ value: string; label: string }>;
    requirePhotoEvidence?: boolean;
};

async function getFileHash(file: File): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            // Fall back to metadata hash
        }
    }
    return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function Create({ categories, requirePhotoEvidence = false }: Props) {
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

        // Attachments require online upload (Cloudinary). Text-only reports can queue offline.
        if (!online) {
            if (data.attachment) {
                setCustomError('Photo/video attachments require an internet connection. Remove the attachment to submit offline, or reconnect.');
                return;
            }

            if (!data.title.trim() || !data.body.trim() || !data.category) {
                setCustomError('Title, description, and category are required.');
                return;
            }

            setUploadingMedia(true);
            try {
                const payload = {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    attachment_url: null,
                    attachment_type: null,
                    attachment_hash: null,
                    location: data.location || null,
                    is_private: data.is_private,
                    submitted_offline: true,
                    client_created_at: new Date().toISOString(),
                };

                const operationId = await SyncEngine.enqueue({
                    type: 'incident_report',
                    endpoint: '/resident/incidents',
                    method: 'POST',
                    payload,
                    retryPolicyKey: 'incident_report',
                });

                await ResidentStore.putPendingIncident({
                    id: operationId,
                    payload,
                    status: SyncStatus.Pending,
                    createdAt: new Date().toISOString(),
                    title: data.title,
                    category: data.category,
                });

                setOfflineSaved(true);
            } catch (error: any) {
                setCustomError(error?.message || 'Could not save this report offline. Please try again.');
            } finally {
                setUploadingMedia(false);
            }
            return;
        }

        setUploadingMedia(true);

        try {
            let attachmentUrl = null;
            let attachmentTypeParam = null;
            let attachmentHash = null;

            if (data.attachment) {
                // 1. Hash the file
                attachmentHash = await getFileHash(data.attachment);

                // 2. Check deduplication on server
                const dedupResponse = await fetch('/resident/incidents/check-deduplication', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({ hash: attachmentHash }),
                });

                if (!dedupResponse.ok) {
                    throw new Error('Deduplication check failed');
                }

                const dedupResult = await dedupResponse.json();

                if (dedupResult.exists) {
                    attachmentUrl = dedupResult.url;
                    attachmentTypeParam = dedupResult.type;
                } else {
                    // 3. Request signed upload parameters
                    const resourceType = data.attachment.type.startsWith('image/') ? 'image' : 'video';
                    const signResponse = await fetch('/resident/incidents/signed-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        },
                        body: JSON.stringify({ resource_type: resourceType }),
                    });

                    if (!signResponse.ok) {
                        throw new Error('Failed to generate upload signature');
                    }

                    const signData = await signResponse.json();

                    // 4. Upload to Cloudinary
                    const formData = new FormData();
                    formData.append('file', data.attachment);
                    formData.append('api_key', signData.api_key);
                    formData.append('timestamp', signData.timestamp.toString());
                    formData.append('signature', signData.signature);
                    formData.append('folder', signData.folder);

                    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloud_name}/${resourceType}/upload`;
                    const uploadResponse = await fetch(cloudinaryUrl, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Direct file upload to storage failed');
                    }

                    const uploadResult = await uploadResponse.json();
                    attachmentUrl = uploadResult.secure_url;
                    attachmentTypeParam = resourceType;
                }
            }

            // 5. Submit the incident details to the server
            router.post(
                '/resident/incidents',
                {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    attachment_url: attachmentUrl,
                    attachment_type: attachmentTypeParam,
                    attachment_hash: attachmentHash,
                    location: data.location || null,
                    is_private: data.is_private,
                },
                {
                    onFinish: () => setUploadingMedia(false),
                },
            );
        } catch (error: any) {
            setUploadingMedia(false);
            setCustomError(error.message || 'An error occurred while uploading the file.');
        }
    };

    return (
        <>
            <Head title="Report Incident" />

            {/* Back Button */}
            <div className="mb-4">
                <Link href="/resident/incidents" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="h-4 w-4" />
                    Back to incidents
                </Link>
            </div>

            {/* Header */}
            <div className="mb-6 px-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Report community incident</h1>
                <p className="mt-1 text-sm text-slate-500">Provide detailed information to help the estate management team resolve the issue.</p>
            </div>

            {!isOnline && (
                <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-xs leading-relaxed font-semibold">
                        You&apos;re offline. Text-only reports can be saved locally and will submit when you reconnect. Attachments require internet.
                    </p>
                </div>
            )}

            {offlineSaved && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <p className="text-xs font-bold">Your report has been saved locally</p>
                    <p className="mt-1 text-xs font-medium text-emerald-800/90">It will be submitted automatically when you&apos;re back online.</p>
                    <Link href="/resident/incidents" className="mt-2 inline-block text-xs font-black text-emerald-800 underline">
                        Back to incidents
                    </Link>
                </div>
            )}

            {/* Form Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Category Selection */}
                    <div>
                        <label className="mb-2 block text-xs font-black tracking-wider text-slate-400 uppercase">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.category}
                            </p>
                        )}
                    </div>

                    {/* Priority Selection */}
                    <div>
                        <label className="mb-2 block text-xs font-black tracking-wider text-slate-400 uppercase">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.priority}
                            onChange={(e) => setData('priority', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                            required
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        {errors.priority && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.priority}
                            </p>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="mb-2 block text-xs font-black tracking-wider text-slate-400 uppercase">Location</label>
                        <input
                            type="text"
                            placeholder="e.g., Near the gatehouse, Road 4"
                            value={data.location}
                            onChange={(e) => setData('location', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                            maxLength={255}
                        />
                        {errors.location && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.location}
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-xs font-black tracking-wider text-slate-400 uppercase">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">{data.title.length} / 150 characters</span>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g., Damaged street light on Road 4"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                            required
                            maxLength={150}
                        />
                        {errors.title && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-xs font-black tracking-wider text-slate-400 uppercase">
                                Details <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">{data.body.length} / 5000 characters (min 20)</span>
                        </div>
                        <textarea
                            placeholder="Please provide as much context as possible (e.g., location, time of occurrence, impact on estate residents)..."
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            rows={6}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                            required
                            minLength={20}
                            maxLength={5000}
                        />
                        {errors.body && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.body}
                            </p>
                        )}
                    </div>

                    {/* Attachment Upload */}
                    <div>
                        <label className="mb-2 block text-xs font-black tracking-wider text-slate-400 uppercase">
                            Attach Photo or Video {requirePhotoEvidence && <span className="text-red-500">* (Mandatory by Estate Policy)</span>}
                        </label>
                        <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                        {!attachmentPreview ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center transition-all hover:bg-slate-50"
                            >
                                <Paperclip className="mb-2 h-6 w-6 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">Click to upload a file</span>
                                <span className="mt-0.5 text-[10px] text-slate-400">Images (PNG, JPG, WebP) or Videos (MP4) up to 20MB</span>
                            </button>
                        ) : (
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                {attachmentType === 'image' ? (
                                    <img src={attachmentPreview} alt="Attachment preview" className="max-h-48 rounded-xl object-contain" />
                                ) : (
                                    <video src={attachmentPreview} controls className="max-h-48 rounded-xl object-contain" />
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemoveAttachment}
                                    className="absolute top-4 right-4 rounded-full bg-slate-900/60 p-1.5 text-white backdrop-blur-xs transition-all hover:bg-slate-900/80"
                                >
                                    <span className="px-1.5 text-xs font-bold">Remove</span>
                                </button>
                            </div>
                        )}
                        {errors.attachment && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.attachment}
                            </p>
                        )}
                        {customError && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {customError}
                            </p>
                        )}
                    </div>

                    {/* Privacy Option */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <label htmlFor="is_private" className="block cursor-pointer text-sm font-bold text-slate-700">
                                    Mark as Private Incident
                                </label>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    If enabled, this incident will only be visible to you and the estate administration. It won't appear in the public
                                    feed for other residents.
                                </p>
                            </div>
                            {/* Custom Toggle Switch */}
                            <button
                                type="button"
                                id="is_private"
                                role="switch"
                                aria-checked={data.is_private}
                                onClick={() => setData('is_private', !data.is_private)}
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
                                    data.is_private ? 'bg-indigo-600' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                        data.is_private ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="flex justify-end border-t border-slate-100 pt-4">
                        <button
                            type="submit"
                            disabled={processing || uploadingMedia || offlineSaved || data.body.length < 20}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            {uploadingMedia ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    {isOnline ? 'Uploading...' : 'Saving offline…'}
                                </>
                            ) : processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Submitting...
                                </>
                            ) : offlineSaved ? (
                                <>
                                    <Send className="h-4 w-4" />
                                    Saved offline
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    {isOnline ? 'Submit Report' : 'Save Offline'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
