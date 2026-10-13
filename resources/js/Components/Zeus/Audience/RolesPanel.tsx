import type { RoleRow } from './types';

const LABEL: Record<string, string> = {
    resident: 'Residents',
    household_member: 'Household members',
    property_owner: 'Property owners',
    security: 'Security guards',
    admin: 'Admins',
    'Sub-Admin': 'Sub-admins',
    affiliate: 'Affiliates',
};

/** Active people by the role they hold. Someone with two roles counts under both. */
export default function RolesPanel({ roles }: { roles: RoleRow[] }) {
    const most = Math.max(1, ...roles.map((role) => role.users));

    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="Active people by role">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">By role</h2>
                <p className="mt-0.5 text-xs text-slate-500">Who is using it, in this period.</p>
            </div>

            {roles.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No one was active in this period.</p>
            ) : (
                <div className="space-y-1 p-3">
                    {roles.map((role) => (
                        <div key={role.role} className="rounded-lg px-3 py-2.5">
                            <span className="flex items-baseline justify-between gap-3">
                                <span className="truncate text-sm font-semibold text-white">{LABEL[role.role] ?? role.role}</span>
                                <span className="text-sm font-bold text-slate-300 tabular-nums">{role.users.toLocaleString()}</span>
                            </span>
                            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-800">
                                <span className="block h-full rounded-full bg-primary-400" style={{ width: `${(role.users / most) * 100}%` }} />
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
