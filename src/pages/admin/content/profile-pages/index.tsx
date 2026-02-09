import { ReactElement } from 'react';
import { PageList } from '@/features/admin/components/cms/PageList';
import AdminLayout from '@/features/admin/layouts/AdminLayout';

const ProfilePagesAdmin = () => {
    return (
        <AdminLayout>
            <PageList />
        </AdminLayout>
    );
};

export default ProfilePagesAdmin;
