"use client"

import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/user-menu"
import { NotificationBell } from "@/components/layout/notification-bell"
import { MobileMenu } from "@/components/layout/mobile-sidebar"
import { Sidebar } from "@/components/admin/sidebar"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"

/* interface NavbarProps {
    toggleSidebar: () => void;
    sidebarOpen: boolean;
} */

export function Navbar() {
    const pathname = usePathname()
    const { user } = useAuth()
    const { toggleSidebar } = useSidebar()

    return (
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-4">
                {/* Desktop Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="hidden md:flex"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Mobile Menu (Drawer) - Reusing existing MobileMenu component but wrapping Sidebar */}
                <div className="md:hidden">
                    <MobileMenu>
                        <Sidebar mobile />
                    </MobileMenu>
                </div>

                <div className="flex flex-col">
                    <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate hidden sm:block">
                        Welcome back, {user?.full_name?.split(' ')[0]}!
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative hidden lg:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-9 h-9 bg-muted border-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
