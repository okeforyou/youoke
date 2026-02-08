import { ReactElement } from 'react';
import { PageList } from '@/modules/admin/components/cms/PageList';
import AdminLayout from '@/layouts/AdminLayout';

const ProfilePagesAdmin = () => {
    return (
        <AdminLayout>
            <PageList />
        </AdminLayout>
    );
};

export default ProfilePagesAdmin;
