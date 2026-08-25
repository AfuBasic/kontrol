import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import type { Megaphone } from 'lucide-react';
import { CalendarDays, PartyPopper, Shield, Sparkles, Wrench } from 'lucide-react';
import { useCallback, useState } from 'react';

import ContentEnhanceController from '@/actions/App/Http/Controllers/Api/ContentEnhanceController';
import type { PostAudience, PostCategory, PostPriority } from '@/types';

type AiContext = {
    title: string;
    category: PostCategory;
    priority: PostPriority;
    audience: PostAudience;
};

type DraftResult = {
    body: string;
    suggestedTitle?: string | null;
};

type Props = {
    context: AiContext;
    onDraft: (result: DraftResult) => void;
    onTemplateSelect?: (template: Pick<Template, 'category' | 'priority'>) => void;
    disabled?: boolean;
};

type Template = {
    id: string;
    label: string;
    icon: typeof Megaphone;
    category: PostCategory;
    priority: PostPriority;
    brief: string;
};

const templates: Template[] = [
    {
        id: 'maintenance',
        label: 'Maintenance',
        icon: Wrench,
        category: 'maintenance',
        priority: 'important',
        brief: 'Scheduled maintenance affecting water or power. Include the date, time window, and what residents should prepare for.',
    },
    {
        id: 'meeting',
        label: 'Meeting',
        icon: CalendarDays,
        category: 'meeting',
        priority: 'normal',
        brief: 'Residents association meeting with agenda highlights, date, time, and venue.',
    },
    {
        id: 'security',
        label: 'Security',
        icon: Shield,
        category: 'security',
        priority: 'important',
        brief: 'Security notice reminding residents about access control, visitor protocols, or a recent incident.',
    },
    {
        id: 'event',
        label: 'Event',
        icon: PartyPopper,
        category: 'event',
        priority: 'normal',
        brief: 'Upcoming community event with what it is, who can attend, and how to participate.',
    },
];

export default function EstateBoardAiAssistant({ context, onDraft, onTemplateSelect, disabled = false }: Props) {
    const [brief, setBrief] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

    const canGenerate = brief.trim().length >= 10 && !disabled;

    const handleGenerate = useCallback(async () => {
        if (!canGenerate || isGenerating) {
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await axios.post(ContentEnhanceController.url(), {
                mode: 'draft',
                brief: brief.trim(),
                title: context.title || null,
                category: context.category,
                priority: context.priority,
                audience: context.audience,
                type: 'estate_board',
            });

            const data = response.data;

            if (data.success && data.enhanced) {
                onDraft({
                    body: data.enhanced,
                    suggestedTitle: data.suggested_title,
                });
            } else {
                setError(data.message || 'Failed to generate draft. Please try again.');
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to connect. Please try again.';
            setError(message);
        } finally {
            setIsGenerating(false);
        }
    }, [brief, canGenerate, context, isGenerating, onDraft]);

    function applyTemplate(template: Template) {
        setActiveTemplate(template.id);
        setBrief(template.brief);
        setError(null);
        onTemplateSelect?.({
            category: template.category,
            priority: template.priority,
        });
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-linear-to-br from-violet-50 via-white to-purple-50 shadow-sm">
            <div className="border-b border-violet-100/80 px-5 py-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-purple-600 text-white shadow-sm">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">AI Writing Assistant</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Describe your announcement in plain language and AI will draft a polished post for you.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-5 py-4">
                <div>
                    <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">Quick start</p>
                    <div className="flex flex-wrap gap-2">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => applyTemplate(template)}
                                disabled={disabled || isGenerating}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                    activeTemplate === template.id
                                        ? 'border-violet-300 bg-violet-100 text-violet-800'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <template.icon className="h-3.5 w-3.5" />
                                {template.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="ai-brief" className="mb-1.5 block text-xs font-medium text-gray-700">
                        What do you want to announce?
                    </label>
                    <textarea
                        id="ai-brief"
                        value={brief}
                        onChange={(e) => {
                            setBrief(e.target.value);
                            setActiveTemplate(null);
                            setError(null);
                        }}
                        rows={3}
                        disabled={disabled || isGenerating}
                        placeholder="e.g. Water will be shut off tomorrow from 9am to 2pm for pipe maintenance in Block B..."
                        className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">{brief.trim().length}/2000 characters · minimum 10 to generate</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-violet-100/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
                        Uses your category, priority, and audience settings for context.
                    </p>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                <span>Writing draft...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">Generate Draft</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
