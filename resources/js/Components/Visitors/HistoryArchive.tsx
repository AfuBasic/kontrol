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

type SortField = 'visitor_name' | 'date' | 'purpose' | 'status' | 'code';
type SortDirection = 'asc' | 'desc';

export default function HistoryArchive({
    historyTimeline,
    recentVisitors,
    onInviteAgain,
    initialSearch = '',
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [displayMode, setDisplayMode] = useState<'accordion' | 'table'>('table');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter by search and category
    const filtered = historyTimeline.filter((item) => {
        if (selectedCategory !== 'All') {
            const cat = (item.purpose || '').toLowerCase();
            if (!cat.includes(selectedCategory.toLowerCase())) {
                return false;
            }
        }

        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.visitor_name?.toLowerCase().includes(q) ||
            item.code?.toLowerCase().includes(q) ||
            item.purpose?.toLowerCase().includes(q) ||
            item.visitor_phone?.includes(q)
        );
    });

    // Sort items
    const sortedItems = [...filtered].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'visitor_name') {
            valA = a.visitor_name || '';
            valB = b.visitor_name || '';
        } else if (sortField === 'date') {
            valA = new Date(a.effective_visit_at || a.arrival_date || 0).getTime();
            valB = new Date(b.effective_visit_at || b.arrival_date || 0).getTime();
        } else if (sortField === 'purpose') {
            valA = a.purpose || '';
            valB = b.purpose || '';
        } else if (sortField === 'status') {
            valA = a.status || '';
            valB = b.status || '';
        } else if (sortField === 'code') {
            valA = a.code || '';
            valB = b.code || '';
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Group history items by Month (for accordion view)
    const groupedByMonth = sortedItems.reduce<Record<string, VisitorTimelineItem[]>>((acc, item) => {
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

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <span className="text-slate-300 ml-1 font-normal opacity-0 group-hover:opacity-100 transition">↕</span>;
        }
        return <span className="text-primary-600 ml-1 font-black">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="space-y-4 py-2">
            {/* Search Input & Filter/Sort Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search past visitors, phone numbers or codes..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-900 placeholder-slate-400 transition focus:border-primary-500 focus:outline-hidden"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Category Filter Dropdown */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-hidden shadow-2xs"
                    >
                        <option value="All">All Categories</option>
                        <option value="Family">Family</option>
                        <option value="Friends">Friends</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Business">Business</option>
                    </select>

                    {/* Explicit Sort Select (for Mobile & Desktop) */}
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-hidden shadow-2xs"
                    >
                        <option value="date">Sort: Visit Date</option>
                        <option value="visitor_name">Sort: Visitor Name</option>
                        <option value="purpose">Sort: Category</option>
                        <option value="status">Sort: Status</option>
                        <option value="code">Sort: Pass Code</option>
                    </select>

                    {/* Sort Direction Toggle Button */}
                    <button
                        onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
                        title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                        <span>{sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}</span>
                    </button>

                    {/* Display Mode Switcher */}
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
                        <button
                            onClick={() => setDisplayMode('table')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                displayMode === 'table'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setDisplayMode('accordion')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                displayMode === 'accordion'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            By Month
                        </button>
                    </div>
                </div>
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

            {/* TABLE DISPLAY MODE */}
            {displayMode === 'table' && (
                <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    <th
                                        onClick={() => handleSort('visitor_name')}
                                        className="group cursor-pointer py-3 px-4 hover:text-slate-900 select-none"
                                    >
                                        <div className="flex items-center">
                                            <span>Visitor Name</span>
                                            {renderSortIcon('visitor_name')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('purpose')}
                                        className="group cursor-pointer py-3 px-3 hover:text-slate-900 select-none"
                                    >
                                        <div className="flex items-center">
                                            <span>Category / Purpose</span>
                                            {renderSortIcon('purpose')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('date')}
                                        className="group cursor-pointer py-3 px-3 hover:text-slate-900 select-none"
                                    >
                                        <div className="flex items-center">
                                            <span>Visit Date</span>
                                            {renderSortIcon('date')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('code')}
                                        className="group cursor-pointer py-3 px-3 hover:text-slate-900 select-none"
                                    >
                                        <div className="flex items-center">
                                            <span>Pass Code</span>
                                            {renderSortIcon('code')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('status')}
                                        className="group cursor-pointer py-3 px-4 text-right hover:text-slate-900 select-none"
                                    >
                                        <div className="flex items-center justify-end">
                                            <span>Status</span>
                                            {renderSortIcon('status')}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {sortedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs font-semibold text-slate-400">
                                            No past visitors found.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            <td colSpan={5} className="p-0">
                                                <VisitorRow visit={item} fromTab="history" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MONTHLY ACCORDION DISPLAY MODE */}
            {displayMode === 'accordion' && (
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
            )}
        </div>
    );
}
