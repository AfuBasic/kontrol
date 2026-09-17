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
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                            isSelected
                                ? 'bg-[#0b4aa2] font-semibold text-white'
                                : 'border border-slate-200/80 bg-white font-medium text-slate-600 hover:bg-slate-50'
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
