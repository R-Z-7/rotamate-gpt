"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Home } from 'lucide-react';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationBell } from '@/components/layout/notification-bell';

const items = [
    { title: "My Schedule", href: "/employee/schedule", icon: Calendar },
    { title: "Availability", href: "/employee/availability", icon: Clock },
    { title: "Time Off", href: "/employee/requests", icon: Home }, // Using Home icon for now
];

export function EmployeeSidebar({ mobile }: { mobile?: boolean }) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "flex h-screen flex-col bg-card text-card-foreground border-border",
            mobile ? "w-full border-none" : "w-64 border-r hidden md:flex"
        )}>
            <div className="p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">RotaMate</h1>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Employee</span>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <UserMenu />
                </div>
            </div>
            <nav className="flex-1 space-y-1 px-4">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
