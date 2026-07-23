import { Head } from '@inertiajs/react';
import React from 'react';
import VisitorCalendar from '@/Components/Visitors/VisitorCalendar';
import AdminLayout from '@/Layouts/AdminLayout';

type Props = {
    hosts?: { id: number; name: string }[];
    initialFilters?: {
        purpose?: string;
        status?: string;
        type?: string;
        search?: string;
        user_id?: string;
    };
};

export default function AdminVisitorCalendar({ hosts = [], initialFilters }: Props) {
    return (
        <>
            <Head title="Visitors · Calendar" />
            <div className="space-y-4">
                <VisitorCalendar
                    eventsUrl="/admin/visitors/calendar-events"
                    backUrl="/admin/visitors"
                    backLabel="Visitors"
                    isAdmin={true}
                    hosts={hosts}
                    createUrl="/admin/visitors/create"
                    initialFilters={initialFilters}
                />
            </div>
        </>
    );
}

AdminVisitorCalendar.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
