import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import {
    formatStayDuration,
    hasActiveVisitorFilters,
    type SortDirection,
    type SortField,
    type VisitorFilters,
    type VisitorRecord,
} from './types';

type Props = {
    logs: VisitorRecord[];
    filters: VisitorFilters;
    checkoutEnabled: boolean;
    onSort: (field: SortField) => void;
    onSelect: (record: VisitorRecord) => void;
};

/**
 * Tabular visit ledger — filterable, sortable, designed for infinite scroll (parent loads more).
 * Default sort is latest check-in first (verified_at desc).
 */
export default function VisitorTable({ logs, filters, checkoutEnabled, onSort, onSelect }: Props) {
    const sort = (filters.sort ?? 'verified_at') as SortField;
    const direction = (filters.direction ?? 'desc') as SortDirection;
    const hasFilters = hasActiveVisitorFilters(filters);

    if (logs.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white">
                <EmptyState
                    title={hasFilters ? 'No matching records' : 'No visitor records yet'}
                    description={
                        hasFilters
                            ? 'Try adjusting or clearing your filters.'
                            : 'Verified gate entries will appear here as a sortable table.'
                    }
                    className="py-14"
                />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                            <SortableTh field="visitor" label="Visitor" sort={sort} direction={direction} onSort={onSort} />
                            <SortableTh field="host" label="Host" sort={sort} direction={direction} onSort={onSort} />
                            <SortableTh
                                field="verified_at"
                                label="Checked in"
                                sort={sort}
                                direction={direction}
                                onSort={onSort}
                            />
                            {checkoutEnabled && (
                                <SortableTh
                                    field="checked_out_at"
                                    label="Checked out"
                                    sort={sort}
                                    direction={direction}
                                    onSort={onSort}
                                />
                            )}
                            {checkoutEnabled && (
                                <SortableTh
                                    field="duration"
                                    label="Duration"
                                    sort={sort}
                                    direction={direction}
                                    onSort={onSort}
                                />
                            )}
                            {checkoutEnabled && (
                                <SortableTh
                                    field="status"
                                    label="Stay"
                                    sort={sort}
                                    direction={direction}
                                    onSort={onSort}
                                />
                            )}
                            <th className="px-4 py-3 font-bold">Gate</th>
                            <th className="px-4 py-3 text-right font-bold"> </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            const inside = checkoutEnabled && !log.checked_out_at;

                            return (
                                <tr
                                    key={log.id}
                                    className="transition-colors duration-150 ease-out hover:bg-gray-50/80"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{log.visitor.name}</p>
                                        {log.visitor.phone ? (
                                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                                {log.visitor.phone}
                                            </p>
                                        ) : null}
                                        {log.purpose ? (
                                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">{log.purpose}</p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{log.host.name}</p>
                                        {log.host.unit ? (
                                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                                {log.host.unit}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium tabular-nums text-gray-800">{log.verified_at}</p>
                                        <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                            {log.verifier_name}
                                        </p>
                                    </td>
                                    {checkoutEnabled && (
                                        <td className="px-4 py-3">
                                            {log.checked_out_at ? (
                                                <>
                                                    <p className="font-medium tabular-nums text-gray-800">
                                                        {log.checked_out_at}
                                                    </p>
                                                    {log.checkout_verifier_name ? (
                                                        <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                                            {log.checkout_verifier_name}
                                                        </p>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    )}
                                    {checkoutEnabled && (
                                        <td className="px-4 py-3 font-medium tabular-nums text-gray-700">
                                            {formatStayDuration(log.duration_minutes)}
                                        </td>
                                    )}
                                    {checkoutEnabled && (
                                        <td className="px-4 py-3">
                                            {inside ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                                    On property
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                                    Left
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        {log.gate === 'Main Gate' ? '—' : log.gate}
                                    </td>
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
