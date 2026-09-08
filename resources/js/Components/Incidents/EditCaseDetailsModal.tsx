import React, { useState } from 'react';
import { Edit3, Eye, Lock, Shield, Sliders, Tag, UserCheck, X } from 'lucide-react';
import type { Incident, IncidentCategory, IncidentPriority } from '@/types/incidents';
import CustomSelect from '@/Components/UI/CustomSelect';

interface AdminUser {
    id: number;
    name: string;
    email: string;
}

interface CategoryOption {
    value: string;
    label: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        priority?: IncidentPriority;
        assigned_to?: string | number | null;
        category?: string;
        is_private?: boolean;
    }) => void;
    incident: Incident;
    admins: AdminUser[];
    categories: CategoryOption[];
    isSubmitting?: boolean;
}

export default function EditCaseDetailsModal({
    isOpen,
    onClose,
    onSave,
    incident,
    admins,
    categories,
    isSubmitting = false,
}: Props) {
    const [priority, setPriority] = useState<IncidentPriority>(incident.priority || 'medium');
    const [assignedTo, setAssignedTo] = useState<string>(
        incident.assignee ? String(incident.assignee.id) : ''
    );
    const [category, setCategory] = useState<string>(incident.category);
    const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(incident.is_private));

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            priority,
            assigned_to: assignedTo ? Number(assignedTo) : null,
            category,
            is_private: isPrivate,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs">
                            <Sliders className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                                Edit Case Details
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Update incident priority, assignment, category, or visibility
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
                    {/* Priority */}
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Priority Level
                        </label>
                        <CustomSelect
                            value={priority}
                            onChange={(val) => setPriority(val as IncidentPriority)}
                            options={[
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'critical', label: 'Critical' },
                            ]}
                        />
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Assigned Admin / Handler
                        </label>
                        <CustomSelect
                            value={assignedTo}
                            onChange={(val) => setAssignedTo(String(val))}
                            options={[
                                { value: '', label: 'Unassigned' },
                                ...admins.map((adm) => ({
                                    value: String(adm.id),
                                    label: adm.name,
                                })),
                            ]}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Category
                        </label>
                        <CustomSelect
                            value={category}
                            onChange={(val) => setCategory(String(val))}
                            options={categories.map((cat) => ({
                                value: cat.value,
                                label: cat.label,
                            }))}
                        />
                    </div>

                    {/* Visibility / Privacy */}
                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    Private Case
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Only management and the reporter can view this case.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
