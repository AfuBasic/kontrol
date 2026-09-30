import { X, AlertCircle } from 'lucide-react';
import React, { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';

interface EmailPillInputProps {
    value: string[];
    onChange: (emails: string[]) => void;
    maxEmails?: number;
    disabled?: boolean;
    error?: string;
    placeholder?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailPillInput({
    value = [],
    onChange,
    maxEmails = 30,
    disabled = false,
    error,
    placeholder = 'Type email and press Enter or comma...',
}: EmailPillInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isLimitReached = value.length >= maxEmails;

    const addEmail = (emailStr: string) => {
        const trimmed = emailStr.trim().toLowerCase();
        if (!trimmed) return false;

        if (!EMAIL_REGEX.test(trimmed)) {
            setLocalError(`"${trimmed}" is not a valid email address.`);
            return false;
        }

        if (value.includes(trimmed)) {
            setLocalError(`"${trimmed}" has already been added.`);
            return false;
        }

        if (value.length >= maxEmails) {
            setLocalError(`Maximum of ${maxEmails} email addresses reached.`);
            return false;
        }

        onChange([...value, trimmed]);
        setLocalError(null);
        return true;
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === 'Tab') {
            if (inputValue.trim()) {
                e.preventDefault();
                if (addEmail(inputValue)) {
                    setInputValue('');
                }
            } else if (e.key === ',') {
                e.preventDefault();
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            e.preventDefault();
            onChange(value.slice(0, -1));
            setLocalError(null);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        if (!text) return;

        // Split by commas, spaces, semicolons, or newlines
        const items = text.split(/[\s,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
        if (items.length === 0) return;

        const nextEmails = [...value];
        let rejectedInvalid = 0;
        let rejectedDuplicate = 0;
        let rejectedLimit = 0;

        for (const item of items) {
            if (!EMAIL_REGEX.test(item)) {
                rejectedInvalid++;
                continue;
            }
            if (nextEmails.includes(item)) {
                rejectedDuplicate++;
                continue;
            }
            if (nextEmails.length >= maxEmails) {
                rejectedLimit++;
                continue;
            }
            nextEmails.push(item);
        }

        onChange(nextEmails);
        setInputValue('');

        if (rejectedLimit > 0) {
            setLocalError(`Limit reached. ${rejectedLimit} email(s) skipped.`);
        } else if (rejectedInvalid > 0) {
            setLocalError(`${rejectedInvalid} invalid email address(es) skipped.`);
        } else if (rejectedDuplicate > 0) {
            setLocalError(`${rejectedDuplicate} duplicate email(s) skipped.`);
        } else {
            setLocalError(null);
        }
    };

    const removeEmail = (indexToRemove: number) => {
        onChange(value.filter((_, idx) => idx !== indexToRemove));
        setLocalError(null);
        inputRef.current?.focus();
    };

    const displayError = error || localError;

    return (
        <div className="w-full space-y-1.5">
            <div
                onClick={() => inputRef.current?.focus()}
                className={`min-h-[96px] w-full cursor-text rounded-2xl border bg-white p-2.5 transition-all flex flex-wrap gap-1.5 items-start ${
                    displayError
                        ? 'border-red-300 ring-2 ring-red-100'
                        : 'border-[#e5e7eb] focus-within:border-[#1a5dbf] focus-within:ring-2 focus-within:ring-[#1a5dbf]/15'
                } ${disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}
            >
                {value.map((email, idx) => (
                    <span
                        key={email}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] border border-[#dce9ff] px-2.5 py-1 text-[13px] font-medium text-[#1a5dbf] transition-all hover:bg-[#e2edff]"
                    >
                        <span>{email}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeEmail(idx);
                                }}
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#1a5dbf]/15 text-[#1a5dbf]"
                                aria-label={`Remove ${email}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </span>
                ))}

                {!isLimitReached && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        disabled={disabled}
                        placeholder={value.length === 0 ? placeholder : 'Add another...'}
                        className="flex-1 min-w-[160px] border-none bg-transparent p-1 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0"
                    />
                )}
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 text-gray-500">
                <div>
                    {displayError ? (
                        <p className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{displayError}</span>
                        </p>
                    ) : (
                        <span>Paste comma or newline-separated emails, or press Enter</span>
                    )}
                </div>
                <span className={`font-medium ${isLimitReached ? 'text-amber-600' : 'text-gray-400'}`}>
                    {value.length}/{maxEmails}
                </span>
            </div>
        </div>
    );
}
