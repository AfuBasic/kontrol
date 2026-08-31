import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Eye, FileEdit, RotateCcw, Trash2, Upload } from 'lucide-react';
import { marked } from 'marked';
import { useCallback, useRef, useState, lazy, Suspense } from 'react';

import EstateBoardAiAssistant from '@/Components/Admin/EstateBoardAiAssistant';
import EstateBoardPostPreview from '@/Components/Admin/EstateBoardPostPreview';
import { index, store } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import { useActiveContext } from '@/Hooks/useActiveContext';
import { useEstateBoardAutoDraft } from '@/Hooks/useEstateBoardAutoDraft';
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

export default function CreatePost({ zones }: { zones?: ZoneOption[] }) {
    const safeZones = zones ?? [];
    const { isZoneScoped, zoneId, zoneName } = useActiveContext();
    const { confirm } = useAdminConfirmation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        title: '',
        body: '',
        category: 'general',
        priority: 'normal',
        status: 'published',
        audience: 'all',
        zone_ids: isZoneScoped && zoneId ? [zoneId] : ([] as number[]),
        images: [],
    });

    const setFormValues = useCallback((draft: any) => {
        setData((prev) => ({
            ...prev,
            ...draft,
        }));
    }, [setData]);

    const { saveStatus, hasDraft, clearDraft, isMeaningful } = useEstateBoardAutoDraft({
        formState: {
            title: data.title,
            body: data.body,
            category: data.category,
            priority: data.priority,
            audience: data.audience,
            zone_ids: data.zone_ids,
        },
        setFormValues,
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

    const handleDiscard = () => {
        if (isMeaningful) {
            confirm({
                title: 'Discard draft announcement?',
                message: 'Your unsent announcement content will be removed. Are you sure you want to discard it?',
                confirmLabel: 'Discard draft',
                type: 'warning',
                onConfirm: () => {
                    clearDraft();
                    reset();
                    setPreviews([]);
                },
            });
            return;
        }

        clearDraft();
        reset();
        setPreviews([]);
    };

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url(), {
            forceFormData: true,
            onSuccess: () => {
                clearDraft();
            },
        });
    }

    return (
        <>
            <Head title="Create Post" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-6 flex items-center justify-between"
            >
                <Link href={index.url()} className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Board
                </Link>

                {/* Auto-Draft Status Indicators & Manual Discard */}
                <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-slate-400" />
                            <span>Saving draft...</span>
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                            <span>Draft saved</span>
                        </span>
                    )}
                    {saveStatus === 'restored' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Recovered your unsent changes</span>
                        </span>
                    )}

                    {isMeaningful && (
                        <button
                            type="button"
                            onClick={handleDiscard}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                        >
                            <Trash2 className="h-3 w-3" />
                            <span>Discard draft</span>
                        </button>
                    )}
                </div>
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

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="order-1 space-y-6 xl:order-1">
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
                                    setData((prev) => ({
                                        ...prev,
                                        category,
                                        priority,
                                    }));
                                }}
                                disabled={processing}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div>
                                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter post title..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Content</label>
                                <Suspense
                                    fallback={
                                        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400">
                                            Loading editor...
                                        </div>
                                    }
                                >
                                    <MarkdownEditor
                                        value={data.body}
                                        onChange={(content) => setData('body', content)}
                                        placeholder="Write your announcement content here..."
                                        error={errors.body}
                                    />
                                </Suspense>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <h2 className="mb-4 text-base font-semibold text-gray-900">Live Preview</h2>
                            <EstateBoardPostPreview
                                title={data.title}
                                body={data.body}
                                category={data.category}
                                priority={data.priority}
                                audience={data.audience}
                            />
                        </motion.div>
                    </div>

                    <div className="order-2 xl:order-2">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
                            className="sticky top-6 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <h2 className="text-base font-semibold text-gray-900">Post Settings</h2>

                            {validationErrors.length > 0 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    <p className="font-semibold">Please fix the following:</p>
                                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                                        {validationErrors.map(([key, message]) => (
                                            <li key={key}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {categoryOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('category', opt.value)}
                                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                                data.category === opt.value
                                                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-300'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {priorityOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('priority', opt.value)}
                                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                                data.priority === opt.value
                                                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-300'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Target Audience</label>
                                <div className="space-y-2">
                                    {audienceOptions.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                                data.audience === opt.value
                                                    ? 'border-primary-600 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="audience"
                                                value={opt.value}
                                                checked={data.audience === opt.value}
                                                onChange={() => setData('audience', opt.value)}
                                                className="mt-0.5 text-primary-600 focus:ring-primary-500"
                                            />
                                            <div>
                                                <div className="text-xs font-medium">{opt.label}</div>
                                                <div className="text-xs text-gray-500">{opt.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.audience && <p className="mt-1 text-sm text-red-600">{errors.audience}</p>}
                            </div>

                            {isZoneScoped ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                                        <span>Target Zone</span>
                                    </div>
                                    <p className="mt-1">
                                        This broadcast is automatically targeted to <strong>{zoneName}</strong>.
                                    </p>
                                </div>
                            ) : safeZones.length > 0 ? (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Target Zones (Optional)</label>
                                    <div className="space-y-1.5">
                                        {safeZones.map((zone) => {
                                            const isChecked = data.zone_ids?.includes(zone.id) ?? false;
                                            return (
                                                <label
                                                    key={zone.id}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                                                        isChecked
                                                            ? 'border-primary-500 bg-primary-50 text-primary-900 font-medium'
                                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={zone.id}
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const current = data.zone_ids ?? [];
                                                            const updated = e.target.checked
                                                                ? [...current, zone.id]
                                                                : current.filter((id) => id !== zone.id);
                                                            setData('zone_ids', updated);
                                                        }}
                                                        className="rounded text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span>{zone.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">Leave unselected to target all zones.</p>
                                </div>
                            ) : null}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Images (Max 10)</label>
                                {previews.length > 0 && (
                                    <div className="mb-3 grid grid-cols-2 gap-2">
                                        {previews.map((preview, index) => (
                                            <div key={index} className="group relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
                                    accept="image/*"
                                    multiple
                                    onChange={handleFilesChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={(data.images?.length ?? 0) >= 10}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    Add images
                                </button>
                                {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Publishing Status
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <label
                                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                                            data.status === 'published'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
                                        <Eye className={`h-4 w-4 shrink-0 ${data.status === 'published' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span className="text-xs font-bold">Publish</span>
                                    </label>
                                    <label
                                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                                            data.status === 'draft'
                                                ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
                                        <FileEdit className={`h-4 w-4 shrink-0 ${data.status === 'draft' ? 'text-amber-600' : 'text-slate-400'}`} />
                                        <span className="text-xs font-bold">Draft</span>
                                    </label>
                                </div>
                                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                            </div>

                            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                                <Link
                                    href={index.url()}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 active:scale-95"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
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
