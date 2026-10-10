import { ArchiveBoxIcon, CheckIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Zeus/ExpenseCategoryController';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import type { Category } from './types';

type Props = { isOpen: boolean; onClose: () => void; categories: Category[] };

const field =
    'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';

export default function CategoryModal({ isOpen, onClose, categories }: Props) {
    const add = useForm({ name: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState('');
    const [renameError, setRenameError] = useState<string | null>(null);
    const [archivingId, setArchivingId] = useState<number | null>(null);

    function submitNew(event: FormEvent) {
        event.preventDefault();
        add.post(store.url(), { preserveScroll: true, preserveState: true, onSuccess: () => add.reset() });
    }

    function startRename(category: Category) {
        setEditingId(category.id);
        setDraft(category.name);
        setRenameError(null);
    }

    function saveRename(category: Category) {
        router.put(
            update.url(category.id),
            { name: draft },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setEditingId(null),
                onError: (errors) => setRenameError(errors.name ?? 'Could not rename this category.'),
            },
        );
    }

    function archive(category: Category) {
        router.delete(destroy.url(category.id), { preserveScroll: true, preserveState: true, onFinish: () => setArchivingId(null) });
    }

    return (
        <ZeusModal
            isOpen={isOpen}
            onClose={onClose}
            title="Categories"
            subtitle="Rename or archive them. Archived ones stay on the expenses already filed under them."
            size="md"
        >
            <div className="space-y-4">
                <form onSubmit={submitNew} className="flex gap-2">
                    <div className="min-w-0 flex-1">
                        <label htmlFor="new-category" className="sr-only">
                            New category name
                        </label>
                        <input
                            id="new-category"
                            value={add.data.name}
                            maxLength={80}
                            onChange={(e) => add.setData('name', e.target.value)}
                            placeholder="New category"
                            className={field}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={add.data.name.trim() === '' || add.processing}
                        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add
                    </button>
                </form>
                {add.errors.name && <p className="-mt-2 text-xs text-rose-400">{add.errors.name}</p>}

                <ul className="space-y-2">
                    {categories.map((category) => (
                        <li key={category.id} className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2">
                            {editingId === category.id ? (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={draft}
                                            maxLength={80}
                                            autoFocus
                                            onChange={(e) => setDraft(e.target.value)}
                                            aria-label={`Rename ${category.name}`}
                                            className={`${field} min-h-11 py-2`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => saveRename(category)}
                                            aria-label="Save name"
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white"
                                        >
                                            <CheckIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            aria-label="Cancel"
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {renameError && <p className="mt-1 text-xs text-rose-400">{renameError}</p>}
                                </div>
                            ) : archivingId === category.id ? (
                                <div className="flex items-center gap-2">
                                    <p className="min-w-0 flex-1 text-sm text-slate-200">
                                        Archive <span className="font-semibold">{category.name}</span>? Old expenses keep it.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setArchivingId(null)}
                                        className="min-h-11 rounded-lg border border-slate-600 px-3 text-sm font-semibold text-slate-200"
                                    >
                                        Keep
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => archive(category)}
                                        className="min-h-11 rounded-lg bg-rose-600 px-3 text-sm font-bold text-white"
                                    >
                                        Archive
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className="min-w-0 flex-1 py-2 text-sm font-medium break-words text-white">{category.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => startRename(category)}
                                        aria-label={`Rename ${category.name}`}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setArchivingId(category.id)}
                                        aria-label={`Archive ${category.name}`}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-rose-300"
                                    >
                                        <ArchiveBoxIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </ZeusModal>
    );
}
