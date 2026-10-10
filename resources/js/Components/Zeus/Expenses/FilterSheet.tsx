import { useEffect, useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';
import { currentMonth } from '@/Lib/expenses';
import type { Category, Filters } from './types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    categories: Category[];
    onApply: (changes: Partial<Filters>) => void;
};

const field =
    'w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-base text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';
const label = 'mb-1.5 block text-[11px] font-bold tracking-widest text-slate-400 uppercase';

export default function FilterSheet({ isOpen, onClose, filters, categories, onApply }: Props) {
    const [category, setCategory] = useState('');
    const [allTime, setAllTime] = useState(false);
    const [archived, setArchived] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setCategory(filters.category_id ? String(filters.category_id) : '');
        setAllTime(filters.month === 'all');
        setArchived(filters.archived);
    }, [isOpen, filters.category_id, filters.month, filters.archived]);

    function apply() {
        onApply({
            category_id: category ? Number(category) : null,
            month: allTime ? 'all' : filters.month === 'all' ? currentMonth() : filters.month,
            archived,
        });
        onClose();
    }

    return (
        <MobileSheet isOpen={isOpen} onClose={onClose} title="Filters" theme="dark">
            <div className="space-y-5">
                <div>
                    <label htmlFor="filter-category" className={label}>
                        Category
                    </label>
                    <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <Toggle label="All time" hint="Ignore the month and show every expense." checked={allTime} onChange={setAllTime} />
                <Toggle label="Archived only" hint="Show archived expenses so you can restore them." checked={archived} onChange={setArchived} />

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => {
                            onApply({ category_id: null, archived: false });
                            onClose();
                        }}
                        className="min-h-12 flex-1 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-200"
                    >
                        Clear
                    </button>
                    <button type="button" onClick={apply} className="min-h-12 flex-[2] rounded-xl bg-primary-600 px-4 text-base font-bold text-white">
                        Apply
                    </button>
                </div>
            </div>
        </MobileSheet>
    );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="flex min-h-12 cursor-pointer items-start justify-between gap-4">
            <span>
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>
            </span>
            <span className="relative mt-0.5 inline-flex shrink-0 items-center">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-primary-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </span>
        </label>
    );
}
