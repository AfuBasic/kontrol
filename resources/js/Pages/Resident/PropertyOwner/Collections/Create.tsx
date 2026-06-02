import { Head, Link, useForm } from '@inertiajs/react';
import { index, store } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { 
    ArrowLeftIcon, 
    UserIcon, 
    BuildingOfficeIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetItem {
    type: 'user' | 'property';
    id: number;
    name: string;
}

interface Props {
    residents: Array<{ id: number; name: string }>;
    properties: Array<{ id: number; name: string }>;
}

export default function Create({ residents, properties }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        amount: '',
        due_at: '',
        applies_to: 'all', // 'all' | 'target'
        targets: [] as Array<{ type: 'user' | 'property'; id: number }>,
    });

    const [selectedTargets, setSelectedTargets] = useState<TargetItem[]>([]);
    const [targetTypeToAdd, setTargetTypeToAdd] = useState<'user' | 'property'>('user');
    const [selectedItemId, setSelectedItemId] = useState<string>('');

    const handleAddTarget = () => {
        if (!selectedItemId) return;
        const id = parseInt(selectedItemId);
        
        // Find name
        let name = '';
        if (targetTypeToAdd === 'user') {
            name = residents.find(r => r.id === id)?.name || '';
        } else {
            name = properties.find(p => p.id === id)?.name || '';
        }

        // Check if duplicate
        if (selectedTargets.some(t => t.type === targetTypeToAdd && t.id === id)) {
            return;
        }

        const newItem: TargetItem = { type: targetTypeToAdd, id, name };
        const updatedTargets = [...selectedTargets, newItem];
        setSelectedTargets(updatedTargets);
        
        // Sync with useForm
        setData('targets', updatedTargets.map(t => ({ type: t.type, id: t.id })));
        setSelectedItemId('');
    };

    const handleRemoveTarget = (index: number) => {
        const updatedTargets = selectedTargets.filter((_, i) => i !== index);
        setSelectedTargets(updatedTargets);
        
        // Sync with useForm
        setData('targets', updatedTargets.map(t => ({ type: t.type, id: t.id })));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <div className="mx-auto max-w-2xl pb-24">
            <Head title="Create Bill Collection" />

            <div className="mb-6 flex items-center gap-2">
                <Link
                    href={index.url()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-655 hover:bg-slate-50 shadow-xs ring-1 ring-slate-100 transition-all"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">Create Custom Bill</h1>
                    <p className="text-xs text-slate-550 font-bold">Charge rent or service fees to your occupants.</p>
                </div>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
            >
                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Bill Name / Title
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                            placeholder="e.g. June Rent, Utility Fee"
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Billing Description
                        </label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                            placeholder="Provide any context about this charge sheet..."
                        />
                        {errors.description && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Amount (₦)
                            </label>
                            <input
                                type="number"
                                id="amount"
                                required
                                min="1"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                                placeholder="50000"
                            />
                            {errors.amount && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.amount}</p>}
                        </div>

                        {/* Due Date */}
                        <div>
                            <label htmlFor="due_at" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="due_at"
                                required
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // minimum 1 day in future
                                value={data.due_at}
                                onChange={(e) => setData('due_at', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                            />
                            {errors.due_at && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.due_at}</p>}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Applies to Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Billing Target Range
                        </label>
                        <div className="mt-3 flex rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-100">
                            <button
                                type="button"
                                onClick={() => setData('applies_to', 'all')}
                                className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all ${
                                    data.applies_to === 'all'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                All Managed Residents
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('applies_to', 'target')}
                                className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all ${
                                    data.applies_to === 'target'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Selected Properties / Residents
                            </button>
                        </div>
                        {errors.applies_to && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.applies_to}</p>}
                    </div>

                    {/* Target List Setup */}
                    <AnimatePresence>
                        {data.applies_to === 'target' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <h4 className="text-xs font-black text-slate-900">Add Target Object</h4>
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                                        <div className="w-full sm:w-1/3">
                                            <label htmlFor="target-type" className="block text-[10px] font-bold text-slate-550 uppercase">Type</label>
                                            <select
                                                id="target-type"
                                                value={targetTypeToAdd}
                                                onChange={(e) => {
                                                    setTargetTypeToAdd(e.target.value as any);
                                                    setSelectedItemId('');
                                                }}
                                                className="mt-1.5 block w-full rounded-xl border-slate-200 px-3 py-2 text-xs bg-white"
                                            >
                                                <option value="user">Resident</option>
                                                <option value="property">Property</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="target-item" className="block text-[10px] font-bold text-slate-555 uppercase">Target Entry</label>
                                            <select
                                                id="target-item"
                                                value={selectedItemId}
                                                onChange={(e) => setSelectedItemId(e.target.value)}
                                                className="mt-1.5 block w-full rounded-xl border-slate-200 px-3 py-2 text-xs bg-white"
                                            >
                                                <option value="">Select target...</option>
                                                {targetTypeToAdd === 'user'
                                                    ? residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                                                    : properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                                }
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddTarget}
                                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-slate-905 px-4 text-xs font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {selectedTargets.length > 0 ? (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Selected Target Scope</label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                                            {selectedTargets.map((target, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-slate-800 shadow-sm ring-1 ring-slate-150"
                                                >
                                                    {target.type === 'user' ? (
                                                        <UserIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    ) : (
                                                        <BuildingOfficeIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                    )}
                                                    <span className="font-bold">{target.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTarget(idx)}
                                                        className="ml-1 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <XMarkIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-rose-500 font-bold">Please select at least one target resident or property.</p>
                                )}
                                {errors.targets && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.targets}</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                    <Link
                        href={index.url()}
                        className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-550 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || (data.applies_to === 'target' && selectedTargets.length === 0)}
                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition-all"
                    >
                        {processing ? 'Publishing...' : 'Publish Bill'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
