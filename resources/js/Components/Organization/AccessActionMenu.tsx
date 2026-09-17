import { router } from '@inertiajs/react';
import { Plus, UserPlus, Users, CalendarDays, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import ResponsiveSheet from './ResponsiveSheet';

interface Props {
    onAddPerson?: () => void;
    onInviteVisitor?: () => void;
    onInviteMultiple?: () => void;
}

export default function AccessActionMenu({ onAddPerson, onInviteVisitor, onInviteMultiple }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (action: 'add_person' | 'invite_visitor' | 'invite_multiple') => {
        setIsOpen(false);
        if (action === 'add_person') {
            if (onAddPerson) onAddPerson();
            else router.get('/org/access-list', { action: 'add_person' });
        } else if (action === 'invite_visitor') {
            if (onInviteVisitor) onInviteVisitor();
            else router.get('/org/visitors', { action: 'invite_visitor' });
        } else if (action === 'invite_multiple') {
            if (onInviteMultiple) onInviteMultiple();
            else router.get('/org/visitors', { action: 'invite_multiple' });
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#0b4aa2] px-3.5 text-[13px] font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add / Invite</span>
                <span className="sm:hidden">Add</span>
                <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
            </button>

            <ResponsiveSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Action" maxWidth="sm">
                <div className="flex flex-col gap-2 pt-2">
                    <button
                        onClick={() => handleAction('invite_visitor')}
                        className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-xs ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98]"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">Invite visitor</span>
                            <span className="text-xs font-medium text-slate-500">Temporary one-time pass</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('invite_multiple')}
                        className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-xs ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98]"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">Bulk invite</span>
                            <span className="text-xs font-medium text-slate-500">Invite multiple visitors at once</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('add_person')}
                        className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-xs ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98]"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">Add person</span>
                            <span className="text-xs font-medium text-slate-500">Staff, member, or resident</span>
                        </div>
                    </button>
                </div>
            </ResponsiveSheet>
        </>
    );
}
