import { Phone, ShieldAlert, Siren } from 'lucide-react';

const EMERGENCY_SERVICES = [
    {
        name: 'National Emergency Toll-Free',
        phone: '112',
        description: 'Police, Fire, Ambulance & General emergencies',
        icon: Siren,
        color: 'text-rose-600',
        bg: 'bg-rose-50 border border-rose-100',
    },
    {
        name: 'Lagos State Emergency (LASEMA)',
        phone: '767',
        description: 'Lagos state emergencies & disasters',
        icon: ShieldAlert,
        color: 'text-amber-600',
        bg: 'bg-amber-50 border border-amber-100',
    },
    {
        name: 'Federal Road Safety (FRSC)',
        phone: '122',
        description: 'Road accidents & highway emergencies',
        icon: Phone,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50/75 border border-emerald-100/50',
    },
    {
        name: 'National Police Control Room',
        phone: '08033009977',
        description: 'Direct federal police support helpline',
        icon: ShieldAlert,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 border border-indigo-100',
    },
];

export default function EmergencyServicesList() {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {EMERGENCY_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                    <a
                        key={service.name}
                        href={`tel:${service.phone}`}
                        className="group relative flex items-center justify-between rounded-[24px] border border-slate-200/50 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all hover:border-slate-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.03)] active:scale-95"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${service.bg} ${service.color}`}>
                                <Icon className="h-6 w-6" strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm leading-tight font-black text-slate-800">{service.name}</p>
                                <p className="mt-0.5 text-xs leading-tight font-bold text-slate-400">{service.description}</p>
                                <p className="mt-1 text-sm font-black text-slate-900">{service.phone}</p>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-rose-50 group-hover:text-rose-600">
                            <Phone className="h-5 w-5" />
                        </div>
                    </a>
                );
            })}
        </div>
    );
}
