import { CATEGORY_CONFIG, type VisitorCategory } from '@/Utils/visitorTheme';

type Props = {
    category?: VisitorCategory | string | null;
    name?: string | null;
    size?: 'sm' | 'md' | 'lg';
};

export default function VisitorAvatar({ category = 'guest', name, size = 'md' }: Props) {
    const validCategory = (category && category in CATEGORY_CONFIG ? category : 'guest') as VisitorCategory;
    const config = CATEGORY_CONFIG[validCategory];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'h-7 w-7 text-xs',
        md: 'h-9 w-9 text-sm',
        lg: 'h-11 w-11 text-base',
    };

    const iconSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full font-bold ${config.bgClass} ${config.textClass} ${sizeClasses[size]}`}
            title={name || validCategory}
        >
            <Icon className={iconSizes[size]} />
        </div>
    );
}
