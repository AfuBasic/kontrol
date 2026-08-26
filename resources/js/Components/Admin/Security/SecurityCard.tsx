import {
    ShieldCheck,
    Mail,
    Phone,
    MapPin,
    Pencil,
    Send,
    EllipsisVertical,
    UserMinus,
    Trash2,
    Eye,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import React from 'react';
import { usePermission } from '@/Hooks/usePermission';

type SecurityPerson = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    phone: string | null;
    badge_number: string | null;
    zone_id?: number | null;
    zone_name?: string | null;
    status: 'pending' | 'accepted' | 'inactive';
    suspended_at: string | null;
    created_at: string;
};

interface SecurityCardProps {
    person: SecurityPerson;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onToggleSuspend: (id: number) => void;
    onDeletePerson: (id: number) => void;
    onResendInvitation: (id: number) => void;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    index: number;
}

export default function SecurityCard({
    person,
    isSelected,
    onToggleSelect,
    onToggleSuspend,
    onDeletePerson,
    onResendInvitation,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    index: cardIndex,
}: SecurityCardProps) {
    const { can } = usePermission();
    const initial = person.name ? person.name.charAt(0).toUpperCase() : 'S';

    const bgColors = [
        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    ];
    const avatarColor = bgColors[cardIndex % bgColors.length];

    const getStatusBadge = () => {
        if (person.status === 'inactive') {
            return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40';
        }
        if (person.status === 'accepted') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40';
        }
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40';
    };

    return (
        <div
            className={`relative flex flex-col gap-3.5 rounded-2xl border bg-white p-4 transition-all duration-200 shadow-xs dark:bg-slate-900 ${
                isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/10 dark:border-slate-100 dark:ring-slate-100/10'
                    : 'border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
        >
            {/* Top Row: Checkbox, Avatar, Name, Status Badge, Action Button */}
            <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 items-start gap-3">
                    {can('security.delete') && (
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelect(person.id)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:checked:bg-slate-100 dark:checked:text-slate-900"
                            />
                        </div>
                    )}

                    {/* Avatar */}
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm select-none ${avatarColor}`}
                    >
                        {initial}
                    </div>

                    {/* Name & Role */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                                href={`/admin/security/${person.ulid}/edit`}
                                className="truncate font-bold text-sm text-slate-900 hover:text-slate-600 hover:underline dark:text-slate-100 dark:hover:text-slate-300"
                            >
                                {person.name}
                            </Link>
                            <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${getStatusBadge()}`}
                            >
                                {person.status === 'accepted' ? 'Active' : person.status}
                            </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <ShieldCheck className="h-3 w-3 text-slate-500" />
                                Security Personnel
                            </span>
                            {person.badge_number && (
                                <span className="inline-flex rounded-md bg-slate-50 px-1.5 py-0.5 font-bold text-[10px] text-slate-500 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700">
                                    Badge: {person.badge_number}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overflow Menu Button */}
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={onToggleMenu}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <EllipsisVertical className="h-4 w-4" />
                    </button>

                    {/* Menu Dropdown */}
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={onCloseMenu} />
                            <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                                <Link
                                    href={`/admin/activity-log?search=${encodeURIComponent(person.name)}`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    View Activity
                                </Link>

                                <Link
                                    href={`/admin/security/${person.ulid}/edit`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Pencil className="h-4 w-4 text-slate-400" />
                                    Edit Details
                                </Link>

                                {person.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onResendInvitation(person.id);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Send className="h-4 w-4 text-slate-400" />
                                        Resend Invite
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        onToggleSuspend(person.id);
                                        onCloseMenu();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <UserMinus className="h-4 w-4 text-slate-400" />
                                    {person.status === 'inactive' ? 'Activate Account' : 'Suspend Account'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onDeletePerson(person.id);
                                        onCloseMenu();
                                    }}
                                    className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-2 pt-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Guard
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Contact & Zone Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-slate-600 text-xs dark:text-slate-400">
                {person.email && (
                    <a
                        href={`mailto:${person.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="max-w-[150px] truncate">{person.email}</span>
                    </a>
                )}

                {person.phone && (
                    <a
                        href={`tel:${person.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{person.phone}</span>
                    </a>
                )}

                {person.zone_name && person.zone_name !== 'Entire Estate' && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-violet-100 bg-violet-50/60 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300">
                        <MapPin className="h-3 w-3 text-violet-500" />
                        {person.zone_name}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <span>Joined {person.created_at}</span>
            </div>
        </div>
    );
}
