import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/ResidentLayout';
import { Mail, Phone, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

type Contact = {
    name: string;
    value: string;
};

type Props = {
    contacts: Contact[];
    estateName: string;
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

function ContactGroup({
    title,
    items,
    icon: Icon,
    delayStart,
    type,
}: {
    title: string;
    items: Contact[];
    icon: any;
    delayStart: number;
    type: 'email' | 'phone' | 'other';
}) {
    if (items.length === 0) return null;

    const gradients = {
        phone: 'from-emerald-400 to-teal-500',
        email: 'from-blue-400 to-indigo-500',
        other: 'from-purple-400 to-pink-500',
    };

    const gradient = gradients[type] || gradients.other;

    return (
        <div className="mb-8 last:mb-0">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: delayStart, ease: 'easeOut' }}
                className="mb-4 flex items-center gap-3"
            >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br ${gradient} text-white shadow-md`}>
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
                {items.map((contact, index) => {
                    const contactType = getContactType(contact.value);
                    return (
                        <motion.div
                            key={`${title}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: delayStart + 0.1 + index * 0.05, ease: 'easeOut' }}
                        >
                            <a
                                href={getContactLink(contact.value, contactType)}
                                className="group relative flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 active:scale-[0.98]"
                                target={contactType === 'other' ? '_blank' : undefined}
                                rel={contactType === 'other' ? 'noopener noreferrer' : undefined}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors duration-300 hover:bg-linear-to-br hover:${gradient} hover:text-white`}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 group-hover:text-gray-800">{contact.name}</p>
                                        <p className="truncate text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-600">
                                            {contact.value}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </a>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Contacts({ contacts, estateName }: Props) {
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
        <ResidentLayout>
            <Head title="Estate Contacts" />

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-10 shadow-xl sm:px-10"
            >
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10">
                    <Link
                        href="/resident/home"
                        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-white/20"
                    >
                        <ArrowRight className="h-3 w-3 rotate-180" />
                        Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Estate Contacts</h1>
                    <p className="mt-2 text-lg text-indigo-100">
                        Reach out to the right people at <span className="font-semibold text-white">{estateName}</span>.
                    </p>
                </div>
            </motion.div>

            {/* Contacts Lists */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                {hasAnyContacts ? (
                    <div className="pb-10">
                        <ContactGroup title="Phone Numbers" items={grouped.phones} icon={Phone} delayStart={0.3} type="phone" />
                        <ContactGroup title="Email Addresses" items={grouped.emails} icon={Mail} delayStart={0.5} type="email" />
                        <ContactGroup title="Other Information" items={grouped.others} icon={Sparkles} delayStart={0.7} type="other" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50/50 p-16 text-center"
                    >
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                            <ExternalLink className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-gray-900">No contacts yet</h3>
                        <p className="max-w-xs text-gray-500">It looks like your estate administrator hasn't added any contact information yet.</p>
                    </motion.div>
                )}
            </motion.div>
        </ResidentLayout>
    );
}
