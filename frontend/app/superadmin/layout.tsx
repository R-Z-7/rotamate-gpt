"use client";

import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar";
import { SuperAdminNavbar } from "@/components/layout/super-admin-navbar";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Protect SuperAdmin Routes
    useEffect(() => {
        if (!isLoading) {
            if (!localStorage.getItem('token')) {
                router.push('/login');
            } else if (user && user.role !== 'superadmin') {
                router.push('/dashboard'); // unauthorized, redirect to standard dashboard or 403
            }
        }
    }, [isLoading, user, router]);

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user || user.role !== 'superadmin') return null; // Prevent flash of content

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <SuperAdminSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <SuperAdminNavbar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
