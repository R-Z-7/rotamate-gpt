"use client"

import { useAuth } from "@/context/AuthContext"
import AdminLayout from "@/app/admin/layout"
import SuperAdminLayout from "@/app/superadmin/layout"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login")
            } else if (user.role !== "admin" && user.role !== "superadmin") {
                // Settings page is currently admin-only
                router.push("/employee/schedule")
            }
        }
    }, [isLoading, user, router])

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!user) return null

    if (user.role === "superadmin") {
        return <SuperAdminLayout>{children}</SuperAdminLayout>
    }

    if (user.role === "admin") {
        return <AdminLayout>{children}</AdminLayout>
    }

    return null // Should not reach here due to redirect
}
