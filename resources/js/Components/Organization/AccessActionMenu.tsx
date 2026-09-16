import { Menu, Transition } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { Plus, UserPlus, Users, CalendarDays, ChevronDown } from 'lucide-react';
import React, { Fragment } from 'react';

interface Props {
    onAddPerson?: () => void;
    onInviteVisitor?: () => void;
    onInviteMultiple?: () => void;
}

export default function AccessActionMenu({ onAddPerson, onInviteVisitor, onInviteMultiple }: Props) {
    const handleAction = (action: 'add_person' | 'invite_visitor' | 'invite_multiple') => {
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
        <Menu as="div" className="relative inline-block text-left z-10">
            <div>
                <Menu.Button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 hover:shadow-md active:scale-95">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add / Invite</span>
                    <span className="sm:hidden">Add</span>
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-slate-100 rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/5 focus:outline-none">
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => handleAction('invite_visitor')}
                                    className={`${
                                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white shadow-xs ring-1 ring-slate-200' : 'bg-slate-50'}`}>
                                        <CalendarDays className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span>Invite visitor</span>
                                        <span className="text-[10px] text-slate-500 font-normal">Temporary one-time pass</span>
                                    </div>
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => handleAction('invite_multiple')}
                                    className={`${
                                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white shadow-xs ring-1 ring-slate-200' : 'bg-slate-50'}`}>
                                        <Users className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span>Bulk invite</span>
                                        <span className="text-[10px] text-slate-500 font-normal">Invite multiple visitors</span>
                                    </div>
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => handleAction('add_person')}
                                    className={`${
                                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white shadow-xs ring-1 ring-slate-200' : 'bg-slate-50'}`}>
                                        <UserPlus className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span>Add person</span>
                                        <span className="text-[10px] text-slate-500 font-normal">Staff, member, or resident</span>
                                    </div>
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
