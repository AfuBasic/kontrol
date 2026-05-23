import { clsx, type ClassValue } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95',
        secondary: 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-95',
        outline: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-95',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-50 active:scale-95',
        error: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95',
        success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95',
    };

    const sizes = {
        sm: 'px-3 py-2 text-xs rounded-xl gap-1.5',
        md: 'px-5 py-3 text-sm rounded-2xl gap-2',
        lg: 'px-6 py-4 text-base rounded-[1.25rem] gap-2.5',
        xl: 'px-8 py-5 text-lg rounded-[1.5rem] gap-3',
    };

    return (
        <button
            disabled={isLoading || disabled}
            className={cn(
                'relative flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                    >
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        {size !== 'sm' && <span>Processing...</span>}
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        {icon && <span className="shrink-0">{icon}</span>}
                        <span className="truncate">{children}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
