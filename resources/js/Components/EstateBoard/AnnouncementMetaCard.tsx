import { Calendar, Clock, Tag, AlertCircle, Info } from 'lucide-react';
import React from 'react';
import type { PostCategory, PostPriority, PostStatus } from '@/types';

interface AnnouncementMetaCardProps {
    publishedAt?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    category?: PostCategory;
    priority?: PostPriority;
    status: PostStatus;
    className?: string;
}

export default function AnnouncementMetaCard({
    publishedAt,
    createdAt,
    updatedAt,
    category = 'general',
    priority = 'normal',
    status,
    className = '',
}: AnnouncementMetaCardProps) {
    const formatDate = (dateStr: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={`rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
            <div className="mb-4 flex items-center gap-2 text-slate-800">
                <Info className="h-4 w-4 text-primary-600" />
                <h3 className="text-xs font-black tracking-wider uppercase">Publication Details</h3>
            </div>

            <div className="space-y-3.5 text-xs text-left">
                {/* Published Date */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-slate-400">Published</span>
                    <span className="font-bold text-slate-800">
                        {publishedAt ? formatDate(publishedAt) : formatDate(createdAt)}
                    </span>
                </div>

                {/* Updated Date (only if different) */}
                {updatedAt && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="font-semibold text-slate-400">Last updated</span>
                        <span className="font-bold text-slate-700">{formatDate(updatedAt)}</span>
                    </div>
                )}

                {/* Category */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-slate-400">Category</span>
                    <span className="font-bold text-slate-800 capitalize">{category}</span>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-slate-400">Priority</span>
                    <span className={`font-black uppercase text-[10px] ${
                        priority === 'critical'
                            ? 'text-rose-600'
                            : priority === 'important'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                    }`}>
                        {priority}
                    </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-0.5">
                    <span className="font-semibold text-slate-400">Status</span>
                    <span className={`font-bold capitalize ${status === 'published' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {status}
                    </span>
                </div>
            </div>
        </div>
    );
}
