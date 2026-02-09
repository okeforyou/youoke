import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { MODULES } from '@/config/modules';
import { UserGroupIcon, SignalIcon, PowerIcon } from '@heroicons/react/24/outline';
import { db } from '@/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface UserSummary {
    uid: string;
    displayName: string;
    email: string;
    installed_modules: string[];
}

export default function AdminModulesPage() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState(MODULES[0].id);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            if (!db) return;
            // In a real app, use pagination. Fetching all users is risky for large DBs.
            // Simplified for this phase.
            const snap = await getDocs(collection(db, 'users'));
            const data = snap.docs.map(d => ({
                uid: d.id,
                ...d.data()
            })) as UserSummary[];
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserModule = async (userId: string, moduleId: string, hasModule: boolean) => {
        try {
            if (!db) return;
            const userRef = doc(db, 'users', userId);
            if (hasModule) {
                // Remove
                await updateDoc(userRef, {
                    installed_modules: arrayRemove(moduleId)
                });
            } else {
                // Add
                await updateDoc(userRef, {
                    installed_modules: arrayUnion(moduleId)
                });
            }
            // Refresh logic (optimistic update better, but simple fetch for now)
            fetchUsers();
        } catch (error) {
            alert('Failed to update: ' + error);
        }
    };

    const currentModule = MODULES.find(m => m.id === selectedModule);

    return (
        <AdminLayout>
            <Head>
                <title>Admin - Module Management</title>
            </Head>

            <div className="p-6">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-primary" />
                        User Access Control
                    </h1>
                    <p className="text-gray-500">Grant or revoke module access for users manually.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Module Selector Sidebar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b">
                            <h2 className="font-semibold text-gray-700">Select Module</h2>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {MODULES.filter(m => m.category !== 'core').map(module => (
                                <li
                                    key={module.id}
                                    onClick={() => setSelectedModule(module.id)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedModule === module.id ? 'bg-primary/5 text-primary font-medium' : ''}`}
                                >
                                    <span>{module.name}</span>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{module.pricing.tier}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* User List for Selected Module */}
                    <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{currentModule?.name}</h3>
                                <p className="text-sm text-gray-400">{currentModule?.description}</p>
                            </div>
                            <div className="badge badge-accent text-white">Version {currentModule?.version}</div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Access</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => {
                                        const hasAccess = user.installed_modules?.includes(selectedModule);
                                        return (
                                            <tr key={user.uid}>
                                                <td>
                                                    <div className="font-bold">{user.displayName || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-400 font-mono">{user.uid.substring(0, 6)}...</div>
                                                </td>
                                                <td className="text-gray-500">{user.email}</td>
                                                <td>
                                                    {hasAccess ? (
                                                        <span className="badge badge-success gap-1 text-white">
                                                            <SignalIcon className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-ghost opacity-50">Inactive</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => toggleUserModule(user.uid, selectedModule, hasAccess)}
                                                        className={`btn btn-xs ${hasAccess ? 'btn-error btn-outline' : 'btn-primary'}`}
                                                    >
                                                        {hasAccess ? (
                                                            <><PowerIcon className="w-3 h-3 mr-1" /> Revoke</>
                                                        ) : (
                                                            <><PowerIcon className="w-3 h-3 mr-1" /> Grant</>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {loading && <div className="p-8 text-center text-gray-500">Loading users...</div>}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
