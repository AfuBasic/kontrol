import { Globe, Shield, Users } from 'lucide-react';

import { CATEGORY_COLORS, PRIORITY_BADGES, getAudienceLabel } from '@/lib/estate-board-options';
import type { PostAudience, PostCategory, PostPriority } from '@/types';

type Props = {
    title: string;
    body: string;
    category: PostCategory;
    priority: PostPriority;
    audience: PostAudience;
};

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-3 w-3" />;
        case 'security':
            return <Shield className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function EstateBoardPostPreview({ title, body, category, priority, audience }: Props) {
    const hasContent = stripHtml(body).length > 0;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Live preview</p>
            </div>

            <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ring-1 ring-inset ${CATEGORY_COLORS[category]}`}>
                        {category}
                    </span>
                    {priority !== 'normal' && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${PRIORITY_BADGES[priority]}`}>
                            {priority}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                        {getAudienceIcon(audience)}
                        {getAudienceLabel(audience)}
                    </span>
                </div>

                <h3 className="text-base font-semibold text-gray-900">{title || 'Untitled announcement'}</h3>

                {hasContent ? (
                    <div className="prose prose-sm mt-3 max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: body }} />
                ) : (
                    <p className="mt-3 text-sm text-gray-400 italic">Your announcement preview will appear here as you write.</p>
                )}
            </div>
        </div>
    );
}