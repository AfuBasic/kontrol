import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileEdit, Globe, Shield, Trash2, Upload, Users } from 'lucide-react';
import { useRef, useState } from 'react';

import { index, store } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import MarkdownEditor from '@/components/MarkdownEditor';
import AdminLayout from '@/layouts/AdminLayout';
import type { PostAudience, PostStatus } from '@/types';

type FormData = {
    title: string;
    body: string;
    status: PostStatus;
    audience: PostAudience;
    images: File[];
};

const audienceOptions: { value: PostAudience; label: string; description: string; icon: typeof Globe }[] = [
    { value: 'all', label: 'Everyone', description: 'Visible to all residents and security', icon: Globe },
    { value: 'residents', label: 'Residents Only', description: 'Only visible to residents', icon: Users },
    { value: 'security', label: 'Security Only', description: 'Only visible to security personnel', icon: Shield },
];

export default function CreatePost() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        body: '',
        status: 'published',
        audience: 'all',
        images: [],
    });

    function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = [...data.images, ...files].slice(0, 10);
        setData('images', newImages);

        // Generate previews
        const newPreviews: string[] = [];
        newImages.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPreviews.push(e.target?.result as string);
                if (newPreviews.length === newImages.length) {
                    setPreviews([...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function removeImage(index: number) {
        const newImages = data.images.filter((_, i) => i !== index);
        setData('images', newImages);
        setPreviews(previews.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url(), {
            forceFormData: true,
        });
    }

    return (
        <AdminLayout>
            <Head title="Create Post" />

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-6"
            >
                <Link href={index.url()} className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Board
                </Link>
            </motion.div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Create Post</h1>
                <p className="mt-1 text-gray-500">Share an announcement with your estate community.</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="rounded-xl border border-gray-200 bg-white p-6"
                >
                    {/* Title */}
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Give your post a title..."
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    {/* Body */}
                    <div className="mb-6">
                        <label htmlFor="body" className="mb-1 block text-sm font-medium text-gray-700">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <MarkdownEditor
                            id="body"
                            value={data.body}
                            onChange={(value) => setData('body', value)}
                            placeholder="Write your announcement..."
                            title={data.title}
                            error={errors.body}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Use the toolbar for formatting. AI enhancement available after 20 characters.
                        </p>
                    </div>

                    {/* Audience */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            This post is for <span className="text-red-500">*</span>
                        </label>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {audienceOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-all ${
                                        data.audience === option.value
                                            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="audience"
                                        value={option.value}
                                        checked={data.audience === option.value}
                                        onChange={() => setData('audience', option.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`rounded-lg p-2 ${
                                                data.audience === option.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            <option.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p
                                                className={`text-sm font-medium ${
                                                    data.audience === option.value ? 'text-primary-900' : 'text-gray-900'
                                                }`}
                                            >
                                                {option.label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500">{option.description}</p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.audience && <p className="mt-1 text-sm text-red-600">{errors.audience}</p>}
                    </div>

                    {/* Images */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Images <span className="text-gray-400">(optional, max 10)</span>
                        </label>
                        <div className="mt-2">
                            {previews.length > 0 && (
                                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                    {previews.map((preview, idx) => (
                                        <div key={idx} className="group relative">
                                            <img src={preview} alt="" className="h-24 w-full rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleFilesChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={data.images.length >= 10}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Upload className="h-5 w-5" />
                                <span>Click to upload images</span>
                            </button>
                            <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP. Max 5MB each.</p>
                        </div>
                        {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                    </div>

                    {/* Status */}
                    <div className="mb-6">
                        <label className="mb-3 block text-sm font-medium text-gray-700">Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label
                                className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                                    data.status === 'published'
                                        ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    value="published"
                                    checked={data.status === 'published'}
                                    onChange={() => setData('status', 'published')}
                                    className="sr-only"
                                />
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        data.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <Eye className="h-5 w-5" />
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            data.status === 'published' ? 'text-green-900' : 'text-gray-900'
                                        }`}
                                    >
                                        Publish Now
                                    </p>
                                    <p className="text-xs text-gray-500">Visible to your audience</p>
                                </div>
                                {data.status === 'published' && (
                                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500" />
                                )}
                            </label>
                            <label
                                className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                                    data.status === 'draft'
                                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    value="draft"
                                    checked={data.status === 'draft'}
                                    onChange={() => setData('status', 'draft')}
                                    className="sr-only"
                                />
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        data.status === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <FileEdit className="h-5 w-5" />
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            data.status === 'draft' ? 'text-amber-900' : 'text-gray-900'
                                        }`}
                                    >
                                        Save as Draft
                                    </p>
                                    <p className="text-xs text-gray-500">Only you can see this</p>
                                </div>
                                {data.status === 'draft' && (
                                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                            </label>
                        </div>
                        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                    className="mt-6 flex justify-end gap-3"
                >
                    <Link
                        href={index.url()}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : data.status === 'published' ? 'Publish Post' : 'Save Draft'}
                    </button>
                </motion.div>
            </form>
        </AdminLayout>
    );
}
