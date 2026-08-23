import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, ChevronRight, CreditCard, Key, Pencil, Plus, Save, ShieldAlert, Trash2, X } from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/Admin/SettingsController';

type SettingsProps = {
    settings: {
        // 1. Visitor Access
        access_codes_enabled: boolean;
        access_code_min_lifespan_minutes: number;
        access_code_max_lifespan_minutes: number;
        access_code_single_use: boolean;
        require_vehicle_information: boolean;
        allow_residents_to_extend_visitor_passes: boolean;
        visitor_checkout_enabled: boolean;
        entry_point_checkout_enforced: boolean;
        entry_points: string[];

        // 2. Security Operations
        incident_categories: string[];
        default_incident_severity: string;
        require_photo_evidence_for_incidents: boolean;
        require_resolution_notes_for_incidents: boolean;
        allow_residents_to_report_incidents: boolean;
        notify_admins_immediately_for_critical_incidents: boolean;

        // 3. Collections & Billing
        allow_partial_payments: boolean;
        minimum_partial_payment_amount: number;
        minimum_partial_payment_percentage: number;
        collection_reminder_frequency: string;
        collection_maximum_reminder_attempts: number;
        send_reminder_before_due_date_days: number;
    };
};

function formatDuration(minutes: number): string {
    if (minutes < 1) return '';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (mins > 0 && days === 0) parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);

    return parts.length > 0 ? `= ${parts.join(', ')}` : '';
}

type IncidentCategoryManagerProps = {
    categories: string[];
    error?: string;
    onChange: (categories: string[]) => void;
};

