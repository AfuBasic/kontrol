import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Paperclip, Send, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

type Props = {
    categories: Array<{ value: string; label: string }>;
    admins: Array<{ id: number; name: string }>;
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

export default function AdminIncidentCreate({ categories, admins }: Props) {
    const { data, setData, processing, errors } = useForm<{
        title: string;
        body: string;
        category: string;
        priority: string;
        attachment: File | null;
        location: string;
        assigned_to: string;
        is_private: boolean;
    }>({
        title: '',
        body: '',
        category: '',
        priority: 'medium',
        attachment: null,
        location: '',
        assigned_to: '',
        is_private: false,
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
                const dedupResponse = await fetch('/admin/incidents/check-deduplication', {
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
                    const signResponse = await fetch('/admin/incidents/signed-upload', {
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
                '/admin/incidents',
                {
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    priority: data.priority,
                    attachment_url: attachmentUrl,
                    attachment_type: attachmentTypeParam,
                    attachment_hash: attachmentHash,
                    location: data.location || null,
                    assigned_to: data.assigned_to || null,
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
            <Head title="Report Incident — Admin Workspace" />

            {/* Back Button */}
            <div className="mb-6">
                <Link 
                    href="/admin/incidents" 
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Incidents
                </Link>
            </div>

            {customError && (
                <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{customError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* LEFT TWO COLUMNS: Form Fields */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs ring-1 ring-slate-100/50">
                        <div className="mb-6 border-b border-slate-50 pb-4">
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Create Incident Report</h1>
                            <p className="text-xs font-semibold text-slate-400">File a new community incident report, track resolving status, and assign it to estate security guards or staff.</p>
                        </div>

                        <div className="space-y-5">
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
                                    placeholder="e.g. Broken water main, Main entrance guard house intrusion"
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
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
                                    placeholder="Provide full description of the operational issue, safety threat, or maintenance request..."
                                    rows={6}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                                    required
                                />
                                {errors.body && <span className="mt-1 block text-xs font-medium text-red-600">{errors.body}</span>}
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
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
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
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

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                        placeholder="e.g. Block A, Unit 12, Main Gate"
                                        className="w-full rounded-xl border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {errors.location && <span className="mt-1 block text-xs font-medium text-red-600">{errors.location}</span>}
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label htmlFor="assigned_to" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Assign To (Optional)
                                    </label>
                                    <select
                                        id="assigned_to"
                                        value={data.assigned_to}
                                        onChange={(e) => setData('assigned_to', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                    >
                                        <option value="">Unassigned</option>
                                        {admins.map((adm) => (
                                            <option key={adm.id} value={adm.id}>
                                                {adm.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_to && <span className="mt-1 block text-xs font-medium text-red-600">{errors.assigned_to}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-5">
                            <Link
                                href="/admin/incidents"
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
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Metadata & Uploads */}
                <div className="space-y-6">
                    {/* Attachment Upload Card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50 space-y-4">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Evidence / Attachments</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Attach photo or video evidence to justify the resolution priority.</p>
                        </div>
                        
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
                                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center hover:border-slate-800 hover:bg-slate-50/50 transition"
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

                    {/* Visibility Settings Card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Privacy & Visibility</h3>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-900">Internal Only</label>
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block leading-normal">Keep this report hidden from residents, making it visible only to estate administrators and security staff.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.is_private}
                                    onChange={(e) => setData('is_private', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded-sm border-slate-350 text-slate-950 focus:ring-slate-950 mt-0.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Guidelines Card */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 shadow-xs">
                        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Operational Guidelines</h3>
                        <ul className="mt-3 space-y-2 text-[10.5px] font-semibold text-slate-655 leading-relaxed">
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-600 mt-0.5">•</span>
                                <span>High and Critical priority issues automatically trigger SLA tracking timers (24 hours standard).</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-600 mt-0.5">•</span>
                                <span>Internal Only incidents are completely hidden from the resident-facing home screen feed.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-600 mt-0.5">•</span>
                                <span>Assigned staff will receive automatic mobile notifications to report on-site.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </form>
        </>
    );
}
