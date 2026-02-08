"use client"

import { useAuth } from "@/context/AuthContext"
import AdminLayout from "@/app/admin/layout"
import EmployeeLayout from "@/app/employee/layout"
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
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [isLoading, user, router])

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!user) return null

    if (user.role === "admin") {
        return <AdminLayout>{children}</AdminLayout>
    }

    return <EmployeeLayout>{children}</EmployeeLayout>
}
