import React from 'react';
import { Pin } from 'lucide-react';
import type { EstateBoardPost } from '@/types';
import AnnouncementCard from './AnnouncementCard';

type Props = {
    pinnedPosts: EstateBoardPost[];
};

export default function PinnedSection({ pinnedPosts }: Props) {
    if (!pinnedPosts || pinnedPosts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                <Pin className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Pinned Announcements ({pinnedPosts.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pinnedPosts.map((post) => (
                    <AnnouncementCard key={post.id} post={post} isPinned={true} />
                ))}
            </div>
        </div>
    );
}
