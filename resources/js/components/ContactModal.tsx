import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, ExternalLink, ArrowRight, Sparkles, X } from 'lucide-react';
import axios from 'axios';

type Contact = {
    name: string;
    value: string;
};

type GroupedContacts = {
    emails: Contact[];
    phones: Contact[];
    others: Contact[];
};

function getContactType(value: string): 'email' | 'phone' | 'other' {
    if (value.includes('@')) return 'email';
    if ((value.match(/\d/g) || []).length > 3) return 'phone';
    return 'other';
}

function getContactLink(value: string, type: 'email' | 'phone' | 'other'): string {
    if (type === 'email') return `mailto:${value}`;
    if (type === 'phone') {
        const cleanNumber = value.replace(/[^\d+]/g, '');
        return `tel:${cleanNumber}`;
    }
    return '#';
}

function ContactGroup({ title, items, icon: Icon, type }: { title: string; items: Contact[]; icon: any; type: 'email' | 'phone' | 'other' }) {
    if (items.length === 0) return null;

    const gradients = {
        phone: 'from-emerald-400 to-teal-500',
        email: 'from-blue-400 to-indigo-500',
        other: 'from-purple-400 to-pink-500',
    };

    const gradient = gradients[type] || gradients.other;

    return (
        <div className="mb-6 last:mb-0">
            <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br ${gradient} text-white shadow-md`}>
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {items.map((contact, index) => {
                    const contactType = getContactType(contact.value);
                    return (
                        <a
                            key={`${title}-${index}`}
                            href={getContactLink(contact.value, contactType)}
                            className="group relative flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-lg active:scale-[0.98]"
                            target={contactType === 'other' ? '_blank' : undefined}
                            rel={contactType === 'other' ? 'noopener noreferrer' : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition-colors group-hover:bg-linear-to-br group-hover:${gradient} group-hover:text-white`}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900">{contact.name}</p>
                                    <p className="truncate text-sm font-medium text-gray-500">{contact.value}</p>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

// Mock data fallback or loading state
export default function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [estateName, setEstateName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const fetchInProgress = useRef(false);

    useEffect(() => {
        if (isOpen && !fetched && !fetchInProgress.current) {
            fetchInProgress.current = true;
            setLoading(true);
            setLoading(true);
            axios
                .get('/resident/contacts/json')
                .then((response) => {
                    if (response.data) {
                        setContacts(response.data.contacts || []);
                        setEstateName(response.data.estateName || 'Estate');
                    }
                    setFetched(true);
                })
                .catch((error) => {
                    console.error('Failed to fetch contacts', error);
                    // Reset fetched so user can try again if it failed
                    if (error.response?.status !== 429) {
                        setFetched(false);
                    }
                })
                .finally(() => {
                    setLoading(false);
                    fetchInProgress.current = false;
                });
        }
    }, [isOpen, fetched]);

    const grouped = contacts.reduce(
        (acc, contact) => {
            const type = getContactType(contact.value);
            if (type === 'email') acc.emails.push(contact);
            else if (type === 'phone') acc.phones.push(contact);
            else acc.others.push(contact);
            return acc;
        },
        { emails: [], phones: [], others: [] } as GroupedContacts,
    );

    const hasAnyContacts = contacts.length > 0;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="mb-5 flex items-center justify-between">
                                    <Dialog.Title as="h3" className="text-xl leading-6 font-bold text-gray-900">
                                        {loading ? 'Loading...' : estateName ? `${estateName} Contacts` : 'Estate Contacts'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                                    </div>
                                ) : hasAnyContacts ? (
                                    <div className="mt-2">
                                        <ContactGroup title="Phone Numbers" items={grouped.phones} icon={Phone} type="phone" />
                                        <ContactGroup title="Email Addresses" items={grouped.emails} icon={Mail} type="email" />
                                        <ContactGroup title="Other Information" items={grouped.others} icon={Sparkles} type="other" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                                            <ExternalLink className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500">No contact information available.</p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
