"use client";

import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { DemoBadge } from "@/components/layout/demo-badge";

// ... existing imports
import { useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />

            <div className={cn(
                "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                isCollapsed ? "md:ml-[70px]" : "md:ml-64"
            )}>
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 sm:p-6 md:p-8">
                    <div className="container mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Protect Admin Routes
    useEffect(() => {
        if (!isLoading) {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
            } else if (user && user.role !== 'admin' && user.role !== 'superadmin') {
                router.push('/employee/schedule');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [isLoading, user, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center space-y-4 flex-col">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Loading Admin Portal...</p>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
            <DemoBadge />
        </SidebarProvider>
    );
}
