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

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    mobile?: boolean;
}

export function Sidebar({ isOpen, setIsOpen, mobile }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    // Map external repo icons/labels to internal routes
    const items = [
        { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Employees", href: "/admin/employees", icon: Users },
        { title: "Rota Management", href: "/admin/rota", icon: Calendar },
        { title: "Time Off Requests", href: "/admin/requests", icon: Clock },
        { title: "Reports", href: "/admin/reports", icon: FileText },
        { title: "Settings", href: "/admin/settings", icon: Settings },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

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
            isOpen ? "w-64" : "w-20" // Collapsed width instead of 0 for desktop usually looks better, but external repo used 0. Let's stick to external repo behavior or improve it. External used transform/width.
            // External: isMobile ? (isOpen ? "w-64" : "w-0") : (isOpen ? "w-64" : "w-0")
        )}>
            {/* Desktop Sidebar Logic */}
            {/* If isOpen is false, we hide text and just show icons, or hide completely? 
                External repo: "w-0" when closed. So it behaves like a drawer.
                Let's follow external repo: w-64 or w-0.
             */}
            <div className={cn("flex flex-col h-full overflow-hidden w-64", !isOpen && "w-0 hidden")}>
                <div className="flex items-center justify-between p-4 border-b border-border h-16">
                    <h1 className="font-bold text-xl text-foreground truncate">Admin Panel</h1>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <X className="h-5 w-5" />
                    </Button>
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
        </div>
    );
}
