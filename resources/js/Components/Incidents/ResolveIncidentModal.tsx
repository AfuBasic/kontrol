import React, { useState } from 'react';
import { CheckCircle2, FileText, Info, X } from 'lucide-react';
import type { Incident } from '@/types/incidents';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (notes: string) => void;
    incident: Incident;
    requireResolutionNotes: boolean;
    isSubmitting?: boolean;
}

export default function ResolveIncidentModal({
    isOpen,
    onClose,
    onResolve,
    incident,
    requireResolutionNotes,
    isSubmitting = false,
}: Props) {
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = notes.trim();

        if (requireResolutionNotes && !trimmed) {
            setError('Resolution notes are required by estate policy to mark this incident as resolved.');
            return;
        }

        setError(null);
        onResolve(trimmed);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                                Mark Incident as Resolved
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Case #{incident.reference_code || incident.hashid}
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

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Information Note */}
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <p className="leading-relaxed">
                            Marking this case as resolved notifies the reporter ({incident.reporter?.name || 'Resident'}) that field work is completed and requests their confirmation to formally close the case.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                <span>Resolution Summary & Notes</span>
                                {requireResolutionNotes && (
                                    <span className="text-rose-500 font-black">* (Required by policy)</span>
                                )}
                            </label>
                            <span className="text-[11px] text-slate-400">
                                {notes.length} characters
                            </span>
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Detail how the issue was rectified (e.g. 'Transformer fuse replaced and feeder line reconnected by electrical maintenance team')..."
                            rows={4}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isSubmitting ? 'Resolving...' : 'Confirm Resolution'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
