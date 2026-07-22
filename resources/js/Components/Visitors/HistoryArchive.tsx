import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import resident from '@/routes/resident';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

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
        <div className="space-y-4 py-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search past visitors, phone numbers or codes..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:outline-hidden"
                />
            </div>

            {/* Recent Visitors — Invite Again */}
            {!search && recentVisitors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Visitors</h4>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                        {recentVisitors.map((v) => (
                            <div key={v.visitor_name} className="flex items-center justify-between px-3.5 py-2.5">
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{v.visitor_name}</p>
                                    {v.purpose && <p className="text-[10px] text-slate-400">{v.purpose}</p>}
                                </div>
                                <button
                                    onClick={() => onInviteAgain(v)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Plus className="h-3 w-3 text-slate-400" />
                                    <span>Invite Again</span>
                                </button>
                            </div>
                        ))}
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
                        const isExpanded = expandedMonths[month] ?? idx === 0; // Expand first month by default

                        return (
                            <div key={month} className="rounded-xl border border-slate-100 bg-white">
                                <button
                                    onClick={() => toggleMonth(month)}
                                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-900"
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
                                            <Link
                                                key={item.id}
                                                href={resident.visitors.show.url(item.id, { query: { from_tab: 'history' } })}
                                                className="flex items-center justify-between px-3.5 py-2.5 transition hover:bg-slate-50"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{item.visitor_name}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {item.arrival_date_formatted || item.arrival_date}
                                                        {item.purpose ? ` · ${item.purpose}` : ''}
                                                    </p>
                                                </div>
                                                <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                                                    {item.status}
                                                </span>
                                            </Link>
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
