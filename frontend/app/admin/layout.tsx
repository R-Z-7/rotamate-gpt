"use client";

import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Protect Admin Routes
    useEffect(() => {
        if (!isLoading && !localStorage.getItem('token')) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className={cn(
                "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                sidebarOpen ? "md:ml-64" : "md:ml-0"
            )}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 sm:p-6 md:p-8">
                    <div className="container mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
