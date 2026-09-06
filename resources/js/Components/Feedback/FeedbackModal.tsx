import { useState } from 'react';
import { ThumbsUp, Sparkles, Lightbulb, AlertTriangle, Send, Loader2 } from 'lucide-react';
import Modal from '@/Components/Modal';

export type FeedbackCategory = 'praise' | 'improvement' | 'idea' | 'problem';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    source?: string;
    routeOrScreen?: string;
}

const CATEGORIES: Array<{
    id: FeedbackCategory;
    title: string;
    description: string;
    icon: typeof ThumbsUp;
    color: string;
    bgSelected: string;
    borderSelected: string;
    badgeBg: string;
    badgeText: string;
}> = [
    {
        id: 'praise',
        title: 'Something I like',
        description: 'Share what works nicely or saves you time',
        icon: ThumbsUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgSelected: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        borderSelected: 'border-emerald-500 ring-1 ring-emerald-500/20',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        id: 'improvement',
        title: 'Could be better',
        description: 'Friction, confusing steps, or slower workflows',
        icon: Sparkles,
        color: 'text-amber-600 dark:text-amber-400',
        bgSelected: 'bg-amber-50/70 dark:bg-amber-950/30',
        borderSelected: 'border-amber-500 ring-1 ring-amber-500/20',
        badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        badgeText: 'text-amber-600 dark:text-amber-400',
    },
    {
        id: 'idea',
        title: 'I have an idea',
        description: 'A new capability or feature suggestion for Kontrol',
        icon: Lightbulb,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgSelected: 'bg-indigo-50/70 dark:bg-indigo-950/30',
        borderSelected: 'border-indigo-500 ring-1 ring-indigo-500/20',
        badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        badgeText: 'text-indigo-600 dark:text-indigo-400',
    },
    {
        id: 'problem',
        title: 'I found a problem',
        description: 'Something seems broken or behaved unexpectedly',
        icon: AlertTriangle,
        color: 'text-rose-600 dark:text-rose-400',
        bgSelected: 'bg-rose-50/70 dark:bg-rose-950/30',
        borderSelected: 'border-rose-500 ring-1 ring-rose-500/20',
        badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        badgeText: 'text-rose-600 dark:text-rose-400',
    },
];

export default function FeedbackModal({
    isOpen,
    onClose,
    onSuccess,
    source = 'support_page',
    routeOrScreen = typeof window !== 'undefined' ? window.location.pathname : '',
}: Props) {
    const [category, setCategory] = useState<FeedbackCategory>('improvement');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim().length < 3) {
            setError('Please describe your feedback in at least a few words.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/account/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    category,
                    message: message.trim(),
                    source,
                    route_or_screen: routeOrScreen,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Unable to submit feedback at this moment.');
            }

            setMessage('');
            setCategory('improvement');
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
            <div className="space-y-5">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Share Feedback with Kontrol
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Help us improve Kontrol. This goes directly to the product engineering team. (For urgent account issues, please use Support options instead.)
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category Selection */}
                    <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                            What kind of feedback is this?
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;

                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                                            isSelected
                                                ? `${cat.borderSelected} ${cat.bgSelected}`
                                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${cat.badgeBg} ${cat.badgeText}`}
                                        >
                                            <Icon className="h-4 w-4" strokeWidth={2.2} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                {cat.title}
                                            </div>
                                            <div className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-1">
                                                {cat.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback Message */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="feedback-message"
                                className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300"
                            >
                                Your Message
                            </label>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                                {message.length} / 2,000
                            </span>
                        </div>
                        <div className="mt-2">
                            <textarea
                                id="feedback-message"
                                rows={4}
                                maxLength={2000}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us what you experienced, what was confusing, or what you wish Kontrol could do..."
                                className="block w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || message.trim().length < 3}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Send Feedback</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
