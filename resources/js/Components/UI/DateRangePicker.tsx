import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState(startDate);
    const [customEnd, setCustomEnd] = useState(endDate);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Format dates for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const displayText = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Select date range';

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePreset = (days: number, months: number = 0, isYTD: boolean = false) => {
        const end = new Date();
        const start = new Date();

        if (isYTD) {
            start.setMonth(0, 1); // Jan 1st of current year
        } else if (months > 0) {
            start.setMonth(start.getMonth() - months);
        } else {
            start.setDate(start.getDate() - days);
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        onChange(startStr, endStr);
        setIsOpen(false);
    };

    const applyCustom = () => {
        if (customStart && customEnd) {
            onChange(customStart, customEnd);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex w-full items-center justify-between gap-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50"
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <span>{displayText}</span>
                </div>
                <ChevronDownIcon className="-mr-1 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="flex flex-col p-2 sm:flex-row">
                            {/* Presets */}
                            <div className="flex flex-col border-b border-slate-100 p-2 sm:border-b-0 sm:border-r dark:border-slate-700">
                                <span className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quick Ranges</span>
                                {[
                                    { label: 'Last 7 Days', action: () => handlePreset(7) },
                                    { label: 'Last 30 Days', action: () => handlePreset(30) },
                                    { label: 'Last 6 Months', action: () => handlePreset(0, 6) },
                                    { label: 'Last 12 Months', action: () => handlePreset(0, 12) },
                                    { label: 'Year to Date', action: () => handlePreset(0, 0, true) },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={preset.action}
                                        className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50 whitespace-nowrap"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Form */}
                            <div className="flex flex-col p-4">
                                <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Custom Range</span>
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 flex text-xs font-medium text-slate-600 dark:text-slate-300">Start Date</label>
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="block w-full rounded-md border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 flex text-xs font-medium text-slate-600 dark:text-slate-300">End Date</label>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="block w-full rounded-md border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={applyCustom}
                                        disabled={!customStart || !customEnd}
                                        className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-500"
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
