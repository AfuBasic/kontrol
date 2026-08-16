import { Plus, Search } from 'lucide-react';
import VisitorAvatar from '@/Components/Visitors/VisitorAvatar';
import { deriveCategory } from '@/Utils/visitorTheme';

type RecentVisitor = {
    visitor_name: string;
    visitor_phone: string | null;
    purpose: string | null;
    type: string;
};

type Props = {
    recentVisitors: RecentVisitor[];
    onInvite: () => void;
    onInviteAgain: (visitor: RecentVisitor) => void;
    onOpenSearch?: () => void;
};

export default function QuickActions({ recentVisitors, onInvite, onInviteAgain, onOpenSearch }: Props) {
    return (
        <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Quick Actions</h3>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onInvite}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-primary-700 active:scale-98"
                >
                    <Plus className="h-4 w-4" />
                    <span>Invite Visitor</span>
                </button>

                {onOpenSearch && (
                    <button
                        onClick={onOpenSearch}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span>Search</span>
                    </button>
                )}
            </div>

            {/* 1-Tap Invite Again Chips (Horizontal Scroll with Avatar) */}
            {recentVisitors.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Invite Again</p>
                    <div className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                        {recentVisitors.map((visitor) => {
                            const category = deriveCategory(visitor.purpose, visitor.type);
                            return (
                                <button
                                    key={visitor.visitor_name}
                                    onClick={() => onInviteAgain(visitor)}
                                    className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30"
                                >
                                    <VisitorAvatar category={category} name={visitor.visitor_name} size="sm" />
                                    <span className="text-xs font-bold text-slate-900">{visitor.visitor_name}</span>
                                    <Plus className="h-3.5 w-3.5 text-primary-600" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
