import { Bell, Search, Settings, ChevronDown, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { useRouter } from "next/router";

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
    const { user, signOut } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden btn btn-ghost btn-sm btn-square text-muted-foreground hover:text-foreground"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="relative w-64 lg:w-80 hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="input input-sm w-full pl-9 bg-muted/30 border-border/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-md text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications Dropdown */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle text-muted-foreground hover:text-foreground hover:bg-muted/50">
                        <div className="indicator">
                            <Bell className="h-5 w-5" />
                            <span className="badge badge-xs badge-error indicator-item">3</span>
                        </div>
                    </label>
                    <div tabIndex={0} className="dropdown-content z-[1] menu p-0 shadow-lg bg-card rounded-xl w-80 border border-border/50 mt-2">
                        <div className="px-4 py-3 border-b border-border/50">
                            <p className="font-semibold text-foreground">Notifications</p>
                            <p className="text-xs text-muted-foreground">You have 3 unread notifications</p>
                        </div>
                        <div className="py-2">
                            {/* Mock Notifications */}
                            <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex flex-col gap-1 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="font-medium text-foreground text-sm">New order received</span>
                                </div>
                                <p className="text-xs text-muted-foreground pl-4">User purchased VIP package - 2 min ago</p>
                            </div>
                            <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex flex-col gap-1 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-success" />
                                    <span className="font-medium text-foreground text-sm">New user registered</span>
                                </div>
                                <p className="text-xs text-muted-foreground pl-4">John Doe joined YouOke - 15 min ago</p>
                            </div>
                        </div>
                        <div className="border-t border-border/50 p-2">
                            <button className="btn btn-ghost btn-sm w-full text-primary hover:text-primary hover:bg-primary/10 normal-case">
                                View all notifications
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Menu Dropdown */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 px-2 hover:bg-muted/50 border-none normal-case h-auto py-1">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-foreground rounded-full w-8">
                                <span className="text-sm font-semibold">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-1 text-left">
                            <span className="text-sm font-medium text-foreground">{user?.displayName || 'Admin'}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-card rounded-xl w-56 border border-border/50 mt-2">
                        <li className="menu-title px-4 py-2 border-b border-border/50 mb-2">
                            <span className="text-foreground font-semibold block p-0">Admin User</span>
                            <span className="text-xs text-muted-foreground font-normal block lowercase p-0 mt-0.5">{user?.email}</span>
                        </li>
                        <li>
                            <a className="gap-2 text-foreground hover:bg-muted">
                                <Settings className="h-4 w-4" /> Settings
                            </a>
                        </li>
                        <div className="divider my-1 border-border/50"></div>
                        <li>
                            <a onClick={handleLogout} className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <LogOut className="h-4 w-4" /> Logout
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};
