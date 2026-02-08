"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UserMenu } from "@/components/layout/user-menu"
import { NotificationBell } from "@/components/layout/notification-bell"
import { MobileMenu } from "@/components/layout/mobile-sidebar"
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar"

export function SuperAdminNavbar() {
    const pathname = usePathname()

    // Generate breadcrumbs from pathname
    const breadcrumbs = pathname
        .split("/")
        .filter(Boolean)
        .map((segment, index, array) => {
            const href = "/" + array.slice(0, index + 1).join("/")
            const isLast = index === array.length - 1
            const title = segment.charAt(0).toUpperCase() + segment.slice(1)
            return { title, href, isLast }
        })

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-slate-950 shrink-0">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
                <MobileMenu>
                    <SuperAdminSidebar mobile />
                </MobileMenu>
            </div>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center text-sm text-slate-500">
                <Link href="/superadmin/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-2" />
                        {crumb.isLast ? (
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                {crumb.title}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                                {crumb.title}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            <div className="flex-1" />

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        type="search"
                        placeholder="Search companies..."
                        className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-none"
                    />
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-slate-200 dark:border-slate-800">
                    <NotificationBell />
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
