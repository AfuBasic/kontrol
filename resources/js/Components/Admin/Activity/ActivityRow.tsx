import {
    UserGroupIcon,
    ShieldCheckIcon,
    KeyIcon,
    ExclamationTriangleIcon,
    MegaphoneIcon,
    BanknotesIcon,
    MapPinIcon,
    AdjustmentsHorizontalIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import React from 'react';
import type { ActivityItem } from '@/types/activity';

interface ActivityRowProps {
    activity: ActivityItem;
}

export default function ActivityRow({ activity }: ActivityRowProps) {
    const renderModuleIcon = () => {
        const iconClass = 'h-4 w-4 shrink-0';

        switch (activity.module) {
            case 'people':
                return <UserGroupIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
            case 'security':
                return <ShieldCheckIcon className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
            case 'access':
                return <KeyIcon className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
            case 'incidents':
                return <ExclamationTriangleIcon className={`${iconClass} text-rose-600 dark:text-rose-400`} />;
            case 'announcements':
                return <MegaphoneIcon className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
            case 'finance':
                return <BanknotesIcon className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
            case 'zones':
                return <MapPinIcon className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />;
            case 'roles':
                return <AdjustmentsHorizontalIcon className={`${iconClass} text-slate-600 dark:text-slate-400`} />;
            default:
                return <Squares2X2Icon className={`${iconClass} text-slate-600 dark:text-slate-400`} />;
        }
    };

    const getModuleBadgeColor = () => {
        switch (activity.module) {
            case 'people':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-100/80 dark:border-blue-900/50';
            case 'security':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-100/80 dark:border-emerald-900/50';
            case 'access':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-100/80 dark:border-amber-900/50';
            case 'incidents':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-100/80 dark:border-rose-900/50';
            case 'announcements':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-100/80 dark:border-purple-900/50';
            case 'finance':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-100/80 dark:border-emerald-900/50';
            case 'zones':
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-100/80 dark:border-indigo-900/50';
            case 'roles':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            default:
                return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-100 dark:border-slate-800';
        }
    };

    const getSemanticBorder = () => {
        if (activity.semantic_tone === 'warning') {
            return 'border-l-4 border-l-rose-500';
        }
        if (activity.semantic_tone === 'important') {
            return 'border-l-4 border-l-amber-500';
        }
        if (activity.semantic_tone === 'financial') {
            return 'border-l-4 border-l-emerald-500';
        }
        return 'border-l-4 border-l-transparent';
    };

    const content = (
        <div
            className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-start sm:gap-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${getSemanticBorder()}`}
        >
            {/* Actor Avatar or System Icon */}
            <div className="flex items-center gap-3 sm:block">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-semibold text-xs text-slate-700 shadow-xs select-none sm:h-11 sm:w-11 sm:text-sm dark:bg-slate-800 dark:text-slate-200">
                    {activity.actor ? activity.actor.initials : 'SYS'}
                </div>
                {/* Mobile time displayed inline next to avatar */}
                <div className="flex flex-1 items-center justify-between sm:hidden">
                    <span className="font-medium text-xs text-slate-400 dark:text-slate-500">
                        {activity.relative_time}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-medium text-[11px] ${getModuleBadgeColor()}`}
                    >
                        {renderModuleIcon()}
                        {activity.module_label}
                    </span>
                </div>
            </div>

            {/* Main content body */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-base text-slate-900 leading-snug break-words dark:text-slate-100">
                        {activity.headline}
                    </p>
                </div>

                {activity.supporting_context && (
                    <div className="mt-1.5 flex items-center gap-2 text-slate-500 text-sm dark:text-slate-400">
                        <span className="line-clamp-2 italic font-normal">
                            &ldquo;{activity.supporting_context}&rdquo;
                        </span>
                    </div>
                )}

                {/* Footer metadata on desktop */}
                <div className="mt-2.5 hidden items-center gap-2.5 text-xs text-slate-400 sm:flex dark:text-slate-500">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-medium text-xs ${getModuleBadgeColor()}`}
                    >
                        {renderModuleIcon()}
                        {activity.module_label}
                    </span>
                    <span>•</span>
                    <span>{activity.relative_time}</span>
                </div>
            </div>

            {/* Navigation indicator for actionable links */}
            {activity.destination_url && (
                <div className="hidden shrink-0 self-center text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-600 sm:block dark:text-slate-600 dark:group-hover:text-slate-300">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}
        </div>
    );

    if (activity.destination_url) {
        return (
            <Link href={activity.destination_url} className="block no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
