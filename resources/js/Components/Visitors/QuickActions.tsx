import { Plus, Search } from 'lucide-react';

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
        <div className="space-y-3 py-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onInvite}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
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

            {/* 1-Tap Invite Again Chips */}
            {recentVisitors.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400">Invite Again</p>
                    <div className="flex flex-wrap gap-1.5">
                        {recentVisitors.map((visitor) => (
                            <button
                                key={visitor.visitor_name}
                                onClick={() => onInviteAgain(visitor)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <Plus className="h-3 w-3 text-slate-400" />
                                <span>{visitor.visitor_name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
