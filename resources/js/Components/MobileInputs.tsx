import type { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface BaseProps {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}

export function MobileInput({ label, icon: Icon, error, className = '', ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">{label}</label>}
            <div className="group relative">
                {Icon && (
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <input
                    {...props}
                    className={`h-14 w-full rounded-[1.25rem] border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 transition-all duration-200 outline-none placeholder:font-medium placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${Icon ? 'pl-12' : 'pl-5'} pr-5 ${error ? 'border-red-200 bg-red-50/30' : ''} ${className} `}
                />
            </div>
            {error && <p className="ml-1 text-[10px] font-bold text-red-500">{error}</p>}
        </div>
    );
}

interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string | number; label: string }[];
}

export function MobileSelect({ label, icon: Icon, error, options, className = '', ...props }: SelectProps) {
    return (
        <div className="space-y-1.5">
            {label && <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">{label}</label>}
            <div className="group relative">
                {Icon && (
                    <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <select
                    {...props}
                    className={`h-14 w-full appearance-none rounded-[1.25rem] border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 transition-all duration-200 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${Icon ? 'pl-12' : 'pl-5'} pr-10 ${error ? 'border-red-200 bg-red-50/30' : ''} ${className} `}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            {error && <p className="ml-1 text-[10px] font-bold text-red-500">{error}</p>}
        </div>
    );
}

export function DarkMobileInput({ label, icon: Icon, error, className = '', ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            <div className="group relative">
                {Icon && (
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <input
                    {...props}
                    className={`h-12 w-full rounded-2xl border-2 border-slate-700/50 bg-slate-800/50 text-sm font-bold text-white transition-all duration-200 outline-none placeholder:font-medium placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/5 ${Icon ? 'pl-11' : 'pl-4'} pr-4 ${className} `}
                />
            </div>
        </div>
    );
}
