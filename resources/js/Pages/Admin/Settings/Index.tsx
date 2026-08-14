import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Key, 
    ShieldAlert, 
    CreditCard, 
    Plus, 
    X, 
    Save
} from 'lucide-react';
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

    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [newEntryPointInput, setNewEntryPointInput] = useState('');

    function handleAddEntryPoint(e: React.KeyboardEvent | React.MouseEvent) {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = newEntryPointInput.trim();
        if (trimmed && !data.entry_points.some(ep => ep.toLowerCase() === trimmed.toLowerCase())) {
            setData('entry_points', [...data.entry_points, trimmed]);
            setNewEntryPointInput('');
        }
    }

    function handleRemoveEntryPoint(pointToRemove: string) {
        setData(
            'entry_points',
            data.entry_points.filter((ep) => ep !== pointToRemove)
        );
    }

    function handleAddCategory(e: React.KeyboardEvent | React.MouseEvent) {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = newCategoryInput.trim();
        if (trimmed && !data.incident_categories.includes(trimmed)) {
            setData('incident_categories', [...data.incident_categories, trimmed]);
            setNewCategoryInput('');
        }
    }

    function handleRemoveCategory(categoryToRemove: string) {
        setData(
            'incident_categories',
            data.incident_categories.filter((cat) => cat !== categoryToRemove)
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Estate Operational Policies
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Define core administrative behaviors, security controls, and billing workflows for your estate.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-500"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8">
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
                                    <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                        Enable Access Code System
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                        Master switch for visitor entry codes. When disabled, residents cannot generate new access codes.
                                    </span>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={data.access_codes_enabled}
                                        onChange={(e) => setData('access_codes_enabled', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            {/* Lifespan Configuration */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="min_lifespan" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                    <label htmlFor="max_lifespan" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Visitor Policies
                                </h3>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Single-use Access Codes</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Code automatically expires immediately after first successful gate entry scan.
                                            </span>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.access_code_single_use}
                                                onChange={(e) => setData('access_code_single_use', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Vehicle Information</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Mandate vehicle license plate or driver details when residents invite driving visitors.
                                            </span>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.require_vehicle_information}
                                                onChange={(e) => setData('require_vehicle_information', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Allow Pass Extensions</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Permit residents to extend active visitor pass durations directly from their mobile portal.
                                            </span>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.allow_residents_to_extend_visitor_passes}
                                                onChange={(e) => setData('allow_residents_to_extend_visitor_passes', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Visitor Checkout Tracking</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Security guards scan visitor codes upon exit to record exact departure timestamps.
                                            </span>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.visitor_checkout_enabled}
                                                onChange={(e) => setData('visitor_checkout_enabled', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Entry Point Checkout Enforcement */}
                                <div className="mt-4 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40 overflow-hidden">
                                    <div className={`flex items-start justify-between gap-3 p-4 transition-colors ${!data.visitor_checkout_enabled ? 'opacity-60 bg-slate-50 dark:bg-slate-800/20' : ''}`}>
                                        <div>
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Enforce Entry Point Checkout</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                                Require visitors to check out through the same entry point they used to enter.
                                                {!data.visitor_checkout_enabled && (
                                                    <span className="block mt-1 text-amber-600 dark:text-amber-500 font-medium">
                                                        Requires Visitor Checkout Tracking to be enabled.
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
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
                                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    {/* Entry Points List */}
                                    {data.visitor_checkout_enabled && data.entry_point_checkout_enforced && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/20">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Configured Entry Points
                                            </label>
                                            
                                            {data.entry_points.length === 0 && (
                                                <div className="mt-2 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                                                    <strong>Add your entry points:</strong> To enforce entry point checkout, tell Kontrol which gates/checkpoints visitors can use to enter and leave the estate.
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-2">
                                                {data.entry_points.map((ep, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{ep}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEntryPoint(ep)}
                                                            className="text-xs font-medium text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddEntryPoint}
                                                    disabled={!newEntryPointInput.trim()}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-500"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add
                                                </button>
                                            </div>
                                            
                                            {errors.entry_points && (
                                                <p className="mt-2 text-xs font-medium text-red-500">{errors.entry_points}</p>
                                            )}
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
                            {/* Incident Categories Manager */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Allowed Incident Categories
                                </label>
                                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                                    {data.incident_categories.map((category) => (
                                        <span
                                            key={category}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                            {category}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCategory(category)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}

                                    <div className="inline-flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={newCategoryInput}
                                            onChange={(e) => setNewCategoryInput(e.target.value)}
                                            onKeyDown={handleAddCategory}
                                            placeholder="Add category & press Enter..."
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            className="rounded-lg bg-primary-600 p-1 text-white hover:bg-primary-700 active:scale-95"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Default Incident Severity Select */}
                            <div>
                                <label htmlFor="default_severity" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Default Incident Severity
                                </label>
                                <select
                                    id="default_severity"
                                    value={data.default_incident_severity}
                                    onChange={(e) => setData('default_incident_severity', e.target.value)}
                                    className="mt-2 block w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="Low">Low (Informational / Minor)</option>
                                    <option value="Medium">Medium (Requires Review)</option>
                                    <option value="High">High (Urgent Response Needed)</option>
                                    <option value="Critical">Critical (Immediate Security Dispatch)</option>
                                </select>
                            </div>

                            {/* Incident Evidence & Reporting Toggles */}
                            <div className="grid gap-4 sm:grid-cols-2 pt-2">
                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Allow Resident Incident Reporting</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Residents can submit security reports directly from their mobile portal.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={data.allow_residents_to_report_incidents}
                                            onChange={(e) => setData('allow_residents_to_report_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Notify Admins on Critical Incidents</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Send immediate high-priority alerts to estate managers for Critical severity reports.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={data.notify_admins_immediately_for_critical_incidents}
                                            onChange={(e) => setData('notify_admins_immediately_for_critical_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Photo Evidence</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Mandate photo attachment before an incident report can be submitted.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={data.require_photo_evidence_for_incidents}
                                            onChange={(e) => setData('require_photo_evidence_for_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/60 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Resolution Notes</span>
                                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                            Require security personnel to type detailed notes before closing an incident ticket.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={data.require_resolution_notes_for_incidents}
                                            onChange={(e) => setData('require_resolution_notes_for_incidents', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
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
                                    <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                        Allow Partial Payments
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                        Permit residents to pay bills in flexible installments rather than requiring full lump-sum payment.
                                    </span>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={data.allow_partial_payments}
                                        onChange={(e) => setData('allow_partial_payments', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            {/* Partial Payment Thresholds */}
                            {data.allow_partial_payments && (
                                <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
                                    <div>
                                        <label htmlFor="min_partial_percent" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Collection Reminder Policy
                                </h3>

                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div>
                                        <label htmlFor="reminder_freq" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Reminder Frequency
                                        </label>
                                        <select
                                            id="reminder_freq"
                                            value={data.collection_reminder_frequency}
                                            onChange={(e) => setData('collection_reminder_frequency', e.target.value)}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="3_days">Every 3 Days</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="custom">Custom Interval</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="max_reminder_attempts" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="reminder_before_due" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                                if (data.send_reminder_before_due_date_days === '' || data.send_reminder_before_due_date_days === undefined) {
                                                    setData('send_reminder_before_due_date_days', 1);
                                                }
                                            }}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-6 dark:border-slate-800">
                        <p className="text-xs text-slate-400">
                            Changes take effect immediately across all active estate devices.
                        </p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-500"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving Changes...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
