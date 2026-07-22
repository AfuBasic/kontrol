import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import VisitorAvatar from '@/Components/Visitors/VisitorAvatar';
import VisitorRow from '@/Components/Visitors/VisitorRow';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';
import { deriveCategory } from '@/Utils/visitorTheme';

type RecentVisitor = {
    visitor_name: string;
    visitor_phone: string | null;
    purpose: string | null;
    type: string;
};

type Props = {
    historyTimeline: VisitorTimelineItem[];
    recentVisitors: RecentVisitor[];
    onInviteAgain: (visitor: RecentVisitor) => void;
    initialSearch?: string;
};

export default function HistoryArchive({
    historyTimeline,
    recentVisitors,
    onInviteAgain,
    initialSearch = '',
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    // Filter by search
    const filtered = historyTimeline.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.visitor_name?.toLowerCase().includes(q) ||
            item.code?.toLowerCase().includes(q) ||
            item.purpose?.toLowerCase().includes(q) ||
            item.visitor_phone?.includes(q)
        );
    });

    // Group history items by Month (e.g. "July 2026")
    const groupedByMonth = filtered.reduce<Record<string, VisitorTimelineItem[]>>((acc, item) => {
        const dateObj = new Date(item.effective_visit_at || item.arrival_date || Date.now());
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(item);
        return acc;
    }, {});

    const monthKeys = Object.keys(groupedByMonth);

    const toggleMonth = (month: string) => {
        setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }));
    };

    return (
        <div className="space-y-4 py-2">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search past visitors, phone numbers or codes..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-900 placeholder-slate-400 transition focus:border-primary-500 focus:outline-hidden"
                />
            </div>

            {/* Horizontal Snap Scroll of Compact Recent Contacts Chips */}
            {!search && recentVisitors.length > 0 && (
                <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Contacts</h4>
                    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {recentVisitors.map((v) => {
                            const category = deriveCategory(v.purpose, v.type);
                            return (
                                <div
                                    key={v.visitor_name}
                                    className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30"
                                >
                                    <VisitorAvatar category={category} name={v.visitor_name} size="sm" />
                                    <span className="max-w-[100px] truncate text-xs font-bold text-slate-900">
                                        {v.visitor_name}
                                    </span>
                                    <button
                                        onClick={() => onInviteAgain(v)}
                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition hover:bg-primary-500 hover:text-white"
                                        title={`Invite ${v.visitor_name} again`}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Monthly Archive Accordion */}
            <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Archive</h4>
                {monthKeys.length === 0 ? (
                    <p className="py-6 text-center text-xs font-semibold text-slate-400">No past visitors found.</p>
                ) : (
                    monthKeys.map((month, idx) => {
                        const items = groupedByMonth[month];
                        const isExpanded = expandedMonths[month] ?? idx === 0;

                        return (
                            <div key={month} className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                                <button
                                    onClick={() => toggleMonth(month)}
                                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-900 hover:bg-slate-50"
                                >
                                    <span>{month} ({items.length} visit{items.length === 1 ? '' : 's'})</span>
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                                        {items.map((item) => (
                                            <VisitorRow key={item.id} visit={item} fromTab="history" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
