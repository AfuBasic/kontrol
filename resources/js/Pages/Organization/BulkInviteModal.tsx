import { useForm } from '@inertiajs/react';
import { Plus, X, Trash2 } from 'lucide-react';
import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BulkInviteModal({ isOpen, onClose }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        visitors: [{ visitor_name: '', visitor_phone: '' }],
    });

    if (!isOpen) return null;

    const handleAddVisitor = () => {
        setData('visitors', [...data.visitors, { visitor_name: '', visitor_phone: '' }]);
    };

    const handleRemoveVisitor = (index: number) => {
        if (data.visitors.length > 1) {
            setData('visitors', data.visitors.filter((_, i) => i !== index));
        }
    };

    const handleVisitorChange = (index: number, field: 'visitor_name' | 'visitor_phone', value: string) => {
        const newVisitors = [...data.visitors];
        newVisitors[index][field] = value;
        setData('visitors', newVisitors);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/org/visitors/bulk', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-xs sm:items-center sm:p-4">
            <div className="max-h-[88vh] w-full max-w-2xl flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl sm:rounded-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 pb-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-950">Bulk Invite Visitors</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Create multiple temporary passes sharing the same date and purpose.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Shared Details */}
                        <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Visit Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="mt-2 block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:leading-6"
                                />
                                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">Purpose</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Annual Conference"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    className="mt-2 block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:leading-6"
                                />
                                {errors.purpose && <p className="mt-1 text-xs text-rose-500">{errors.purpose}</p>}
                            </div>
                        </div>

                        {/* Dynamic Visitors List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Visitors List
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddVisitor}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add row
                                </button>
                            </div>

                            <div className="space-y-3">
                                {data.visitors.map((visitor, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Visitor Name *"
                                                value={visitor.visitor_name}
                                                onChange={(e) => handleVisitorChange(index, 'visitor_name', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:leading-6"
                                            />
                                            {errors[`visitors.${index}.visitor_name` as keyof typeof errors] && (
                                                <p className="mt-1 text-xs text-rose-500">
                                                    {errors[`visitors.${index}.visitor_name` as keyof typeof errors]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="tel"
                                                placeholder="Phone (optional)"
                                                value={visitor.visitor_phone}
                                                onChange={(e) => handleVisitorChange(index, 'visitor_phone', e.target.value)}
                                                className="block w-full rounded-xl border-0 py-2.5 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:leading-6"
                                            />
                                            {errors[`visitors.${index}.visitor_phone` as keyof typeof errors] && (
                                                <p className="mt-1 text-xs text-rose-500">
                                                    {errors[`visitors.${index}.visitor_phone` as keyof typeof errors]}
                                                </p>
                                            )}
                                        </div>
                                        {data.visitors.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVisitor(index)}
                                                className="mt-1 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                title="Remove Visitor"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 p-6 bg-slate-50 shrink-0">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                        >
                            {processing ? 'Generating Passes...' : `Generate ${data.visitors.length} ${data.visitors.length === 1 ? 'Pass' : 'Passes'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
