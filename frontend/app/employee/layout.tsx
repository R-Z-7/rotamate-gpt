"use client";

import { EmployeeSidebar } from '@/components/employee/Sidebar';
import { MobileMenu } from "@/components/layout/mobile-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DemoBadge } from "@/components/layout/demo-badge";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [isLoading, user, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center space-y-4 flex-col">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <EmployeeSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center border-b border-border bg-background px-6 md:hidden shrink-0 justify-between">
                    <div className="flex items-center gap-4">
                        <MobileMenu>
                            <EmployeeSidebar mobile />
                        </MobileMenu>
                        <span className="font-semibold">RotaMate</span>
                    </div>
                    <NotificationBell />
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
                <DemoBadge />
            </div>
        </div>
    );
}
