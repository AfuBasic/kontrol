import {
    Building,
    Mail,
    Phone,
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

interface PropertyOwner {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    status: 'pending' | 'accepted' | 'inactive';
    suspended_at: string | null;
    email_verified_at: string | null;
    properties_count: number;
    residents_count: number;
    is_resident: boolean;
    created_at: string;
    zone_name?: string | null;
}

interface PropertyOwnerCardProps {
    owner: PropertyOwner;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onToggleSuspend: (id: number) => void;
    onMakeResident: (owner: PropertyOwner) => void;
    onDeleteOwner: (id: number) => void;
    onResendInvitation: (id: number) => void;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    index: number;
}

export default function PropertyOwnerCard({
    owner,
    isSelected,
    onToggleSelect,
    onToggleSuspend,
    onMakeResident,
    onDeleteOwner,
    onResendInvitation,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    index: cardIndex,
}: PropertyOwnerCardProps) {
    const { can } = usePermission();
    const initial = owner.name ? owner.name.charAt(0).toUpperCase() : 'O';

    const bgColors = [
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
        'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    ];
    const avatarColor = bgColors[cardIndex % bgColors.length];

    const getStatusBadge = () => {
        if (owner.status === 'inactive') {
            return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40';
        }
        if (owner.status === 'accepted') {
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
                    {can('property_owners.delete') && (
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelect(owner.id)}
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

                    {/* Name & Status */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                                href={`/admin/property-owners/${owner.id}/properties`}
                                className="truncate font-bold text-sm text-slate-900 hover:text-emerald-600 hover:underline dark:text-slate-100 dark:hover:text-emerald-400"
                            >
                                {owner.name}
                            </Link>
                            <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${getStatusBadge()}`}
                            >
                                {owner.status === 'accepted' ? 'Active' : owner.status}
                            </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-[10px] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                Landlord
                            </span>
                            {owner.is_resident && (
                                <span className="inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-[10px] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    Resides on Estate
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
                                    href={`/admin/property-owners/${owner.id}/properties`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Building className="h-4 w-4 text-slate-400" />
                                    View Properties
                                </Link>

                                <Link
                                    href={`/admin/property-owners/${owner.id}/residents`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Users className="h-4 w-4 text-slate-400" />
                                    View Tenants
                                </Link>

                                <Link
                                    href={`/admin/property-owners/${owner.id}/edit`}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Pencil className="h-4 w-4 text-slate-400" />
                                    Edit Details
                                </Link>

                                {owner.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onResendInvitation(owner.id);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Send className="h-4 w-4 text-slate-400" />
                                        Resend Invite
                                    </button>
                                )}

                                {!owner.is_resident && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onMakeResident(owner);
                                            onCloseMenu();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                    >
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        Assign Resident Role
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        onToggleSuspend(owner.id);
                                        onCloseMenu();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <UserMinus className="h-4 w-4 text-slate-400" />
                                    {owner.status === 'inactive' ? 'Activate Account' : 'Suspend Account'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onDeleteOwner(owner.id);
                                        onCloseMenu();
                                    }}
                                    className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-2 pt-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Profile
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Counts & Contact Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-slate-600 text-xs dark:text-slate-400">
                <Link
                    href={`/admin/property-owners/${owner.id}/properties`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    <Building className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                        {owner.properties_count} {owner.properties_count === 1 ? 'Property' : 'Properties'}
                    </span>
                </Link>

                <Link
                    href={`/admin/property-owners/${owner.id}/residents`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                >
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                        {owner.residents_count} {owner.residents_count === 1 ? 'Tenant' : 'Tenants'}
                    </span>
                </Link>

                {owner.email && (
                    <a
                        href={`mailto:${owner.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="max-w-[150px] truncate">{owner.email}</span>
                    </a>
                )}

                {owner.phone && (
                    <a
                        href={`tel:${owner.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{owner.phone}</span>
                    </a>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <span>Joined {owner.created_at}</span>
            </div>
        </div>
    );
}
