import {
    Phone,
    Mail,
    Home,
    Users,
    MapPin,
    Pencil,
    Send,
    ShieldCheck,
    EllipsisVertical,
    UserMinus,
    Trash2,
    Eye,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import React from 'react';
import { usePermission } from '@/Hooks/usePermission';

type Resident = {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    zone_id?: number | null;
    zone_name?: string | null;
    property_owner_id: number | null;
    property_owner_name: string | null;
    property_id: number | null;
    property_name: string | null;
    status: 'pending' | 'active' | 'inactive';
    is_property_owner: boolean;
    role_label: string;
    household_members_count: number;
    suspended_at: string | null;
    email_verified_at: string | null;
    last_active: string;
    created_at: string;
    is_estate_creator: boolean;
};

interface ResidentCardProps {
    resident: Resident;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onToggleSuspend: (resident: Resident) => void;
    onMarkAsPropertyOwner: (resident: Resident) => void;
    onDeleteResident: (resident: Resident) => void;
    onResendInvitation: (id: number) => void;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    index: number;
}

export default function ResidentCard({
    resident,
    isSelected,
    onToggleSelect,
    onToggleSuspend,
    onMarkAsPropertyOwner,
    onDeleteResident,
    onResendInvitation,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    index: cardIndex,
}: ResidentCardProps) {
    const { can } = usePermission();
    const initial = resident.name ? resident.name.charAt(0).toUpperCase() : 'R';

    const bgColors = [
        'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
        'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    ];
    const avatarColor = bgColors[cardIndex % bgColors.length];

    const getStatusBadge = () => {
        if (resident.status === 'inactive') {
            return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40';
        }
        if (resident.status === 'active' || (resident.status as string) === 'accepted') {
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
            {/* Top Row: Select, Avatar, Name, Status, Action menu */}
            <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 items-start gap-3">
                    {can('residents.delete') && (
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={resident.is_estate_creator}
                                onChange={() => onToggleSelect(resident.id)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:checked:bg-slate-100 dark:checked:text-slate-900"
                            />
                        </div>
                    )}

                    {/* Avatar */}
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm select-none ${avatarColor}`}
                    >
                        {initial}
                    </div>

                    {/* Name, Role & Status */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                                href={`/admin/residents/${resident.id}`}
                                className="truncate font-bold text-sm text-slate-900 hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-400"
                            >
                                {resident.name}
                            </Link>
                            <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${getStatusBadge()}`}
                            >
                                {resident.status}
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {resident.role_label}
                            </span>
                            {resident.unit_number ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-semibold dark:text-slate-400">
                                    <Home className="h-3 w-3 text-slate-400" />
                                    {resident.unit_number}
                                </span>
                            ) : (
                                <span className="text-slate-400 text-xs italic dark:text-slate-500">
                                    No unit
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Button */}
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={onToggleMenu}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <EllipsisVertical className="h-4 w-4" />
                    </button>

                    {/* Actions Popup Dropdown */}
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={onCloseMenu} />
                            <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                                <Link
                                    href={`/admin/residents/${resident.id}`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    View Profile
                                </Link>

                                <Link
                                    href={`/admin/residents/${resident.id}/edit`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Pencil className="h-4 w-4 text-slate-400" />
                                    Edit Details
                                </Link>

                                {resident.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onResendInvitation(resident.id);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Send className="h-4 w-4 text-slate-400" />
                                        Resend Invite
                                    </button>
                                )}

                                {!resident.is_property_owner && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onMarkAsPropertyOwner(resident);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                    >
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                        Convert to Landlord
                                    </button>
                                )}

                                {!resident.is_estate_creator && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onToggleSuspend(resident);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <UserMinus className="h-4 w-4 text-slate-400" />
                                        {resident.status === 'inactive' ? 'Activate Account' : 'Suspend Account'}
                                    </button>
                                )}

                                {!resident.is_estate_creator && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onDeleteResident(resident);
                                            onCloseMenu();
                                        }}
                                        className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-2 pt-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Profile
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Contact & Zone Info Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-slate-600 text-xs dark:text-slate-400">
                {resident.email && (
                    <a
                        href={`mailto:${resident.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="max-w-[150px] truncate">{resident.email}</span>
                    </a>
                )}

                {resident.phone && (
                    <a
                        href={`tel:${resident.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{resident.phone}</span>
                    </a>
                )}

                {resident.household_members_count > 0 && (
                    <Link
                        href={`/admin/residents/${resident.id}#household`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span>
                            {resident.household_members_count}{' '}
                            {resident.household_members_count === 1 ? 'member' : 'members'}
                        </span>
                    </Link>
                )}

                {resident.zone_name && resident.zone_name !== 'Entire Estate' && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-violet-100 bg-violet-50/60 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300">
                        <MapPin className="h-3 w-3 text-violet-500" />
                        {resident.zone_name}
                    </span>
                )}
            </div>

            {/* Footer Metadata */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <span>Joined {resident.created_at}</span>
                <span>Active: {resident.last_active}</span>
            </div>
        </div>
    );
}