function IncidentCategoryManager({ categories, error, onChange }: IncidentCategoryManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [localError, setLocalError] = useState('');

    const previewCategories = categories.slice(0, 3);
    const remainingCount = Math.max(categories.length - previewCategories.length, 0);

    function categoryExists(name: string, exceptIndex?: number): boolean {
        return categories.some((category, index) => index !== exceptIndex && category.trim().toLowerCase() === name.trim().toLowerCase());
    }

    function handleAddCategory() {
        const trimmed = newCategoryInput.trim();

        if (!trimmed) {
            return;
        }

        if (categoryExists(trimmed)) {
            setLocalError('That category already exists.');
            return;
        }

        onChange([...categories, trimmed]);
        setNewCategoryInput('');
        setLocalError('');
    }

    function beginEditCategory(index: number) {
        setEditingIndex(index);
        setEditingValue(categories[index]);
        setLocalError('');
    }

    function cancelEditCategory() {
        setEditingIndex(null);
        setEditingValue('');
        setLocalError('');
    }

    function saveEditedCategory(index: number) {
        const trimmed = editingValue.trim();

        if (!trimmed) {
            setLocalError('Category name cannot be empty.');
            return;
        }

        if (categoryExists(trimmed, index)) {
            setLocalError('That category already exists.');
            return;
        }

        onChange(categories.map((category, categoryIndex) => (categoryIndex === index ? trimmed : category)));
        cancelEditCategory();
    }

    function removeCategory(indexToRemove: number) {
        onChange(categories.filter((_, index) => index !== indexToRemove));

        if (editingIndex !== null) {
            cancelEditCategory();
        }
    }

    function moveCategory(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= categories.length) {
            return;
        }

        const nextCategories = [...categories];
        [nextCategories[index], nextCategories[targetIndex]] = [nextCategories[targetIndex], nextCategories[index]];
        onChange(nextCategories);
    }

    return (
        <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Allowed Incident Categories
            </label>

            <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Incident Categories</span>
                            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                                {categories.length} active
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Shown across resident, admin, and security incident reports.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary-200 hover:text-primary-700 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary-700 dark:hover:text-primary-300"
                    >
                        Manage
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {previewCategories.length > 0 ? (
                        previewCategories.map((category) => (
                            <span
                                key={category}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                {category}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">No categories configured yet.</span>
                    )}

                    {remainingCount > 0 && (
                        <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            +{remainingCount} more
                        </span>
                    )}
                </div>
            </div>

            {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
                        <motion.button
                            type="button"
                            aria-label="Close incident category manager"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                        />

                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="incident-category-manager-title"
                            initial={{ opacity: 0, y: 28, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:m-4 sm:rounded-2xl dark:border-slate-800 dark:bg-slate-950"
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                <div>
                                    <h3 id="incident-category-manager-title" className="text-lg font-bold text-slate-950 dark:text-white">
                                        Manage Incident Categories
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Categories shown in incident report category pickers.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                                {categories.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No incident categories yet</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Custom report categories will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                                        {categories.map((category, index) => {
                                            const isEditing = editingIndex === index;

                                            return (
                                                <div
                                                    key={`${category}-${index}`}
                                                    className="flex items-center gap-3 bg-white px-3 py-3 dark:bg-slate-950"
                                                >
                                                    <div className="flex shrink-0 flex-col gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCategory(index, -1)}
                                                            disabled={index === 0 || editingIndex !== null}
                                                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                                            aria-label={`Move ${category} up`}
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCategory(index, 1)}
                                                            disabled={index === categories.length - 1 || editingIndex !== null}
                                                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                                            aria-label={`Move ${category} down`}
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editingValue}
                                                                onChange={(event) => setEditingValue(event.target.value)}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === 'Enter') {
                                                                        event.preventDefault();
                                                                        saveEditedCategory(index);
                                                                    }

                                                                    if (event.key === 'Escape') {
                                                                        event.preventDefault();
                                                                        cancelEditCategory();
                                                                    }
                                                                }}
                                                                className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-primary-800 dark:bg-slate-900 dark:text-white"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                {category}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => saveEditedCategory(index)}
                                                                    className="rounded-lg bg-slate-950 p-2 text-white transition hover:bg-slate-800 active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-400"
                                                                    aria-label={`Save ${category}`}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEditCategory}
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                                                    aria-label="Cancel edit"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => beginEditCategory(index)}
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                                                    aria-label={`Rename ${category}`}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCategory(index)}
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                                                    aria-label={`Remove ${category}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {localError && <p className="mt-3 text-sm font-medium text-red-500">{localError}</p>}
                            </div>

                            <div className="border-t border-slate-100 bg-white/95 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                                <label
                                    htmlFor="new_incident_category"
                                    className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Add Category
                                </label>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        id="new_incident_category"
                                        type="text"
                                        value={newCategoryInput}
                                        onChange={(event) => {
                                            setNewCategoryInput(event.target.value);
                                            setLocalError('');
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                handleAddCategory();
                                            }
                                        }}
                                        placeholder="e.g. Fire Outbreak"
                                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryInput.trim()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-400"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Settings({ settings }: SettingsProps) {
    const { data, setData, put, processing, errors } = useForm({
        // Visitor Access
        access_codes_enabled: settings.access_codes_enabled,
        access_code_min_lifespan_minutes: settings.access_code_min_lifespan_minutes,
        access_code_max_lifespan_minutes: settings.access_code_max_lifespan_minutes,
        access_code_single_use: settings.access_code_single_use,
        require_vehicle_information: settings.require_vehicle_information,
        allow_residents_to_extend_visitor_passes: settings.allow_residents_to_extend_visitor_passes,
        visitor_checkout_enabled: settings.visitor_checkout_enabled,
        entry_point_checkout_enforced: settings.entry_point_checkout_enforced,
        entry_points: settings.entry_points || [],

        // Security Operations
        incident_categories: settings.incident_categories || [],
        default_incident_severity: settings.default_incident_severity || 'Low',
        require_photo_evidence_for_incidents: settings.require_photo_evidence_for_incidents,
        require_resolution_notes_for_incidents: settings.require_resolution_notes_for_incidents,
        allow_residents_to_report_incidents: settings.allow_residents_to_report_incidents,
        notify_admins_immediately_for_critical_incidents: settings.notify_admins_immediately_for_critical_incidents,

        // Collections & Billing
        allow_partial_payments: settings.allow_partial_payments,
        minimum_partial_payment_percentage: settings.minimum_partial_payment_percentage ?? 10,
        collection_reminder_frequency: settings.collection_reminder_frequency || 'weekly',
        collection_maximum_reminder_attempts: settings.collection_maximum_reminder_attempts || 3,
        send_reminder_before_due_date_days: settings.send_reminder_before_due_date_days || 1,
    });

    const [newEntryPointInput, setNewEntryPointInput] = useState('');

    function handleAddEntryPoint(e: React.KeyboardEvent | React.MouseEvent) {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = newEntryPointInput.trim();
        if (trimmed && !data.entry_points.some((ep) => ep.toLowerCase() === trimmed.toLowerCase())) {
            setData('entry_points', [...data.entry_points, trimmed]);
            setNewEntryPointInput('');
        }
    }

    function handleRemoveEntryPoint(pointToRemove: string) {
        setData(
            'entry_points',
            data.entry_points.filter((ep) => ep !== pointToRemove),
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(update.url());
    }

    return (
        <>
            <Head title="Estate Operational Policies" />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">Estate Operational Policies</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Define core administrative behaviors, security controls, and billing workflows for your estate.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sm transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none active:scale-95 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-slate-800"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    {/* SECTION 1: VISITOR ACCESS */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Visitor Access</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Configure entry code lifespans, verification rules, and gate security policies.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            {/* Master Toggle */}
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-800/20">
                                <div>
                                    <span className="block text-sm font-medium text-slate-900 dark:text-white">Enable Access Code System</span>
                                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                        Master switch for visitor entry codes. When disabled, residents cannot generate new access codes.
                                    </span>
                                </div>
                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.access_codes_enabled}
                                        onChange={(e) => setData('access_codes_enabled', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            {/* Lifespan Configuration */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="min_lifespan"
                                        className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Minimum Code Lifespan (Minutes)
                                    </label>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            id="min_lifespan"
                                            min="1"
                                            max="10080"
                                            value={data.access_code_min_lifespan_minutes ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('access_code_min_lifespan_minutes', val === '' ? ('' as any) : parseInt(val, 10));
                                            }}
                                            onBlur={() => {
                                                if (!data.access_code_min_lifespan_minutes) {
                                                    setData('access_code_min_lifespan_minutes', 60);
                                                }
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Shortest validity period allowed{' '}
                                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                                            {formatDuration(Number(data.access_code_min_lifespan_minutes) || 0)}
                                        </span>
                                    </p>
                                    {errors.access_code_min_lifespan_minutes && (
                                        <p className="mt-1 text-xs text-red-500">{errors.access_code_min_lifespan_minutes}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="max_lifespan"
                                        className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Maximum Code Lifespan (Minutes)
                                    </label>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            id="max_lifespan"
                                            min="1"
                                            max="10080"
                                            value={data.access_code_max_lifespan_minutes ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('access_code_max_lifespan_minutes', val === '' ? ('' as any) : parseInt(val, 10));
                                            }}
                                            onBlur={() => {
                                                if (!data.access_code_max_lifespan_minutes) {
                                                    setData('access_code_max_lifespan_minutes', 1440);
                                                }
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Longest validity period allowed (Must be &ge; Minimum){' '}
                                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                                            {formatDuration(data.access_code_max_lifespan_minutes)}
                                        </span>
                                    </p>
                                    {errors.access_code_max_lifespan_minutes && (
                                        <p className="mt-1 text-xs text-red-500">{errors.access_code_max_lifespan_minutes}</p>
                                    )}
                                </div>
                            </div>

                            {/* Visitor Access Policies */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Visitor Policies</h3>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Single-use Access Codes</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Code automatically expires immediately after first successful gate entry scan.
                                            </span>
                                        </div>
                                        <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.access_code_single_use}
                                                onChange={(e) => setData('access_code_single_use', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                                Require Vehicle Information
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Mandate vehicle license plate or driver details when residents invite driving visitors.
                                            </span>
                                        </div>
                                        <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.require_vehicle_information}
                                                onChange={(e) => setData('require_vehicle_information', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Allow Pass Extensions</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Permit residents to extend active visitor pass durations directly from their mobile portal.
                                            </span>
                                        </div>
                                        <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.allow_residents_to_extend_visitor_passes}
                                                onChange={(e) => setData('allow_residents_to_extend_visitor_passes', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                                Visitor Checkout Tracking
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Security guards scan visitor codes upon exit to record exact departure timestamps.
                                            </span>
                                        </div>
                                        <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.visitor_checkout_enabled}
                                                onChange={(e) => setData('visitor_checkout_enabled', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Entry Point Checkout Enforcement */}
                                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                    <div
                                        className={`flex items-start justify-between gap-3 p-4 transition-colors ${!data.visitor_checkout_enabled ? 'bg-slate-50 opacity-60 dark:bg-slate-800/20' : ''}`}
                                    >
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                                Enforce Entry Point Checkout
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Require visitors to check out through the same entry point they used to enter.
                                                {!data.visitor_checkout_enabled && (
                                                    <span className="mt-1 block font-medium text-amber-600 dark:text-amber-500">
                                                        Requires Visitor Checkout Tracking to be enabled.
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                disabled={!data.visitor_checkout_enabled}
                                                checked={data.visitor_checkout_enabled && data.entry_point_checkout_enforced}
                                                onChange={(e) => {
                                                    if (data.visitor_checkout_enabled) {
                                                        setData('entry_point_checkout_enforced', e.target.checked);
                                                    }
                                                }}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    {/* Entry Points List */}
                                    {data.visitor_checkout_enabled && data.entry_point_checkout_enforced && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/20">
                                            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                Configured Entry Points
                                            </label>

                                            {data.entry_points.length === 0 && (
                                                <div className="mt-2 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                                                    <strong>Add your entry points:</strong> To enforce entry point checkout, tell Kontrol which
                                                    gates/checkpoints visitors can use to enter and leave the estate.
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-2">
                                                {data.entry_points.map((ep, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                                    >
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{ep}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEntryPoint(ep)}
                                                            className="text-xs font-medium text-slate-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newEntryPointInput}
                                                    onChange={(e) => setNewEntryPointInput(e.target.value)}
                                                    onKeyDown={handleAddEntryPoint}
                                                    placeholder="e.g. Main Gate"
                                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddEntryPoint}
                                                    disabled={!newEntryPointInput.trim()}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-slate-800"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add
                                                </button>
                                            </div>

                                            {errors.entry_points && <p className="mt-2 text-xs font-medium text-red-500">{errors.entry_points}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* SECTION 2: SECURITY OPERATIONS */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Security Operations</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Configure incident categories, report requirements, severity defaults, and alert escalations.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            <IncidentCategoryManager
                                categories={data.incident_categories}
                                error={errors.incident_categories}
                                onChange={(categories) => setData('incident_categories', categories)}
                            />

                            {/* Default Incident Severity Select */}
                            <div>
                                <label
                                    htmlFor="default_severity"
                                    className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Default Incident Severity
                                </label>
                                <select
                                    id="default_severity"
                                    value={data.default_incident_severity}
                                    onChange={(e) => setData('default_incident_severity', e.target.value)}
                                    className="mt-2 block w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="Low">Low (Informational / Minor)</option>
                                    <option value="Medium">Medium (Requires Review)</option>
                                    <option value="High">High (Urgent Response Needed)</option>
                                    <option value="Critical">Critical (Immediate Security Dispatch)</option>
                                </select>
                            </div>

                            {/* Incident Evidence & Reporting Toggles */}
                            <div className="grid gap-4 pt-2 sm:grid-cols-2">
                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                            Allow Resident Incident Reporting
                                        </span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Residents can submit security reports directly from their mobile portal.
                                        </span>
                                    </div>
                                    <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.allow_residents_to_report_incidents}
                                            onChange={(e) => setData('allow_residents_to_report_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                            Notify Admins on Critical Incidents
                                        </span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Send immediate high-priority alerts to estate managers for Critical severity reports.
                                        </span>
                                    </div>
                                    <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.notify_admins_immediately_for_critical_incidents}
                                            onChange={(e) => setData('notify_admins_immediately_for_critical_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Photo Evidence</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Mandate photo attachment before an incident report can be submitted.
                                        </span>
                                    </div>
                                    <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.require_photo_evidence_for_incidents}
                                            onChange={(e) => setData('require_photo_evidence_for_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Resolution Notes</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Require security personnel to type detailed notes before closing an incident ticket.
                                        </span>
                                    </div>
                                    <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.require_resolution_notes_for_incidents}
                                            onChange={(e) => setData('require_resolution_notes_for_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* SECTION 3: COLLECTIONS & BILLING */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Collections &amp; Billing</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Manage partial payment thresholds and automated collection reminder policies.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            {/* Partial Payments Toggle */}
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-800/20">
                                <div>
                                    <span className="block text-sm font-medium text-slate-900 dark:text-white">Allow Partial Payments</span>
                                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                        Permit residents to pay bills in flexible installments rather than requiring full lump-sum payment.
                                    </span>
                                </div>
                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.allow_partial_payments}
                                        onChange={(e) => setData('allow_partial_payments', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-950 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            {/* Partial Payment Thresholds */}
                            {data.allow_partial_payments && (
                                <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
                                    <div>
                                        <label
                                            htmlFor="min_partial_percent"
                                            className="block text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                        >
                                            Minimum Partial Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="min_partial_percent"
                                            min="10"
                                            max="90"
                                            step="1"
                                            value={data.minimum_partial_payment_percentage ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('minimum_partial_payment_percentage', val === '' ? ('' as any) : parseInt(val, 10));
                                            }}
                                            onBlur={() => {
                                                const val = Number(data.minimum_partial_payment_percentage);
                                                if (!val || val < 10) {
                                                    setData('minimum_partial_payment_percentage', 10);
                                                } else if (val > 90) {
                                                    setData('minimum_partial_payment_percentage', 90);
                                                }
                                            }}
                                            placeholder="10"
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Minimum percentage of bill balance required per partial installment (10-90%).
                                        </p>
                                        {errors.minimum_partial_payment_percentage && (
                                            <p className="mt-1 text-xs text-red-500">{errors.minimum_partial_payment_percentage}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Collection Reminder Policy */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Collection Reminder Policy</h3>

                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div>
                                        <label
                                            htmlFor="reminder_freq"
                                            className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Reminder Frequency
                                        </label>
                                        <select
                                            id="reminder_freq"
                                            value={data.collection_reminder_frequency}
                                            onChange={(e) => setData('collection_reminder_frequency', e.target.value)}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="3_days">Every 3 Days</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="custom">Custom Interval</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="max_reminder_attempts"
                                            className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Maximum Reminder Attempts
                                        </label>
                                        <input
                                            type="number"
                                            id="max_reminder_attempts"
                                            min="1"
                                            max="20"
                                            value={data.collection_maximum_reminder_attempts ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('collection_maximum_reminder_attempts', val === '' ? ('' as any) : parseInt(val, 10));
                                            }}
                                            onBlur={() => {
                                                if (!data.collection_maximum_reminder_attempts) {
                                                    setData('collection_maximum_reminder_attempts', 3);
                                                }
                                            }}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="reminder_before_due"
                                            className="block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Send Reminder Before Due Date (Days)
                                        </label>
                                        <input
                                            type="number"
                                            id="reminder_before_due"
                                            min="0"
                                            max="30"
                                            value={data.send_reminder_before_due_date_days ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('send_reminder_before_due_date_days', val === '' ? ('' as any) : parseInt(val, 10));
                                            }}
                                            onBlur={() => {
                                                const reminderDays = data.send_reminder_before_due_date_days as number | string | undefined;

                                                if (reminderDays === '' || reminderDays === undefined) {
                                                    setData('send_reminder_before_due_date_days', 1);
                                                }
                                            }}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Bottom Save Bar */}
                    <div className="flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <p className="text-center text-xs leading-relaxed text-slate-400 sm:max-w-xs sm:text-left">
                            Changes take effect immediately across all active estate devices.
                        </p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-base font-semibold whitespace-nowrap text-white shadow-md transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none active:scale-95 disabled:opacity-50 sm:min-h-0 sm:w-auto sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm dark:bg-slate-950 dark:hover:bg-slate-800"
                        >
                            <Save className="h-4 w-4" />
                            <span className="sm:hidden">{processing ? 'Saving...' : 'Save'}</span>
                            <span className="hidden sm:inline">{processing ? 'Saving Changes...' : 'Save Settings'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
