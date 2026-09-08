import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
    error?: string;
    icon?: LucideIcon;
    rightElement?: React.ReactNode;
    inputSize?: 'sm' | 'md' | 'lg';
    wrapperClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    {
        label,
        description,
        error,
        icon: Icon,
        rightElement,
        inputSize = 'md',
        className = '',
        wrapperClassName = '',
        id,
        required,
        disabled,
        ...props
    },
    ref
) {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

    const sizeClasses = {
        sm: 'py-2 text-xs rounded-xl min-h-[36px]',
        md: 'py-2.5 text-xs font-semibold rounded-xl min-h-[42px]',
        lg: 'py-3.5 text-sm font-semibold rounded-2xl min-h-[48px]',
    }[inputSize];

    const iconSizeClasses = {
        sm: 'h-3.5 w-3.5 left-3',
        md: 'h-4 w-4 left-3.5',
        lg: 'h-4 w-4 left-4',
    }[inputSize];

    const paddingClasses = Icon
        ? inputSize === 'sm'
            ? 'pl-8 pr-3.5'
            : inputSize === 'lg'
              ? 'pl-11 pr-4'
              : 'pl-9.5 pr-3.5'
        : 'px-3.5';

    return (
        <div className={`w-full ${wrapperClassName}`}>
            {label && (
                <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-slate-700">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            {description && (
                <p className="-mt-0.5 mb-1.5 text-[11px] text-slate-400 leading-normal">
                    {description}
                </p>
            )}

            <div className="relative flex items-center">
                {Icon && (
                    <Icon
                        className={`pointer-events-none absolute text-slate-400 ${iconSizeClasses}`}
                        aria-hidden="true"
                    />
                )}

                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    required={required}
                    className={`block w-full border bg-white text-slate-800 shadow-2xs transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                        error
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 hover:border-slate-300'
                    } ${sizeClasses} ${paddingClasses} ${rightElement ? 'pr-10' : ''} ${className}`}
                    {...props}
                />

                {rightElement && (
                    <div className="absolute right-3 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
            )}
        </div>
    );
});

export default TextInput;
