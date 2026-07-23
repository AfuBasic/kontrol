import React from 'react';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import type { EstateBoardPost } from '@/types';
import AnnouncementCard from './AnnouncementCard';

type Props = {
    posts: EstateBoardPost[];
    hasActiveFilters?: boolean;
};

export type TimeGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

export function groupPostsByTime(posts: EstateBoardPost[]): Record<TimeGroup, EstateBoardPost[]> {
    const groups: Record<TimeGroup, EstateBoardPost[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Earlier: [],
    };

    posts.forEach((post) => {
        const date = new Date(post.published_at || post.created_at || Date.now());

        if (isToday(date)) {
            groups.Today.push(post);
        } else if (isYesterday(date)) {
            groups.Yesterday.push(post);
        } else if (isThisWeek(date)) {
            groups['This Week'].push(post);
        } else {
            groups.Earlier.push(post);
        }
    });

    return groups;
}

export default function FeedGroup({ posts, hasActiveFilters = false }: Props) {
    if (!posts || posts.length === 0) return null;

    if (hasActiveFilters) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Search / Filter Results</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {posts.length} post{posts.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {posts.map((post) => (
                        <AnnouncementCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        );
    }

    const grouped = groupPostsByTime(posts);
    const timeKeys: TimeGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];

    return (
        <div className="space-y-6">
            {timeKeys.map((groupName) => {
                const groupPosts = grouped[groupName];
                if (!groupPosts || groupPosts.length === 0) return null;

                return (
                    <div key={groupName} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                {groupName}
                            </h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                {groupPosts.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {groupPosts.map((post) => (
                                <AnnouncementCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
