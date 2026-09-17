import { useForm } from '@inertiajs/react';
import { Mail, Calendar, RefreshCw, X, AlertCircle, Sparkles } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const MAX_RECIPIENTS = 20;

export default function BulkInviteModal({ isOpen, onClose }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [emailInput, setEmailInput] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        purpose: '',
        emails: [] as string[],
        valid_from: today,
        valid_until: defaultEnd,
        auto_renew: false,
    });

    const parsedEmails = useMemo(() => {
        if (!emailInput.trim()) return [];
        const raw = emailInput
            .split(/[\n,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        return Array.from(new Set(raw));
    }, [emailInput]);

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validEmails = useMemo(() => parsedEmails.filter(isValidEmail), [parsedEmails]);
    const invalidEmails = useMemo(() => parsedEmails.filter((e) => !isValidEmail(e)), [parsedEmails]);

    const handleApplyEmails = () => {
        const combined = Array.from(new Set([...data.emails, ...validEmails])).slice(0, MAX_RECIPIENTS);
        setData('emails', combined);
        setEmailInput('');
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setData(
            'emails',
            data.emails.filter((e) => e !== emailToRemove),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalEmails = data.emails.length > 0 ? data.emails : validEmails.slice(0, MAX_RECIPIENTS);

        if (finalEmails.length === 0) return;

        setData('emails', finalEmails);
        post('/org/bulk-invites', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
                setEmailInput('');
            },
        });
    };

    if (!isOpen) return null;

    const currentRecipientsCount = data.emails.length > 0 ? data.emails.length : validEmails.length;
    const isOverLimit = currentRecipientsCount > MAX_RECIPIENTS;

    return (
        <ResponsiveSheet isOpen={isOpen} onClose={onClose} title="Bulk Visitor Invite">
            <div className="flex h-full flex-col">
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                        <p className="mb-6 text-sm text-slate-500">
                            Issue individual passes to up to 20 visitor emails with optional 30-day auto-renewal.
                        </p>

                        <div className="space-y-6">
                            {/* Invite Name & Purpose */}
                            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                        Batch / List Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. VIP Conference Guests, Vendor Team"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">Purpose</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Client Onsite Workshop"
                                        value={data.purpose}
                                        onChange={(e) => setData('purpose', e.target.value)}
                                        className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                    />
                                    {errors.purpose && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.purpose}</p>}
                                </div>
                            </div>

                            {/* Recipient Emails Area */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                        Recipient Emails <span className="text-rose-500">*</span>
                                    </label>
                                    <span className={`text-xs font-semibold ${isOverLimit ? 'font-bold text-rose-600' : 'text-slate-500'}`}>
                                        {currentRecipientsCount} / {MAX_RECIPIENTS} max
                                    </span>
                                </div>

                                <textarea
                                    rows={4}
                                    placeholder="Paste recipient emails here (one per line, or comma-separated)..."
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="block w-full rounded-xl border-0 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:ring-inset"
                                />

                                {validEmails.length > 0 && emailInput && (
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            Found {validEmails.length} valid {validEmails.length === 1 ? 'email' : 'emails'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleApplyEmails}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Add to list
                                        </button>
                                    </div>
                                )}

                                {invalidEmails.length > 0 && (
                                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                            Invalid email format: {invalidEmails.slice(0, 3).join(', ')}
                                            {invalidEmails.length > 3 ? '...' : ''}
                                        </span>
                                    </div>
                                )}

                                {data.emails.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {data.emails.map((email) => (
                                            <span
                                                key={email}
                                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                                            >
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmail(email)}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {errors.emails && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.emails}</p>}
                            </div>

                            {/* Validity Period (1 - 30 days) */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">Pass Validity Period</h4>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Valid From</label>
                                        <input
                                            type="date"
                                            min={today}
                                            value={data.valid_from}
                                            onChange={(e) => setData('valid_from', e.target.value)}
                                            className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Valid Until (Max 30 Days)</label>
                                        <input
                                            type="date"
                                            min={data.valid_from}
                                            value={data.valid_until}
                                            onChange={(e) => setData('valid_until', e.target.value)}
                                            className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>
                                {errors.valid_until && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.valid_until}</p>}
                            </div>

                            {/* Auto-renew Toggle */}
                            <div className="flex items-start justify-between rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                                <div className="space-y-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm font-bold text-slate-900">Auto-renew this list</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Automatically issue and email a new 30-day pass to active recipients 24 hours before each cycle expires
                                        (requires active Estate subscription).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={data.auto_renew}
                                    onClick={() => setData('auto_renew', !data.auto_renew)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        data.auto_renew ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            data.auto_renew ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            {errors.auto_renew && <p className="text-xs font-medium text-rose-500">{errors.auto_renew}</p>}
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-slate-100 p-5 sm:px-6">
                        <button
                            type="submit"
                            disabled={processing || currentRecipientsCount === 0 || isOverLimit}
                            className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                        >
                            {processing
                                ? 'Generating Passes...'
                                : `Generate ${currentRecipientsCount} ${currentRecipientsCount === 1 ? 'Pass' : 'Passes'}`}
                        </button>
                    </div>
                </form>
            </div>
        </ResponsiveSheet>
    );
}
