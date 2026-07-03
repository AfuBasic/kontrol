import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface Props {
    options: Option[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    label?: string;
    className?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder, label, className }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => String(o.value) === String(value));

    const filteredOptions = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className || ''}`}>
            {label && (
                <label className="mb-1 block text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    {label}
                </label>
            )}
            
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 h-10 text-left"
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-450 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {/* Search Field */}
                    <div className="relative mb-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search options..."
                            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs font-semibold text-slate-800 outline-none focus:border-slate-350"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearch('');
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50 transition"
                        >
                            Clear option
                        </button>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(opt.value));
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                                        String(opt.value) === String(value)
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))
                        ) : (
                            <p className="p-2 text-center text-xs text-slate-400 font-semibold">No results found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
