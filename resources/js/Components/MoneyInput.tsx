import React, { useState, useEffect } from 'react';

interface MoneyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    error?: string;
    label?: string;
    id?: string;
    autoFocus?: boolean;
    /** The symbol or currency code shown inside the field. Defaults to the naira sign. */
    prefix?: string;
    /** "light" is the original large field; "dark" is the compact one for the Zeus dark theme. */
    tone?: 'light' | 'dark';
    /** Cut anything typed after this many decimal places. Unlimited when left out. */
    maxDecimals?: number;
}

export default function MoneyInput({
    value,
    onChange,
    placeholder = '0.00',
    className = '',
    required = false,
    error,
    label,
    id,
    autoFocus,
    prefix = '₦',
    tone = 'light',
    maxDecimals,
}: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // Format value with commas
    const formatValue = (val: string | number) => {
        if (!val && val !== 0) return '';
        const stringVal = val.toString().replace(/,/g, '');
        const parts = stringVal.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Initialize display value
    useEffect(() => {
        setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // Remove all non-numeric characters except decimal point
        const rawValue = input.replace(/[^0-9.]/g, '');

        // Prevent multiple decimal points, and cap the decimals when asked to
        const parts = rawValue.split('.');
        const decimals = parts.length > 1 ? (maxDecimals === undefined ? parts[1] : parts[1].slice(0, maxDecimals)) : '';
        const cleanValue = parts[0] + (parts.length > 1 ? '.' + decimals : '');

        // Update parent state with clean numeric value
        onChange(cleanValue);

        // Update local display value with commas
        setDisplayValue(formatValue(cleanValue));
    };

    const dark = tone === 'dark';
    const prefixWidth = prefix === '' ? 'pl-3.5' : prefix.length > 1 ? 'pl-12' : 'pl-9';

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    {label}
                </label>
            )}
            <div className="relative">
                {prefix !== '' && (
                    <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center ${dark ? 'pl-3.5' : 'pl-8'}`}>
                        <span className={dark ? 'text-sm font-bold text-slate-400' : 'font-bold text-slate-400'}>{prefix}</span>
                    </div>
                )}
                <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    value={displayValue}
                    onChange={handleChange}
                    className={
                        dark
                            ? `block w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2.5 pr-3.5 ${prefixWidth} text-sm text-white tabular-nums placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none ${className}`
                            : `block w-full rounded-2xl border-0 bg-slate-50 py-5 pr-8 pl-14 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB] ${className}`
                    }
                    placeholder={placeholder}
                    required={required}
                />
            </div>
            {error && <p className="mt-2 text-sm font-bold text-red-500">{error}</p>}
        </div>
    );
}
