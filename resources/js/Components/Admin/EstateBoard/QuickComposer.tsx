import React, { useState, useRef, useCallback } from 'react';
import { useForm, Link } from '@inertiajs/react';
import {
    Send,
    Paperclip,
    Globe,
    Users,
    Shield,
    AlertTriangle,
    AlertOctagon,
    X,
    Sparkles,
    CalendarDays,
    Wrench,
    PartyPopper,
    Megaphone,
    Clock,
    Maximize2,
    Check,
    RotateCcw,
} from 'lucide-react';
import { marked } from 'marked';
import { create, store } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import { useActiveContext } from '@/Hooks/useActiveContext';
import { useEstateBoardAutoDraft } from '@/Hooks/useEstateBoardAutoDraft';
import EstateBoardAiAssistant from '@/Components/Admin/EstateBoardAiAssistant';
import MarkdownEditor from '@/Components/MarkdownEditor';
import type { PostAudience, PostCategory, PostPriority } from '@/types';

type Props = {
    lastBroadcastNote?: string | null;
    onSuccess?: () => void;
    zones?: Array<{ id: number; name: string }>;
};

const CATEGORIES: { value: PostCategory; label: string; icon: React.ElementType }[] = [
    { value: 'general', label: 'General', icon: Megaphone },
    { value: 'meeting', label: 'Meeting', icon: CalendarDays },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'event', label: 'Event', icon: PartyPopper },
];

const AUDIENCES: { value: PostAudience; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'Everyone', icon: Globe },
    { value: 'residents', label: 'Residents Only', icon: Users },
    { value: 'security', label: 'Security Only', icon: Shield },
];

