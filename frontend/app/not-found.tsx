"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
    const { user } = useAuth()

    const dashboardLink = user?.role === 'super_admin'
        ? '/superadmin/dashboard'
        : user?.role === 'admin'
            ? '/admin/dashboard'
            : '/employee/schedule'

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center animate-fade-in">
            <div className="space-y-4">
                <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-4">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                    Page Not Found
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    The page you’re looking for doesn’t exist or has been moved.
                    Please check the URL or navigate back to the dashboard.
                </p>
            </div>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                    <Link href={dashboardLink}>
                        <Home className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link href="javascript:history.back()">
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Link>
                </Button>
            </div>
        </div>
    )
}
