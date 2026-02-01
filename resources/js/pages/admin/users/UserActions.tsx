import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { destroy, edit } from '@/actions/App/Http/Controllers/Admin/UserController';
import ConfirmationModal from '@/components/ConfirmationModal';

type User = {
    id: number;
    name: string;
    email: string;
};

import type { SharedData } from '@/types';

export default function UserActions({ user }: { user: User }) {
    const { auth } = usePage<SharedData>().props;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const isSelf = user.id === auth.user?.id;

    const handleDelete = () => {
        router.delete(destroy.url({ user: user.id }), {
            preserveScroll: true,
            onSuccess: () => setConfirmingDeletion(false),
        });
    };

    if (isSelf) return null;

    return (
        <>
            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none">
                    <span className="sr-only">Open options</span>
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                </Menu.Button>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <div className="p-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        href={edit.url({ user: user.id })}
                                        className={`${
                                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        <PencilSquareIcon className="mr-2 h-4 w-4 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                        Edit
                                    </Link>
                                )}
                            </Menu.Item>
                        </div>
                        <div className="p-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setConfirmingDeletion(true)}
                                        className={`${
                                            active ? 'bg-red-50 text-red-900' : 'text-red-700'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4 text-red-400 group-hover:text-red-500" aria-hidden="true" />
                                        Remove Admin
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={handleDelete}
                title="Remove Administrator"
                message={`Are you sure you want to remove ${user.name}? They will lose access to the admin panel immediately.`}
                confirmLabel="Remove Admin"
                type="danger"
                isLoading={false}
            />
        </>
    );
}
