"use client"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardRedirect() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login')
            } else if (user.role === 'superadmin') {
                router.push('/superadmin/dashboard')
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard')
            } else {
                router.push('/employee/schedule')
            }
        }
    }, [user, isLoading, router])

    return <div className="flex h-screen items-center justify-center">Redirecting...</div>
}
