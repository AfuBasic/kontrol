import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseProps {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}

export function MobileInput({ label, icon: Icon, error, className = '', ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500 text-slate-400">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <input
                    {...props}
                    className={`
                        w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] 
                        text-slate-900 text-sm font-bold placeholder:text-slate-300 placeholder:font-medium
                        focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 
                        transition-all duration-200 outline-none
                        ${Icon ? 'pl-12' : 'pl-5'} pr-5
                        ${error ? 'border-red-200 bg-red-50/30' : ''}
                        ${className}
                    `}
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
            {label && (
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500 text-slate-400 pointer-events-none">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <select
                    {...props}
                    className={`
                        w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] 
                        text-slate-900 text-sm font-bold appearance-none
                        focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 
                        transition-all duration-200 outline-none
                        ${Icon ? 'pl-12' : 'pl-5'} pr-10
                        ${error ? 'border-red-200 bg-red-50/30' : ''}
                        ${className}
                    `}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-400 text-slate-500">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <input
                    {...props}
                    className={`
                        w-full h-12 bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl 
                        text-white text-sm font-bold placeholder:text-slate-600 placeholder:font-medium
                        focus:bg-slate-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 
                        transition-all duration-200 outline-none
                        ${Icon ? 'pl-11' : 'pl-4'} pr-4
                        ${className}
                    `}
                />
            </div>
        </div>
    );
}
