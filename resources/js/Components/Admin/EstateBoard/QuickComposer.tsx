import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    Globe,
    Users,
    Shield,
    Pin,
    AlertTriangle,
    AlertOctagon,
    X,
    Sparkles,
    CalendarDays,
    Wrench,
    PartyPopper,
    Megaphone,
    Clock,
} from 'lucide-react';
import { store } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
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

const PRIORITIES: { value: PostPriority; label: string; badge: string; icon: React.ElementType }[] = [
    { value: 'normal', label: 'Normal', badge: 'bg-slate-100 text-slate-700', icon: Megaphone },
    { value: 'important', label: 'Important', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    { value: 'critical', label: 'Critical', badge: 'bg-rose-100 text-rose-700', icon: AlertOctagon },
];

export default function QuickComposer({ lastBroadcastNote, onSuccess, zones = [] }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        body: '',
        category: 'general' as PostCategory,
        priority: 'normal' as PostPriority,
        audience: 'all' as PostAudience,
        status: 'published' as const,
        zone_ids: [] as number[],
        media: [] as File[],
    });

    const handleExpand = () => {
        if (!isExpanded) setIsExpanded(true);
    };

    const handleCancel = () => {
        setIsExpanded(false);
        reset();
        setFiles([]);
        clearErrors();
    };

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
                setIsExpanded(false);
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
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-900">Post an Announcement</span>
                </div>
                {lastBroadcastNote && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last posted: {lastBroadcastNote}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title (visible when expanded or typing) */}
                {isExpanded && (
                    <div>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Announcement title..."
                            className="w-full border-none bg-transparent p-0 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-0"
                        />
                        {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                    </div>
                )}

                {/* Body input / Trigger box */}
                <div>
                    <textarea
                        value={data.body}
                        onFocus={handleExpand}
                        onChange={(e) => setData('body', e.target.value)}
                        placeholder="Share an announcement with your estate..."
                        rows={isExpanded ? 3 : 2}
                        className="w-full resize-none border-none bg-transparent p-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-0"
                    />
                    {errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body}</p>}
                </div>

                {/* Selected file preview chips */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                                {file.type.startsWith('image/') ? (
                                    <ImageIcon className="h-3.5 w-3.5 text-primary-500" />
                                ) : (
                                    <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                                )}
                                <span className="max-w-[140px] truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="ml-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Audience Selector */}
                        <div className="relative">
                            <select
                                value={data.audience}
                                onChange={(e) => setData('audience', e.target.value as PostAudience)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden"
                            >
                                {AUDIENCES.map((aud) => (
                                    <option key={aud.value} value={aud.value}>
                                        Audience: {aud.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {zones.length > 0 && (
                            <div className="relative">
                                <select
                                    value={data.zone_ids[0] ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setData('zone_ids', value ? [Number(value)] : []);
                                    }}
                                    className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden"
                                >
                                    <option value="">Entire Estate</option>
                                    {zones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            Zone: {zone.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Category Selector (Pills when expanded, dropdown when compact) */}
                        <div className="relative">
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value as PostCategory)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:border-primary-500 focus:outline-hidden capitalize"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        Category: {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                const nextPriority: Record<PostPriority, PostPriority> = {
                                    normal: 'important',
                                    important: 'critical',
                                    critical: 'normal',
                                };
                                setData('priority', nextPriority[data.priority]);
                            }}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                                data.priority === 'important'
                                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : data.priority === 'critical'
                                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Toggle Post Priority"
                        >
                            {data.priority === 'important' ? (
                                <>
                                    <Pin className="h-3.5 w-3.5 text-amber-600" />
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
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
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
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing || !data.body.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary-600/30 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
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