export default function QuickComposer({ lastBroadcastNote, onSuccess, zones = [] }: Props) {
    const { isZoneScoped, zoneId, zoneName } = useActiveContext();
    const { confirm } = useAdminConfirmation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        body: '',
        category: 'general' as PostCategory,
        priority: 'normal' as PostPriority,
        audience: 'all' as PostAudience,
        status: 'published' as const,
        zone_ids: isZoneScoped && zoneId ? [zoneId] : ([] as number[]),
        media: [] as File[],
    });

    const setFormValues = useCallback((draft: any) => {
        setData((prev) => ({
            ...prev,
            ...draft,
        }));
        if (draft.title || draft.body) {
            setIsExpanded(true);
        }
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

    const handleExpand = () => {
        if (!isExpanded) setIsExpanded(true);
    };

    const handleCancel = () => {
        if (isMeaningful) {
            confirm({
                title: 'Discard draft announcement?',
                message: 'Your unsent announcement content will be removed. Are you sure you want to discard it?',
                confirmLabel: 'Discard draft',
                type: 'warning',
                onConfirm: () => {
                    clearDraft();
                    setIsExpanded(false);
                    setShowAiAssistant(false);
                    reset();
                    setFiles([]);
                    clearErrors();
                },
            });
            return;
        }

        setIsExpanded(false);
        setShowAiAssistant(false);
        reset();
        setFiles([]);
        clearErrors();
    };

    const handleAiDraft = useCallback(
        (result: { body: string; suggestedTitle?: string | null }) => {
            setIsExpanded(true);
            const html = marked.parse(result.body) as string;
            setData((prev) => ({
                ...prev,
                body: html,
                title: result.suggestedTitle && !prev.title.trim() ? result.suggestedTitle : prev.title,
            }));
            setShowAiAssistant(false);
        },
        [setData],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const updated = [...files, ...newFiles];
            setFiles(updated);
            setData('media', updated);
        }
    };

    const removeFile = (index: number) => {
        const updated = files.filter((_, i) => i !== index);
        setFiles(updated);
        setData('media', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                clearDraft();
                setIsExpanded(false);
                setShowAiAssistant(false);
                reset();
                setFiles([]);
                if (onSuccess) onSuccess();
            },
        });
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 hover:border-slate-300 sm:p-5">
            {/* Context bar / Last posted note */}
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-900">Post an Announcement</span>

                    {/* Auto-Draft Status Indicator */}
                    {saveStatus === 'saving' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-slate-400" />
                            <span>Saving draft...</span>
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Check className="h-3 w-3" />
                            <span>Draft saved</span>
                        </span>
                    )}
                    {saveStatus === 'restored' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                            <RotateCcw className="h-3 w-3" />
                            <span>Recovered your unsent changes</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {lastBroadcastNote && (
                        <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Last posted: {lastBroadcastNote}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setIsExpanded(true);
                            setShowAiAssistant((prev) => !prev);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                            showAiAssistant
                                ? 'border-violet-300 bg-violet-100 text-violet-800 shadow-2xs'
                                : 'border-violet-200/80 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100'
                        }`}
                        title="Draft announcement with AI"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                        <span>AI Assistant</span>
                    </button>
                </div>
            </div>

            {/* Expandable AI Writing Assistant panel */}
            {showAiAssistant && (
                <div className="mb-4">
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
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {/* Title (visible when expanded or typing) */}
                {isExpanded && (
                    <div>
                        <input
                            type="text"
                            id="announcement-title"
                            name="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Announcement title..."
                            autoComplete="off"
                            className="w-full border-none bg-transparent p-0 text-base font-black tracking-tight text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-hidden dark:text-slate-100 dark:placeholder:text-slate-600"
                        />
                        {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                    </div>
                )}

                {/* Body: MarkdownEditor when expanded, simple input trigger when collapsed */}
                {isExpanded ? (
                    <div>
                        <MarkdownEditor
                            value={data.body}
                            onChange={(content) => setData('body', content)}
                            placeholder="What would you like to broadcast to the estate? Mention upcoming meetings, water maintenance, security notices..."
                            minHeight="min-h-[140px]"
                            compact
                        />
                        {errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body}</p>}
                    </div>
                ) : (
                    <div
                        onClick={handleExpand}
                        className="cursor-text rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-400 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                        What would you like to broadcast to the estate? Click to start writing...
                    </div>
                )}

                {/* File Attachment Previews */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                                <span className="max-w-[120px] truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-slate-400 hover:text-rose-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Bar / Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    {/* Selectors / Quick Toggles */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* Category Dropdown */}
                        <div className="relative">
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value as PostCategory)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Audience Dropdown */}
                        <div className="relative">
                            <select
                                value={data.audience}
                                onChange={(e) => setData('audience', e.target.value as PostAudience)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden"
                            >
                                {AUDIENCES.map((aud) => (
                                    <option key={aud.value} value={aud.value}>
                                        {aud.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Zone Targeting */}
                        {isZoneScoped && zoneName ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200/60">
                                <span>Zone: {zoneName}</span>
                            </span>
                        ) : zones.length > 0 ? (
                            <div className="relative">
                                <select
                                    value={data.zone_ids[0] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? [parseInt(e.target.value, 10)] : [];
                                        setData('zone_ids', val);
                                    }}
                                    className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden"
                                >
                                    <option value="">All Zones</option>
                                    {zones.map((z) => (
                                        <option key={z.id} value={z.id}>
                                            Zone: {z.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {/* Priority Quick Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                const next = data.priority === 'normal' ? 'important' : data.priority === 'important' ? 'critical' : 'normal';
                                setData('priority', next);
                            }}
                            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                                data.priority === 'important'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : data.priority === 'critical'
                                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Cycle Priority: Normal -> Important -> Critical"
                        >
                            {data.priority === 'important' ? (
                                <>
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Important</span>
                                </>
                            ) : data.priority === 'critical' ? (
                                <>
                                    <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                                    <span>Critical</span>
                                </>
                            ) : (
                                <span>Normal Priority</span>
                            )}
                        </button>

                        {/* Attachment Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            title="Attach files or photos"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Attach</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                        />
                    </div>

                    {/* Submit & Cancel Actions */}
                    <div className="flex items-center gap-2">
                        {isExpanded && (
                            <>
                                <Link
                                    href={create.url()}
                                    className="hidden items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    title="Open Full Page Composer"
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    <span>Full Page</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    {isMeaningful ? 'Discard' : 'Cancel'}
                                </button>
                            </>
                        )}
                        <button
                            type="submit"
                            disabled={processing || !data.body.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{processing ? 'Posting...' : 'Post Announcement'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
