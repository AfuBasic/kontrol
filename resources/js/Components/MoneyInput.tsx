import React, { useState, useEffect } from 'react';

interface MoneyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    error?: string;
    label?: string;
}

export default function MoneyInput({ value, onChange, placeholder = '0.00', className = '', required = false, error, label }: MoneyInputProps) {
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

        // Prevent multiple decimal points
        const parts = rawValue.split('.');
        const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');

        // Update parent state with clean numeric value
        onChange(cleanValue);

        // Update local display value with commas
        setDisplayValue(formatValue(cleanValue));
    };

    return (
        <div className="w-full">
            {label && <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{label}</label>}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-8">
                    <span className="font-bold text-slate-400">₦</span>
                </div>
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    className={`block w-full rounded-2xl border-0 bg-slate-50 py-5 pr-8 pl-14 text-slate-900 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#1F6FDB] ${className}`}
                    placeholder={placeholder}
                    required={required}
                />
            </div>
            {error && <p className="mt-2 text-sm font-bold text-red-500">{error}</p>}
        </div>
    );
}
