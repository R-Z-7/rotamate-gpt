"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, CreditCard, LayoutDashboard, Settings } from 'lucide-react';

const items = [
    { title: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
    { title: "Companies", href: "/superadmin/companies", icon: Building2 },
    { title: "Billing", href: "/superadmin/billing", icon: CreditCard },
    { title: "Platform Settings", href: "/superadmin/settings", icon: Settings },
];

export function SuperAdminSidebar({ mobile }: { mobile?: boolean }) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "flex h-screen flex-col bg-slate-900 text-white",
            mobile ? "w-full border-none" : "w-64 border-r hidden md:flex"
        )}>
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-blue-400">SuperAdmin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            pathname === item.href || pathname.startsWith(item.href + '/')
                                ? "bg-slate-800 text-blue-400"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
