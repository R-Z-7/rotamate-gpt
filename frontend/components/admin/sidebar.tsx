"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Clock,
    Settings,
    LogOut,
    FileText,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/context/SidebarContext';

/* interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    mobile?: boolean;
} */

export function Sidebar({ mobile }: { mobile?: boolean }) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const { isCollapsed, toggleSidebar } = useSidebar();

    // Map external repo icons/labels to internal routes
    const items = [
        { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Employees", href: "/admin/employees", icon: Users },
        { title: "Rota Management", href: "/admin/rota", icon: Calendar },
        { title: "Time Off Requests", href: "/admin/requests", icon: Clock },
        { title: "Reports", href: "/admin/reports", icon: FileText },
        { title: "Settings", href: "/admin/settings", icon: Settings },
    ];

    if (mobile) {
        return (
            <div className="flex flex-col h-full bg-background border-r border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h1 className="font-bold text-xl text-foreground">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                                        pathname === item.href || pathname.startsWith(item.href + '/')
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-border">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-2 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "fixed left-0 top-0 h-screen bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out z-30 hidden md:flex",
            isCollapsed ? "w-[70px]" : "w-64"
        )}>
            <div className="flex items-center justify-between p-4 border-b border-border h-16 transition-all duration-300">
                <div className={cn("overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                    <h1 className="font-bold text-xl text-foreground truncate pl-2">Admin</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0 ml-auto">
                    {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </Button>
            </div>

            <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
                <ul className="space-y-2">
                    {items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <li key={item.href} className="group relative">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-lg transition-all duration-200",
                                        isCollapsed ? "justify-center p-3" : "px-4 py-3 space-x-3",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5 shrink-0 transition-transform", isCollapsed && isActive && "scale-110")} />
                                    <span className={cn(
                                        "whitespace-nowrap transition-all duration-300",
                                        isCollapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
                                    )}>
                                        {item.title}
                                    </span>
                                </Link>

                                {/* Tooltip for collapsed mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border">
                                        {item.title}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="p-2 border-t border-border mt-auto">
                <button
                    onClick={logout}
                    className={cn(
                        "flex items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group relative",
                        isCollapsed ? "justify-center p-3 w-full" : "px-4 py-3 space-x-3 w-full"
                    )}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className={cn(
                        "whitespace-nowrap transition-all duration-300",
                        isCollapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
                    )}>
                        Log Out
                    </span>
                    {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border">
                            Log Out
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
