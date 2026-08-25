import React from 'react';
import { Edit3, Eye, EyeOff, Layers, MapPin, ShieldAlert, Tag, UserCheck } from 'lucide-react';
import type { Incident } from '@/types/incidents';

interface Props {
    incident: Incident;
    onEdit: () => void;
    canEdit?: boolean;
    className?: string;
}

export default function CaseDetailsSection({
    incident,
    onEdit,
    canEdit = true,
    className = '',
}: Props) {
    const formatCategory = (cat: string) => {
        return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case 'critical':
                return {
                    label: 'Critical',
                    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
                };
            case 'high':
                return {
                    label: 'High',
                    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60',
                };
            case 'medium':
                return {
                    label: 'Medium',
                    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
                };
            default:
                return {
                    label: 'Low',
                    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                };
        }
    };

    const priorityInfo = getPriorityBadge(incident.priority);

    return (
        <section
            className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Case Details
                </h3>

                {canEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Priority */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100/60 dark:border-slate-800/60 pb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                        <span>Priority</span>
                    </span>
                    <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold border ${priorityInfo.bg}`}
                    >
                        {priorityInfo.label}
                    </span>
                </div>

                {/* Assigned Handler */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100/60 dark:border-slate-800/60 pb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>Assigned Handler</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {incident.assignee ? incident.assignee.name : 'Unassigned'}
                    </span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100/60 dark:border-slate-800/60 pb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        <span>Category</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {formatCategory(incident.category)}
                    </span>
                </div>

                {/* Zone / Scope */}
                {incident.zone && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100/60 dark:border-slate-800/60 pb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            <span>Estate Zone</span>
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {incident.zone.name}
                        </span>
                    </div>
                )}

                {/* Location */}
                {incident.location && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100/60 dark:border-slate-800/60 pb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>Location</span>
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[180px] truncate text-right">
                            {incident.location}
                        </span>
                    </div>
                )}

                {/* Visibility */}
                <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {incident.is_private ? (
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>Visibility</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {incident.is_private ? 'Private (Admin & Reporter)' : 'Public to Estate'}
                    </span>
                </div>
            </div>
        </section>
    );
}
