import { Head } from '@inertiajs/react';
import { store, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import AdminLayout from '@/layouts/AdminLayout';
import UserForm from './UserForm';

export default function Create() {
    return (
        <AdminLayout>
            <Head title="Invite Admin" />
            <UserForm
                title="Invite Administrator"
                description="Send an invitation to a new administrator. They will receive an email to set up their password."
                submitUrl={store.url()}
                method="post"
                submitText="Send Invitation"
                cancelUrl={index.url()}
            />
        </AdminLayout>
    );
}
