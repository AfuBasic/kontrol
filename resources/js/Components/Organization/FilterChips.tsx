import React from 'react';

export interface FilterChipOption {
    id: string;
    label: string;
    count?: number;
    color?: 'mint' | 'amber' | 'slate' | 'red';
}

interface Props {
    options: FilterChipOption[];
    value: string;
    onChange: (id: string) => void;
    variant?: 'category' | 'status';
}

export default function FilterChips({ options, value, onChange, variant = 'category' }: Props) {
    const dotColors = {
        mint: 'bg-emerald-500',
        amber: 'bg-amber-500',
        slate: 'bg-slate-400',
        red: 'bg-rose-500',
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((option) => {
                const isSelected = value === option.id;

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange(option.id)}
                        className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                            isSelected
                                ? 'bg-[#eef4ff] text-[#1a5dbf] border border-[#dce9ff] shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {!isSelected && variant === 'status' && option.color && (
                            <span className={`h-2 w-2 rounded-full ${dotColors[option.color]}`} />
                        )}
                        <span>
                            {option.label}
                            {option.count !== undefined && ` (${option.count})`}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
