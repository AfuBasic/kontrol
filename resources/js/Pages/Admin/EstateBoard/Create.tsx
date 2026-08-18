import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileEdit, MapPin, Trash2, Upload } from 'lucide-react';
import { marked } from 'marked';
import { useCallback, useRef, useState, lazy, Suspense } from 'react';

import EstateBoardAiAssistant from '@/Components/Admin/EstateBoardAiAssistant';
import EstateBoardPostPreview from '@/Components/Admin/EstateBoardPostPreview';
import { index, store } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useActiveContext } from '@/Hooks/useActiveContext';
import { audienceOptions, categoryOptions, priorityOptions } from '@/Lib/estate-board-options';
import type { PostAudience, PostCategory, PostPriority, PostStatus } from '@/types';

const MarkdownEditor = lazy(() => import('@/Components/MarkdownEditor'));

type ZoneOption = {
    id: number;
    name: string;
};

type FormData = {
    title: string;
    body: string;
    category: PostCategory;
    priority: PostPriority;
    status: PostStatus;
    audience: PostAudience;
    zone_ids: number[];
    images: File[];
};

export default function CreatePost({ zones = [] }: { zones?: ZoneOption[] }) {
    const { isZoneScoped, zoneId, zoneName } = useActiveContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        body: '',
        category: 'general',
        priority: 'normal',
        status: 'published',
        audience: 'all',
        zone_ids: isZoneScoped && zoneId ? [zoneId] : ([] as number[]),
        images: [],
    });

    const validationErrors = Object.entries(errors).filter(([, message]) => Boolean(message));

    const handleAiDraft = useCallback(
        (result: { body: string; suggestedTitle?: string | null }) => {
            const html = marked.parse(result.body) as string;
            setData('body', html);

            if (result.suggestedTitle && !data.title.trim()) {
                setData('title', result.suggestedTitle);
            }
        },
        [data.title, setData],
    );

    function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
            return;
        }

        const newImages = [...data.images, ...files].slice(0, 10);
        setData('images', newImages);

        const newPreviews: string[] = [];
        newImages.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                newPreviews.push(event.target?.result as string);
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
        <>
            <Head title="Create Post" />

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

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Create Announcement</h1>
                <p className="mt-1 max-w-2xl text-gray-500">Start with a short brief or template, generate a draft, refine it, then publish.</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="order-2 space-y-6 xl:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        >
                            <EstateBoardAiAssistant
                                context={{
                                    title: data.title,
                                    category: data.category,
                                    priority: data.priority,
                                    audience: data.audience,
                                }}
                                onDraft={handleAiDraft}
                                onTemplateSelect={({ category, priority }) => {
                                    setData({
                                        category,
                                        priority,
                                    });
                                }}
                                disabled={processing}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            {validationErrors.length > 0 && (
                                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-sm font-medium text-red-800">Please fix the following before publishing:</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                                        {validationErrors.map(([field, message]) => (
                                            <li key={field}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Title <span className="text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Give your announcement a clear title..."
                                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            </div>

                            <div>
                                <label htmlFor="body" className="mb-1 block text-sm font-medium text-gray-700">
                                    Content <span className="text-red-500">*</span>
                                </label>
                                <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
                                    <MarkdownEditor
                                        id="body"
                                        value={data.body}
                                        onChange={(value) => setData('body', value)}
                                        placeholder="Generate a draft above, or write your announcement here..."
                                        error={errors.body}
                                    />
                                </Suspense>
                            </div>
                        </motion.div>
                    </div>

                    <div className="order-1 space-y-6 xl:sticky xl:top-6 xl:order-2 xl:self-start">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
                        >
                            <EstateBoardPostPreview
                                title={data.title}
                                body={data.body}
                                category={data.category}
                                priority={data.priority}
                                audience={data.audience}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
                            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Publish settings</h2>
                                <p className="mt-0.5 text-xs text-gray-500">Set these first - they guide the AI draft and preview.</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categoryOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                                                data.category === option.value
                                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                value={option.value}
                                                checked={data.category === option.value}
                                                onChange={() => setData('category', option.value)}
                                                className="sr-only"
                                            />
                                            <option.icon className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-medium text-gray-800">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">Priority</label>
                                <div className="space-y-2">
                                    {priorityOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                                                data.priority === option.value
                                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={option.value}
                                                checked={data.priority === option.value}
                                                onChange={() => setData('priority', option.value)}
                                                className="sr-only"
                                            />
                                            <option.icon className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{option.label}</p>
                                                <p className="text-[11px] text-gray-500">{option.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
                            </div>

                            {isZoneScoped ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Posting to</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        {zoneName ?? zones[0]?.name ?? 'Your zone'}
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-500">Zone-scoped accounts can only announce to their assigned zone.</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">Audience</label>
                                        <div className="space-y-2">
                                            {audienceOptions.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
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
                                                    <option.icon className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-900">{option.label}</p>
                                                        <p className="text-[11px] text-gray-500">{option.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.audience && <p className="mt-1 text-sm text-red-600">{errors.audience}</p>}
                                    </div>

                                    {zones.length > 0 && (
                                        <div>
                                            <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                Zone targeting
                                            </label>
                                            <p className="mb-3 text-[11px] text-gray-500">
                                                Leave empty to reach the entire estate. Select zones to notify only residents in those areas.
                                            </p>
                                            <div className="space-y-2">
                                                {zones.map((zone) => {
                                                    const selected = data.zone_ids.includes(zone.id);
                                                    return (
                                                        <label
                                                            key={zone.id}
                                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                                                                selected
                                                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                                    : 'border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                onChange={() => {
                                                                    setData(
                                                                        'zone_ids',
                                                                        selected
                                                                            ? data.zone_ids.filter((id) => id !== zone.id)
                                                                            : [...data.zone_ids, zone.id],
                                                                    );
                                                                }}
                                                                className="rounded border-gray-300 text-primary-600 focus:ring-slate-900"
                                                            />
                                                            <MapPin className="h-4 w-4 text-gray-500" />
                                                            <span className="text-xs font-medium text-gray-900">{zone.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {errors.zone_ids && <p className="mt-1 text-sm text-red-600">{errors.zone_ids}</p>}
                                        </div>
                                    )}
                                </>
                            )}

                            <div>
                                <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">Images</label>
                                {previews.length > 0 && (
                                    <div className="mb-3 grid grid-cols-2 gap-2">
                                        {previews.map((preview, idx) => (
                                            <div key={idx} className="group relative">
                                                <img src={preview} alt="" className="h-20 w-full rounded-lg object-cover" />
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
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    Add images
                                </button>
                                {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase">Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label
                                        className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-all ${
                                            data.status === 'published' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
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
                                        <Eye className="h-4 w-4 text-green-600" />
                                        <span className="mt-2 text-xs font-semibold text-gray-900">Publish</span>
                                    </label>
                                    <label
                                        className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-all ${
                                            data.status === 'draft' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
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
                                        <FileEdit className="h-4 w-4 text-amber-600" />
                                        <span className="mt-2 text-xs font-semibold text-gray-900">Draft</span>
                                    </label>
                                </div>
                                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                            </div>

                            <div className="flex gap-2 border-t border-gray-100 pt-4">
                                <Link
                                    href={index.url()}
                                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : data.status === 'published' ? 'Publish' : 'Save draft'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </form>
        </>
    );
}
