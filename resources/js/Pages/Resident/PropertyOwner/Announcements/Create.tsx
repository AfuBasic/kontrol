import { Head, Link, useForm } from '@inertiajs/react';
import { index, store } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { ArrowLeftIcon, UserIcon, BuildingOfficeIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
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
        title: '',
        body: '',
        applies_to: 'all' as 'all' | 'target',
        targets: [] as Array<{ type: 'user' | 'property'; id: number }>,
    });

    const [selectedTargets, setSelectedTargets] = useState<TargetItem[]>([]);
    const [search, setSearch] = useState('');

    const allItems: TargetItem[] = useMemo(
        () => [
            ...residents.map((r) => ({ type: 'user' as const, id: r.id, name: r.name })),
            ...properties.map((p) => ({ type: 'property' as const, id: p.id, name: p.name })),
        ],
        [residents, properties],
    );

    const filteredResidents = useMemo(() => residents.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())), [residents, search]);

    const filteredProperties = useMemo(() => properties.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [properties, search]);

    const isSelected = (type: 'user' | 'property', id: number) => selectedTargets.some((t) => t.type === type && t.id === id);

    const toggleTarget = (item: TargetItem) => {
        let updated: TargetItem[];
        if (isSelected(item.type, item.id)) {
            updated = selectedTargets.filter((t) => !(t.type === item.type && t.id === item.id));
        } else {
            updated = [...selectedTargets, item];
        }
        setSelectedTargets(updated);
        setData(
            'targets',
            updated.map((t) => ({ type: t.type, id: t.id })),
        );
    };

    const removeTarget = (item: TargetItem) => toggleTarget(item);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <div className="mx-auto max-w-2xl pb-24">
            <Head title="Create Announcement" />

            <div className="mb-6 flex items-center gap-3">
                <Link
                    href={index.url()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">New Broadcast</h1>
                    <p className="text-xs text-slate-500">Send custom updates to occupants.</p>
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
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                            Broadcast Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            placeholder="e.g. Repairs Notice, General Estate Update"
                        />
                        {errors.title && <p className="mt-1 text-xs font-bold text-rose-600">{errors.title}</p>}
                    </div>

                    {/* Body */}
                    <div>
                        <label htmlFor="body" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                            Bulletin Content
                        </label>
                        <textarea
                            id="body"
                            required
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            rows={6}
                            className="mt-2 block w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            placeholder="Type details of your announcement here..."
                        />
                        {errors.body && <p className="mt-1 text-xs font-bold text-rose-600">{errors.body}</p>}
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Target Audience */}
                    <div>
                        <label htmlFor="applies_to" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                            Target Audience
                        </label>
                        <select
                            id="applies_to"
                            value={data.applies_to}
                            onChange={(e) => setData('applies_to', e.target.value as 'all' | 'target')}
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                        >
                            <option value="all">All My Residents</option>
                            <option value="target">Specific Targets</option>
                        </select>
                        {errors.applies_to && <p className="mt-1 text-xs font-bold text-rose-600">{errors.applies_to}</p>}
                    </div>

                    {/* Multi-select Target Picker */}
                    <AnimatePresence>
                        {data.applies_to === 'target' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3">
                                    {/* Search */}
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search residents or properties..."
                                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                        />
                                    </div>

                                    {/* Checkboxes list */}
                                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50">
                                        {filteredResidents.length === 0 && filteredProperties.length === 0 ? (
                                            <p className="py-8 text-center text-xs font-bold text-slate-400">No matches found</p>
                                        ) : (
                                            <>
                                                {filteredResidents.length > 0 && (
                                                    <div>
                                                        <p className="sticky top-0 bg-slate-100 px-4 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                            Residents
                                                        </p>
                                                        {filteredResidents.map((r) => {
                                                            const selected = isSelected('user', r.id);
                                                            return (
                                                                <button
                                                                    key={r.id}
                                                                    type="button"
                                                                    onClick={() => toggleTarget({ type: 'user', id: r.id, name: r.name })}
                                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white ${selected ? 'bg-indigo-50/60' : ''}`}
                                                                >
                                                                    <div
                                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}
                                                                    >
                                                                        {selected && <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />}
                                                                    </div>
                                                                    <UserIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                                                                    <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {filteredProperties.length > 0 && (
                                                    <div>
                                                        <p className="sticky top-0 bg-slate-100 px-4 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                            Properties
                                                        </p>
                                                        {filteredProperties.map((p) => {
                                                            const selected = isSelected('property', p.id);
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => toggleTarget({ type: 'property', id: p.id, name: p.name })}
                                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white ${selected ? 'bg-emerald-50/60' : ''}`}
                                                                >
                                                                    <div
                                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}
                                                                    >
                                                                        {selected && <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />}
                                                                    </div>
                                                                    <BuildingOfficeIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                                                                    <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Selected chips */}
                                    {selectedTargets.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                                            {selectedTargets.map((target, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-xs ring-1 ring-slate-200"
                                                >
                                                    {target.type === 'user' ? (
                                                        <UserIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                    ) : (
                                                        <BuildingOfficeIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                    )}
                                                    {target.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTarget(target)}
                                                        className="ml-0.5 text-slate-400 hover:text-rose-500"
                                                    >
                                                        <XMarkIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-rose-500">Select at least one target above.</p>
                                    )}
                                    {errors.targets && <p className="mt-1 text-xs font-bold text-rose-600">{errors.targets}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                    <Link href={index.url()} className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || (data.applies_to === 'target' && selectedTargets.length === 0)}
                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                    >
                        {processing ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
