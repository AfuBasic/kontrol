import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import VisitEventIcon from './VisitEventIcon';
import { formatStayDuration, hasActiveVisitorFilters, type SortDirection, type SortField, type VisitorFilters, type VisitorRecord } from './types';

type Props = {
    logs: VisitorRecord[];
    filters: VisitorFilters;
    checkoutEnabled: boolean;
    onSort: (field: SortField) => void;
    onSelect: (record: VisitorRecord) => void;
};

/**
 * Tabular visit ledger - filterable, sortable, infinite-scroll friendly.
 * No always-identical "Verified" status column.
 * Event type is an icon (check-in vs check-out), not a text badge that never varies.
 */
export default function VisitorTable({ logs, filters, checkoutEnabled, onSort, onSelect }: Props) {
    const sort = (filters.sort ?? 'verified_at') as SortField;
    const direction = (filters.direction ?? 'desc') as SortDirection;
    const hasFilters = hasActiveVisitorFilters(filters);

    // Only show Gate column when values actually vary across the loaded page.
    const showGateColumn = useMemo(() => {
        const gates = new Set(logs.map((log) => log.gate).filter((g): g is string => Boolean(g) && g !== 'Main Gate'));
        return gates.size > 0;
    }, [logs]);

    if (logs.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white">
                <EmptyState
                    title={hasFilters ? 'No matching records' : 'No visitor records yet'}
                    description={
                        hasFilters ? 'Try adjusting or clearing your filters.' : 'Verified gate entries will appear here as a sortable table.'
                    }
                    className="py-14"
                />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Mobile Cards View (< md) */}
            <div className="divide-y divide-gray-100 md:hidden">
                {logs.map((log) => {
                    const eventType = checkoutEnabled && log.checked_out_at ? 'check_out' : 'check_in';

                    return (
                        <div
                            key={log.id}
                            onClick={() => onSelect(log)}
                            className="flex cursor-pointer items-start justify-between gap-3 p-4 transition-colors duration-150 ease-out hover:bg-gray-50/80 active:bg-gray-100/70"
                        >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="mt-0.5 shrink-0">
                                    <VisitEventIcon type={eventType} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="truncate text-sm font-bold text-gray-900">{log.visitor.name}</p>
                                        {log.code && (
                                            <span className="font-mono text-[10px] font-bold text-gray-400">#{log.code}</span>
                                        )}
                                    </div>

                                    <p className="mt-0.5 text-xs text-gray-600 font-medium">
                                        Visiting <span className="font-semibold text-gray-900">{log.host.name}</span>
                                        {log.host.unit ? <span className="text-gray-400"> · {log.host.unit}</span> : null}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-gray-400">
                                        <span>In: {log.verified_at_time || log.verified_at}</span>
                                        {checkoutEnabled && log.checked_out_at && (
                                            <span>· Out: {log.checked_out_at_time || log.checked_out_at}</span>
                                        )}
                                        {checkoutEnabled && (
                                            <span className="font-semibold text-gray-700">
                                                · {formatStayDuration(log.duration_minutes, log)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(log);
                                }}
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                <Eye className="h-3 w-3" />
                                <span>Details</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-xs">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                            <th className="w-12 px-3 py-3 font-bold" scope="col">
                                <span className="sr-only">Event</span>
                            </th>
                            <SortableTh field="visitor" label="Visitor" sort={sort} direction={direction} onSort={onSort} />
                            <SortableTh field="host" label="Host" sort={sort} direction={direction} onSort={onSort} />
                            <SortableTh field="verified_at" label="Checked in" sort={sort} direction={direction} onSort={onSort} />
                            {checkoutEnabled && (
                                <SortableTh field="checked_out_at" label="Checked out" sort={sort} direction={direction} onSort={onSort} />
                            )}
                            {checkoutEnabled && <SortableTh field="duration" label="Duration" sort={sort} direction={direction} onSort={onSort} />}
                            {showGateColumn && <th className="px-4 py-3 font-bold">Gate</th>}
                            <th className="px-4 py-3 text-right font-bold"> </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            // Table rows are visit records: still-on-property reads as check-in;
                            // completed stays surface the check-out state as the latest outcome.
                            const eventType = checkoutEnabled && log.checked_out_at ? 'check_out' : 'check_in';

                            return (
                                <tr key={log.id} className="transition-colors duration-150 ease-out hover:bg-gray-50/80">
                                    <td className="px-3 py-3">
                                        <VisitEventIcon type={eventType} size="sm" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{log.visitor.name}</p>
                                        {log.visitor.phone ? (
                                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">{log.visitor.phone}</p>
                                        ) : null}
                                        {log.purpose ? <p className="mt-0.5 text-[11px] font-medium text-gray-400">{log.purpose}</p> : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{log.host.name}</p>
                                        {log.host.unit ? <p className="mt-0.5 text-[11px] font-medium text-gray-400">{log.host.unit}</p> : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800 tabular-nums">{log.verified_at}</p>
                                        <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                            {log.verifier_name} • {log.entry_point || log.gate}
                                        </p>
                                    </td>
                                    {checkoutEnabled && (
                                        <td className="px-4 py-3">
                                            {log.checked_out_at ? (
                                                <>
                                                    <p className="font-medium text-gray-800 tabular-nums">{log.checked_out_at}</p>
                                                    <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                                        {log.checkout_verifier_name || 'Security'} • {log.exit_point || log.entry_point || log.gate}
                                                    </p>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}
                                    {checkoutEnabled && (
                                        <td className="px-4 py-3 font-medium text-gray-700 tabular-nums">
                                            {formatStayDuration(log.duration_minutes, log)}
                                        </td>
                                    )}
                                    {showGateColumn && (
                                        <td className="px-4 py-3 font-medium text-gray-500">{log.gate === 'Main Gate' ? '-' : log.gate}</td>
                                    )}
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(log)}
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 transition-colors duration-150 ease-out hover:bg-gray-200 active:scale-[0.97]"
                                        >
                                            <Eye className="h-3 w-3" />
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SortableTh({
    field,
    label,
    sort,
    direction,
    onSort,
}: {
    field: SortField;
    label: string;
    sort: SortField;
    direction: SortDirection;
    onSort: (field: SortField) => void;
}) {
    const active = sort === field;

    return (
        <th className="px-4 py-3">
            <button
                type="button"
                onClick={() => onSort(field)}
                className={`group inline-flex cursor-pointer items-center gap-1 font-bold tracking-wider uppercase transition-colors duration-150 ease-out ${
                    active ? 'text-primary-700' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                <span>{label}</span>
                {active ? (
                    direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40 group-hover:opacity-70" />
                )}
            </button>
        </th>
    );
}
