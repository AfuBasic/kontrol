import { normalizeStatus, STATUS_CONFIG, type VisitorStatus } from '@/Utils/visitorTheme';

type Props = {
    status?: VisitorStatus | string | null;
    codeObj?: any;
    size?: 'sm' | 'md';
};

export default function StatusBadge({ status, codeObj, size = 'sm' }: Props) {
    const resolvedStatus: VisitorStatus = codeObj
        ? normalizeStatus(codeObj)
        : (status && status in STATUS_CONFIG ? (status as VisitorStatus) : 'expected');

    const config = STATUS_CONFIG[resolvedStatus];

    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-bold capitalize ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
            <span>{config.label}</span>
        </span>
    );
}
