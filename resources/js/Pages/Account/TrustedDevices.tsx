import { Head, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAdminConfirmation, useResidentConfirmation } from '@/Components/ConfirmationProvider';
import EmptyState from '@/Components/States/EmptyState';
import * as TrustedDeviceController from '@/actions/App/Http/Controllers/Account/TrustedDeviceController';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import PartnerLayout from '@/Layouts/PartnerLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import SecurityLayout from '@/Layouts/SecurityLayout';
import type { SharedData } from '@/types';

type Device = {
    id: string;
    display_name: string;
    platform: string | null;
    browser: string | null;
    approximate_location: string | null;
    is_current: boolean;
    first_trusted_at: string | null;
    last_used_at: string | null;
};

type Props = {
    devices: Device[];
};

function DeviceIcon({ platform }: { platform: string | null }) {
    if (platform === 'ios' || platform === 'android') {
        return <Smartphone className="h-5 w-5" aria-hidden="true" />;
    }

    if (platform === 'tablet') {
        return <Tablet className="h-5 w-5" aria-hidden="true" />;
    }

    return <Monitor className="h-5 w-5" aria-hidden="true" />;
}

export default function TrustedDevices({ devices }: Props) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];
    const isResident = roles.some((role) => ['resident', 'household_member', 'property_owner'].includes(role));
    const adminConfirm = useAdminConfirmation();
    const residentConfirm = useResidentConfirmation();
    const confirm = isResident ? residentConfirm.confirm : adminConfirm.confirm;

    const removeDevice = (device: Device) => {
        confirm({
            title: device.is_current ? 'Remove this device?' : 'Remove access',
            message: device.is_current
                ? 'This is the device you are using now. Removing it will sign you out and require verification the next time you sign in.'
                : `Remove access for ${device.display_name}? It will need to be authorized again before it can sign in.`,
            confirmLabel: 'Remove access',
            type: 'danger',
            onConfirm: () =>
                router.delete(TrustedDeviceController.destroy.url(device.id), {
                    preserveScroll: true,
                }),
        });
    };

    return (
        <>
            <Head title="Trusted Devices" />

            <div className="mx-auto max-w-3xl space-y-6 pb-16">
                <header className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Account security</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your devices</h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                        These devices can sign in without extra authorization. Removing a device does not change your passwordless sign-in
                        method - it only requires that device to be approved again.
                    </p>
                </header>

                {devices.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white">
                        <EmptyState title="No trusted devices yet" description="The next time you sign in and authorize a device, it will appear here." />
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {devices.map((device) => (
                            <li
                                key={device.id}
                                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                        <DeviceIcon platform={device.platform} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-sm font-semibold text-slate-900">{device.display_name}</h2>
                                            {device.is_current && (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">
                                                    Current device
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {device.approximate_location ? `${device.approximate_location} · ` : ''}
                                            Last active{' '}
                                            {device.last_used_at
                                                ? formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true })
                                                : 'unknown'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeDevice(device)}
                                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                >
                                    Remove access
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

function AccountShell({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];

    if (roles.includes('security')) {
        return (
            <SecurityLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </SecurityLayout>
        );
    }

    if (roles.some((role) => ['resident', 'household_member', 'property_owner'].includes(role))) {
        return (
            <ResidentLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </ResidentLayout>
        );
    }

    if (auth.user && 'partner_id' in auth.user && auth.user.partner_id) {
        return (
            <PartnerLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </PartnerLayout>
        );
    }

    return (
        <AdminLayout title="Trusted Devices">
            <AnimatedLayout>{children}</AnimatedLayout>
        </AdminLayout>
    );
}

TrustedDevices.layout = (page: ReactNode) => <AccountShell>{page}</AccountShell>;
