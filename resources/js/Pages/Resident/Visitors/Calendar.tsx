import { Head } from '@inertiajs/react';
import React from 'react';
import AppleVisitorCalendar from '@/Components/Visitors/AppleVisitorCalendar';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/routes/resident';

type Props = {
    initialFilters?: {
        purpose?: string;
        status?: string;
        type?: string;
        search?: string;
    };
};

export default function ResidentVisitorCalendar({ initialFilters }: Props) {
    return (
        <>
            <Head title="Visitor Calendar" />
            <AppleVisitorCalendar
                eventsUrl={resident.visitors['calendar-events'].url()}
                backUrl="/resident/visitors"
                backLabel="Timeline"
                createUrl="/resident/visitors/create"
                initialFilters={initialFilters}
            />
        </>
    );
}

ResidentVisitorCalendar.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
