"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/admin/stat-card"
import { NavCard } from "@/components/dashboard/nav-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Clock, AlertCircle, TrendingUp, PlusCircle, BarChart3, Settings, ClipboardList } from 'lucide-react'
import api from "@/lib/api"
import { motion } from "framer-motion"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from "recharts"

export default function DashboardPage() {
    const [chartData, setChartData] = useState({
        hoursData: [],
        shiftDistribution: [],
        staffingTrend: []
    })
    const [stats, setStats] = useState({
        employees: 0,
        shifts: 0,
        requests: 0,
        alerts: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    api.get('/dashboard-metrics/stats'),
                    api.get('/dashboard-metrics/chart-data')
                ])
                setStats(statsRes.data)
                setChartData(chartsRes.data)
            } catch (error: any) {
                console.error("Dashboard fetch error:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Dashboard Overview
                </h1>
                <p className="text-muted-foreground mt-2">
                    Start your day with a quick overview of your team's activity.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={stats.employees}
                    description="Active team members"
                    icon={Users}
                    trend={{ value: 8, isPositive: true }}
                    gradient
                />
                <StatCard
                    title="Upcoming Shifts"
                    value={stats.shifts}
                    description="Next 7 days"
                    icon={Calendar}
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Time Off Requests"
                    value={stats.requests}
                    description="Pending approval"
                    icon={Clock}
                />
                <StatCard
                    title="Alerts"
                    value={stats.alerts}
                    description="System notifications"
                    icon={AlertCircle}
                />
            </div>

            {/* Navigation Cards (External Repo Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NavCard
                    title="Employee Management"
                    description="Manage your team members"
                    icon={Users}
                    href="/admin/employees"
                >
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Easily add, edit, and manage your team's information.</p>
                        <div className="flex items-center text-xs text-primary mt-4">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            <span>Add new employees</span>
                        </div>
                    </div>
                </NavCard>

                <NavCard
                    title="Rota Management"
                    description="Schedule and assign shifts"
                    icon={Calendar}
                    href="/admin/rota"
                >
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Create and manage work schedules for your employees.</p>
                        <div className="flex items-center text-xs text-primary mt-4">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>View this week's rota</span>
                        </div>
                    </div>
                </NavCard>

                <NavCard
                    title="Reports"
                    description="View team analytics"
                    icon={BarChart3}
                    href="/admin/reports"
                >
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Access detailed reports about your team's hours.</p>
                        <div className="flex items-center text-xs text-primary mt-4">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            <span>Generate reports</span>
                        </div>
                    </div>
                </NavCard>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Hours Worked Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="col-span-4"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Hours Worked This Week
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.hoursData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                            color: "hsl(var(--foreground))"
                                        }}
                                    />
                                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Shift Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="col-span-3"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Shift Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData.shiftDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData?.shiftDistribution?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            color: "hsl(var(--foreground))"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
