import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Paperclip, Send, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

import SecurityLayout from '@/Layouts/SecurityLayout';

type Props = {
    categories: Array<{ value: string; label: string }>;
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

export default function Create({ categories }: Props) {
    const { data, setData, processing, errors } = useForm<{
        title: string;
        body: string;
        category: string;
        priority: string;
        attachment: File | null;
        location: string;
    }>({
        title: '',
        body: '',
        category: '',
        priority: 'medium',
        attachment: null,
        location: '',
    });

    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [customError, setCustomError] = useState<string | null>(null);
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
        setUploadingMedia(true);

        try {
            let attachmentUrl = null;
            let attachmentTypeParam = null;
            let attachmentHash = null;

            if (data.attachment) {
                // 1. Hash the file
                attachmentHash = await getFileHash(data.attachment);

                // 2. Check deduplication on server
                const dedupResponse = await fetch('/security/incidents/check-deduplication', {
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
                    const signResponse = await fetch('/security/incidents/signed-upload', {
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
                '/security/incidents',
                {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    attachment_url: attachmentUrl,
                    attachment_type: attachmentTypeParam,
                    attachment_hash: attachmentHash,
                    location: data.location || null,
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
            <Head title="Report Incident — Security Workspace" />

            <div className="flex flex-col gap-5">
                {/* Back Link */}
                <div>
                    <Link
                        href="/security/incidents"
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Workspace
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <div className="mb-5 border-b border-slate-100 pb-3">
                        <h1 className="text-lg font-black tracking-tight text-slate-900">Report Incident</h1>
                        <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">File an official report. Security reports default to private and are visible to estate administrators for dispatching.</p>
                    </div>

                    {customError && (
                        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs font-semibold text-red-700">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                            <span>{customError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Incident Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="e.g. Suspicious vehicle near gate house"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden transition-all"
                                required
                            />
                            {errors.title && <span className="mt-1 block text-xs font-medium text-red-600">{errors.title}</span>}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="body" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Description / Context
                            </label>
                            <textarea
                                id="body"
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                placeholder="Describe the safety threat, property damage, or operational breakdown..."
                                rows={5}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden transition-all"
                                required
                            />
                            {errors.body && <span className="mt-1 block text-xs font-medium text-red-600">{errors.body}</span>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden transition-all"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <span className="mt-1 block text-xs font-medium text-red-600">{errors.category}</span>}
                            </div>

                            {/* Priority */}
                            <div>
                                <label htmlFor="priority" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden transition-all"
                                    required
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                {errors.priority && <span className="mt-1 block text-xs font-medium text-red-600">{errors.priority}</span>}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Property / Location
                            </label>
                            <input
                                id="location"
                                type="text"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                placeholder="e.g. Block C, Visitor Car Park"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden transition-all"
                            />
                            {errors.location && <span className="mt-1 block text-xs font-medium text-red-600">{errors.location}</span>}
                        </div>

                        {/* Attachment upload */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Evidence Attachment (Image or Video)
                            </label>
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center hover:border-slate-800 hover:bg-slate-50/55 transition"
                                >
                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500">Choose file...</span>
                                </button>

                                {attachmentPreview && (
                                    <div className="relative max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                                        {attachmentType === 'image' ? (
                                            <img src={attachmentPreview} alt="Upload preview" className="max-h-48 w-full rounded-lg object-cover" />
                                        ) : (
                                            <video src={attachmentPreview} className="max-h-48 w-full rounded-lg object-cover" controls />
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleRemoveAttachment}
                                            className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-950 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <Link
                                href="/security/incidents"
                                className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || uploadingMedia}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-xs"
                            >
                                {processing || uploadingMedia ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Reporting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3 w-3" />
                                        File Report
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
