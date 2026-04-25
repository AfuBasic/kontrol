import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ContentEnhanceController from '@/actions/App/Http/Controllers/Api/ContentEnhanceController';

type AIEnhanceTextareaProps = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    minCharsToEnhance?: number;
    title?: string;
    error?: string;
};

export default function AIEnhanceTextarea({
    id,
    value,
    onChange,
    placeholder,
    rows = 6,
    className = '',
    minCharsToEnhance = 20,
    title,
    error,
}: AIEnhanceTextareaProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [originalContent, setOriginalContent] = useState<string | null>(null);
    const [enhanceError, setEnhanceError] = useState<string | null>(null);
    const [showButton, setShowButton] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const canEnhance = value.trim().length >= minCharsToEnhance;
    const hasEnhanced = originalContent !== null;

    useEffect(() => {
        // Show button after debounce when there's enough content
        const timer = setTimeout(() => {
            setShowButton(canEnhance && !hasEnhanced);
        }, 500);

        return () => clearTimeout(timer);
    }, [canEnhance, hasEnhanced, value]);

    const handleEnhance = useCallback(async () => {
        if (!canEnhance || isEnhancing) return;

        setIsEnhancing(true);
        setEnhanceError(null);
        setOriginalContent(value);

        try {
            const response = await fetch(ContentEnhanceController.url(), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    content: value,
                    title: title || null,
                    type: 'estate_board',
                }),
            });

            const data = await response.json();

            if (data.success && data.enhanced) {
                onChange(data.enhanced);
            } else {
                setEnhanceError(data.message || 'Enhancement failed');
                setOriginalContent(null);
            }
        } catch (err) {
            setEnhanceError('Failed to connect. Please try again.');
            setOriginalContent(null);
        } finally {
            setIsEnhancing(false);
        }
    }, [canEnhance, isEnhancing, value, title, onChange]);

    const handleRevert = useCallback(() => {
        if (originalContent !== null) {
            onChange(originalContent);
            setOriginalContent(null);
        }
    }, [originalContent, onChange]);

    const dismissError = useCallback(() => {
        setEnhanceError(null);
    }, []);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none ${
                    hasEnhanced ? 'border-violet-300 bg-violet-50/30' : ''
                } ${error ? 'border-red-300' : ''} ${className}`}
            />

            {/* AI Enhanced indicator */}
            <AnimatePresence>
                {hasEnhanced && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
                    >
                        <Sparkles className="h-3 w-3" />
                        AI Enhanced
                        <button
                            type="button"
                            onClick={handleRevert}
                            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-violet-200"
                            title="Revert to original"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Enhance Button */}
            <AnimatePresence>
                {showButton && !isEnhancing && !hasEnhanced && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        onClick={handleEnhance}
                        className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Enhance with AI
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Loading State */}
            <AnimatePresence>
                {isEnhancing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-3 bottom-3 flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700"
                    >
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
                        Enhancing...
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Toast */}
            <AnimatePresence>
                {enhanceError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 -bottom-12 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg ring-1 ring-red-100"
                    >
                        <span>{enhanceError}</span>
                        <button type="button" onClick={dismissError} className="rounded p-0.5 hover:bg-red-100">
                            <X className="h-3 w-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
