import React, { useState } from 'react';
import { Megaphone, Send, Shield, Sparkles, X } from 'lucide-react';
import type { Incident } from '@/types/incidents';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmitUpdate: (body: string) => void;
    incident: Incident;
    isSubmitting?: boolean;
}

export default function AddOfficialUpdateModal({
    isOpen,
    onClose,
    onSubmitUpdate,
    incident,
    isSubmitting = false,
}: Props) {
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = body.trim();

        if (!trimmed) {
            setError('Please enter the update or advisory message.');
            return;
        }

        setError(null);
        onSubmitUpdate(trimmed);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                                Post Official Update
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Broadcast an advisory to the reporter and community
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-indigo-50/70 p-3.5 border border-indigo-200/60 dark:bg-indigo-950/40 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200">
                        <Shield className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                        <p className="leading-relaxed">
                            Official updates are highlighted with an authoritative badge on both the resident case view and community notice feed.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Advisory Message
                            </label>
                            <span className="text-[11px] text-slate-400">
                                {body.length} characters
                            </span>
                        </div>

                        <textarea
                            value={body}
                            onChange={(e) => {
                                setBody(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g. 'Technicians have arrived on site and isolated the water pipe leak. Estimated completion time is 2:00 PM.'..."
                            rows={4}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        />
                        {error && (
                            <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !body.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{isSubmitting ? 'Posting...' : 'Broadcast Update'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
