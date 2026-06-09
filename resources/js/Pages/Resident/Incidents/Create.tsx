import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Paperclip, Send } from 'lucide-react';
import React, { useRef, useState } from 'react';

import ResidentLayout from '@/Layouts/ResidentLayout';

type Props = {
    categories: Array<{ value: string; label: string }>;
};

export default function Create({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        body: string;
        category: string;
        attachment: File | null;
    }>({
        title: '',
        body: '',
        category: '',
        attachment: null,
    });

    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null);
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/resident/incidents', {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Report Incident" />

            {/* Back Button */}
            <div className="mb-4">
                <Link
                    href="/resident/incidents"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to incidents
                </Link>
            </div>

            {/* Header */}
            <div className="mb-6 px-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Report community incident
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Provide detailed information to help the estate management team resolve the issue.
                </p>
            </div>

            {/* Form Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.category}
                            onChange={e => setData('category', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-bold">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.category}
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Damaged street light on Road 4"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
                            required
                            maxLength={150}
                        />
                        {errors.title && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-bold">
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
                            <span className="text-[10px] font-bold text-slate-400">
                                {data.body.length} / 5000 characters (min 20)
                            </span>
                        </div>
                        <textarea
                            placeholder="Please provide as much context as possible (e.g., location, time of occurrence, impact on estate residents)..."
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            rows={6}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
                            required
                            minLength={20}
                            maxLength={5000}
                        />
                        {errors.body && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-bold">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.body}
                            </p>
                        )}
                    </div>

                    {/* Attachment Upload */}
                    <div>
                        <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                            Attach Photo or Video
                        </label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {!attachmentPreview ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center transition-all hover:bg-slate-50"
                            >
                                <Paperclip className="mb-2 h-6 w-6 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">
                                    Click to upload a file
                                </span>
                                <span className="mt-0.5 text-[10px] text-slate-400">
                                    Images (PNG, JPG, WebP) or Videos (MP4) up to 20MB
                                </span>
                            </button>
                        ) : (
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                {attachmentType === 'image' ? (
                                    <img
                                        src={attachmentPreview}
                                        alt="Attachment preview"
                                        className="max-h-48 rounded-xl object-contain"
                                    />
                                ) : (
                                    <video
                                        src={attachmentPreview}
                                        controls
                                        className="max-h-48 rounded-xl object-contain"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemoveAttachment}
                                    className="absolute top-4 right-4 rounded-full bg-slate-900/60 p-1.5 text-white backdrop-blur-xs hover:bg-slate-900/80 transition-all"
                                >
                                    <span className="text-xs font-bold px-1.5">Remove</span>
                                </button>
                            </div>
                        )}
                        {errors.attachment && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-bold">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.attachment}
                            </p>
                        )}
                    </div>

                    {/* Submit Section */}
                    <div className="border-t border-slate-100 pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing || data.body.length < 20}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            {processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
