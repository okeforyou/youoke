import React, { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon, CubeIcon, StarIcon } from '@heroicons/react/24/outline';
import { cn } from "../../../utils/cn";

interface User {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: 'admin' | 'user';
    membership?: {
        type: string;
        status: string;
        expiresAt: any;
    };
    installed_modules?: string[];
}

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onUpdateRole: (uid: string, newRole: 'admin' | 'user') => void;
    onAssignPackage: (pkgId: string) => void;
    onToggleModule: (moduleId: string) => void;
    availableModules: { id: string; name: string; icon: any }[];
    packages: { id: string; name: string; durationDays: number }[];
    loading?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
    user,
    onClose,
    onUpdateRole,
    onAssignPackage,
    onToggleModule,
    availableModules,
    packages,
    loading
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">แก้ไขสมาชิก</h3>
                        <p className="text-xs text-gray-500">ปรับเปลี่ยนสถานะสำหรับสมาชิก</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Profile */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 mb-6">
                        <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                            {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" /> : user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">
                                {user.displayName}
                                {user.role === 'admin' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>}
                            </h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1 font-mono">UID: {user.uid}</p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                            <ShieldCheckIcon className="w-4 h-4 text-primary" /> บทบาท (Role)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onUpdateRole(user.uid, 'user')}
                                className={cn(
                                    "btn btn-sm border-none shadow-sm",
                                    user.role !== 'admin' ? "bg-gray-200 text-gray-900 ring-2 ring-primary/20" : "bg-white text-gray-500 border border-gray-200"
                                )}
                            >
                                USER
                            </button>
                            <button
                                onClick={() => onUpdateRole(user.uid, 'admin')}
                                className={cn(
                                    "btn btn-sm border-none shadow-sm",
                                    user.role === 'admin' ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-gray-500 border border-gray-200"
                                )}
                            >
                                ADMIN
                            </button>
                        </div>
                    </div>

                    {/* Packages */}
                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                            <StarIcon className="w-4 h-4 text-yellow-500" /> เลือกแพ็กเกจ
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {packages.map(pkg => (
                                <button
                                    key={pkg.id}
                                    onClick={() => onAssignPackage(pkg.id)}
                                    disabled={loading}
                                    className="btn btn-sm bg-white border-gray-200 hover:border-primary hover:text-primary text-gray-700 font-normal"
                                >
                                    {pkg.name}
                                </button>
                            ))}
                            <button
                                onClick={() => onAssignPackage('lifetime')}
                                disabled={loading}
                                className="btn btn-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none hover:opacity-90"
                            >
                                Lifetime
                            </button>
                        </div>
                    </div>

                    {/* Modules */}
                    <div>
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                            <CubeIcon className="w-4 h-4 text-blue-500" /> Installed Modules
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableModules.map(module => {
                                const isInstalled = user.installed_modules?.includes(module.id);
                                return (
                                    <div
                                        key={module.id}
                                        onClick={() => onToggleModule(module.id)}
                                        className={cn(
                                            "cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors",
                                            isInstalled ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            isInstalled ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                                        )}>
                                            <module.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{module.name}</div>
                                            <div className="text-xs text-gray-500">{isInstalled ? 'Installed' : 'Not Installed'}</div>
                                        </div>
                                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={isInstalled || false} readOnly />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
