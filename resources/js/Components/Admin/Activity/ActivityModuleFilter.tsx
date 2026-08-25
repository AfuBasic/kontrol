import React from 'react';

interface ModuleOption {
    key: string;
    label: string;
}

interface ActivityModuleFilterProps {
    currentModule: string;
    onSelectModule: (moduleKey: string) => void;
}

const MODULE_OPTIONS: ModuleOption[] = [
    { key: 'all', label: 'All Activity' },
    { key: 'people', label: 'People' },
    { key: 'access', label: 'Access & Gate' },
    { key: 'incidents', label: 'Incidents' },
    { key: 'finance', label: 'Finance' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'security', label: 'Security' },
    { key: 'roles', label: 'Admin & Roles' },
    { key: 'zones', label: 'Zones' },
    { key: 'system', label: 'System' },
];

export default function ActivityModuleFilter({ currentModule, onSelectModule }: ActivityModuleFilterProps) {
    return (
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
            {MODULE_OPTIONS.map((option) => {
                const isActive = (currentModule || 'all') === option.key;

                return (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => onSelectModule(option.key)}
                        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3.5 py-1.5 font-medium text-xs transition-all duration-150 select-none ${
                            isActive
                                ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                                : 'border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
