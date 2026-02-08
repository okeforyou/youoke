import React from 'react';
import { Shield } from 'lucide-react';

interface TableOneProps {
    users: any[];
}

const TableOne: React.FC<TableOneProps> = ({ users }) => {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 pt-6 pb-2.5 shadow-xl sm:px-7.5 xl:pb-1 text-sm">
            <h4 className="mb-6 text-lg font-light text-white drop-shadow-md">
                สมาชิกใหม่ล่าสุด
            </h4>

            <div className="flex flex-col">
                <div className="grid grid-cols-3 rounded-lg bg-white/5 border border-white/5 sm:grid-cols-4">
                    <div className="p-2.5 xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base text-gray-300">
                            ผู้ใช้งาน
                        </h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base text-gray-300">
                            อีเมล
                        </h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base text-gray-300">
                            แพ็กเกจ
                        </h5>
                    </div>
                    <div className="hidden p-2.5 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base text-gray-300">
                            วันที่สมัคร
                        </h5>
                    </div>
                </div>

                {users.map((user, key) => (
                    <div
                        className={`grid grid-cols-3 sm:grid-cols-4 ${key === users.length - 1
                            ? ''
                            : 'border-b border-white/5'
                            }`}
                        key={key}
                    >
                        <div className="flex items-center gap-3 p-2.5 xl:p-5">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg border border-white/10 overflow-hidden ring-1 ring-white/20">
                                {user.photoURL ? <img src={user.photoURL} alt="User" /> : user.displayName?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <p className="hidden text-white sm:block font-medium">
                                {user.displayName || 'Guest'}
                            </p>
                        </div>

                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                            <p className="text-gray-300 text-xs sm:text-sm truncate max-w-[120px]">{user.email}</p>
                        </div>

                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                            {user.membership?.type === 'free' ?
                                <span className="inline-flex rounded-full bg-white/5 border border-white/10 py-1 px-3 text-sm font-medium text-gray-400">Free</span> :
                                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 py-1 px-3 text-sm font-medium text-warning shadow-[0_0_10px_rgba(var(--color-warning),0.2)]">
                                    <Shield size={14} /> {user.membership?.type}
                                </span>
                            }
                        </div>

                        <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                            <p className="text-primary font-medium drop-shadow-sm">
                                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('th-TH') : '-'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableOne;
