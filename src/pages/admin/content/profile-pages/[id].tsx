import { ReactElement } from 'react';
import { useRouter } from 'next/router';
import { PageEditor } from '@/features/admin/components/cms/PageEditor';
import AdminLayout from '@/features/admin/layouts/AdminLayout';

const EditProfilePage = () => {
    const router = useRouter();
    const { id } = router.query;

    // Ensure id is a string
    const pageId = Array.isArray(id) ? id[0] : id;

    if (!router.isReady) return null;

    return (
        <AdminLayout>
            <PageEditor pageId={pageId} />
        </AdminLayout>
    );
};

export default EditProfilePage;
