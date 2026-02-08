"use client"

import * as React from "react"
import { User, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"

export function UserMenu() {
    const { user, logout } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    if (!user) return null

    const initials = user.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"

    return (
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500"
                    >
                        <span className="font-semibold">{initials}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.full_name}</p>
                            <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        if (user.role === 'superadmin') router.push("/superadmin/settings");
                        else if (user.role === 'admin') router.push("/admin/settings");
                        else router.push("/settings");
                    }}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
