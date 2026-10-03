import React from 'react';
import { isThisMonth, isThisWeek, isToday, isYesterday } from 'date-fns';
import type { EstateBoardPost } from '@/types';
import AnnouncementCard from './AnnouncementCard';

type Props = {
    posts: EstateBoardPost[];
    hasActiveFilters?: boolean;
};

export type TimeGroup = 'Today' | 'Yesterday' | 'This week' | 'This month' | 'Older';

const TIME_KEYS: TimeGroup[] = ['Today', 'Yesterday', 'This week', 'This month', 'Older'];

export function groupPostsByTime(posts: EstateBoardPost[]): Record<TimeGroup, EstateBoardPost[]> {
    const groups: Record<TimeGroup, EstateBoardPost[]> = {
        Today: [],
        Yesterday: [],
        'This week': [],
        'This month': [],
        Older: [],
    };

    posts.forEach((post) => {
        const date = new Date(post.published_at || post.created_at || Date.now());

        if (isToday(date)) {
            groups.Today.push(post);
        } else if (isYesterday(date)) {
            groups.Yesterday.push(post);
        } else if (isThisWeek(date)) {
            groups['This week'].push(post);
        } else if (isThisMonth(date)) {
            groups['This month'].push(post);
        } else {
            groups.Older.push(post);
        }
    });

    return groups;
}

export default function FeedGroup({ posts, hasActiveFilters = false }: Props) {
    if (!posts || posts.length === 0) return null;

    // One column keeps reading order chronological: newest at the top, straight down.
    if (hasActiveFilters) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-400 uppercase">
                    <span>Results</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {posts.length} post{posts.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="space-y-4">
                    {posts.map((post) => (
                        <AnnouncementCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        );
    }

    const grouped = groupPostsByTime(posts);

    return (
        <div className="space-y-8">
            {TIME_KEYS.map((groupName) => {
                const groupPosts = grouped[groupName];
                if (!groupPosts || groupPosts.length === 0) return null;

                return (
                    <section key={groupName} aria-label={groupName} className="space-y-3">
                        <h3 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                            {groupName}
                            <span className="font-semibold text-slate-400">{groupPosts.length}</span>
                        </h3>

                        <div className="space-y-4">
                            {groupPosts.map((post) => (
                                <AnnouncementCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
