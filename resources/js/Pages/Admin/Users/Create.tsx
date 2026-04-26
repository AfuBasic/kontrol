import { Head } from '@inertiajs/react';
import { store, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from './UserForm';

type Props = {
    roles: Array<{ name: string; guard_name: string }>;
};

export default function Create({ roles }: Props) {
    return (
        <>
            <Head title="Invite User" />
            <UserForm
                title="Invite User"
                description="Send an invitation to a new user. They will receive an email to set up their password."
                submitUrl={store.url()}
                method="post"
                submitText="Send Invitation"
                cancelUrl={index.url()}
                roles={roles}
            />
        </>
    );
}
