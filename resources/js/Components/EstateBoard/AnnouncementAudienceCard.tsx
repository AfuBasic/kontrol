import { Globe, MapPin, Shield, Users, User, Building } from 'lucide-react';
import React from 'react';
import type { PostAudience } from '@/types';

interface TargetItem {
    type: string;
    name: string;
}

interface AnnouncementAudienceCardProps {
    audience: PostAudience;
    appliesTo?: string;
    targets?: TargetItem[];
    recipientsCount?: number;
    className?: string;
}

export default function AnnouncementAudienceCard({
    audience,
    appliesTo = 'all',
    targets,
    recipientsCount,
    className = '',
}: AnnouncementAudienceCardProps) {
    const isTargeted = appliesTo === 'target' || appliesTo === 'custom' || appliesTo === 'zone';
    const hasCustomTargets = isTargeted && targets && targets.length > 0;

    function getAudienceLabel(aud: PostAudience) {
        switch (aud) {
            case 'residents':
                return 'Residents Only';
            case 'security':
                return 'Security Personnel';
            default:
                return 'Everyone in Estate';
        }
    }

    return (
        <div className={`rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                    <Globe className="h-4 w-4 text-primary-600" />
                    <h3 className="text-xs font-black tracking-wider uppercase">Audience Targeting</h3>
                </div>
                {recipientsCount !== undefined && (
                    <span className="text-[11px] font-bold text-slate-500">
                        {recipientsCount} recipient{recipientsCount === 1 ? '' : 's'}
                    </span>
                )}
            </div>

            {!hasCustomTargets ? (
                <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-xs ring-1 ring-slate-200/60">
                        {audience === 'residents' ? (
                            <Users className="h-4 w-4" />
                        ) : audience === 'security' ? (
                            <Shield className="h-4 w-4" />
                        ) : (
                            <Globe className="h-4 w-4" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{getAudienceLabel(audience)}</p>
                        <p className="text-[11px] font-medium text-slate-500">Broadcast sent estate-wide</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {targets!.map((target, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 text-left"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {target.type.toLowerCase().includes('zone') ? (
                                    <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                ) : target.type.toLowerCase().includes('property') ? (
                                    <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                ) : (
                                    <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                )}
                                <span className="truncate text-xs font-bold text-slate-800">{target.name}</span>
                            </div>
                            <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase ring-1 ring-slate-200/60">
                                {target.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
