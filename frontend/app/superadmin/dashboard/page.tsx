"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Building2, Users, CreditCard, ChevronRight, BarChart3, Newspaper } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [stats] = useState({
        companies: 15,
        totalUsers: 243,
        activeSubscriptions: 12,
        revenue: '$4,320',
        trialAccounts: 3
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Platform Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Welcome back, {user?.full_name || 'Super Admin'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.companies}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            +2 this month
                        </p>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-3" asChild>
                            <Link href="/superadmin/companies">
                                View all companies
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            +18 this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats.trialAccounts} accounts in trial
                        </p>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-3" asChild>
                            <Link href="/superadmin/billing">
                                View billing
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest platform activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">New company registered</p>
                                    <p className="text-xs text-slate-500">Acme Corp created an account</p>
                                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Subscription upgraded</p>
                                    <p className="text-xs text-slate-500">Tech Solutions Ltd upgraded to Premium</p>
                                    <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">User milestone reached</p>
                                    <p className="text-xs text-slate-500">Platform has surpassed 200 users</p>
                                    <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>
                            Monthly revenue statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px] flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium">Revenue Charts Coming Soon</h3>
                            <p className="text-slate-500 max-w-md mt-2">
                                Revenue visualization and reporting will be available soon.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
