import UsersPage from '../../src/features/admin/pages/UsersPage';
import { GetServerSideProps } from 'next';
import nookies from 'nookies';
import { adminAuth, adminFirestore } from '../../firebase-admin';

export default function AdminUsersRoute(props: any) {
  return <UsersPage {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check Firestore (Hybrid Mode Support)
    const userDoc = await adminFirestore.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userDoc.exists || userData?.role !== 'admin') {
      return { redirect: { destination: "/", permanent: false } };
    }

    return { props: {} };
  } catch (error) {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
