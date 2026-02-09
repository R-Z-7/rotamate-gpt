"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, Users, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts"

export default function ReportsPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalHours: 0,
        overtimeHours: 0,
        activeEmployees: 0,
        absenceRate: 0
    })
    const [chartData, setChartData] = useState({
        weeklyHoursData: [],
        absenceTrendData: []
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    api.get('/dashboard-metrics/stats'),
                    api.get('/dashboard-metrics/chart-data')
                ])

                // Process stats (some might need calculation if not provided directly)
                // For now mapping available fields and mocking missing ones for display
                setStats({
                    totalHours: 301.5, // Mocked as backend doesn't provide this yet
                    overtimeHours: 24, // Mocked
                    activeEmployees: statsRes.data.employees,
                    absenceRate: 2.4 // Mocked
                })

                setChartData({
                    weeklyHoursData: chartsRes.data.hours_data,
                    absenceTrendData: chartsRes.data.absence_trend || []
                })
            } catch (error) {
                console.error("Failed to fetch reports data:", error)
                toast.error("Failed to load report data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleExport = () => {
        setIsExporting(true)
        // Simulate API call
        setTimeout(() => {
            setIsExporting(false)
            toast.success("Report downloaded successfully")
        }, 1500)
    }

    if (loading) {
        return <div className="p-8 text-center">Loading reports...</div>
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Insights into your team's performance and attendance.
                    </p>
                </div>
                <Button onClick={handleExport} disabled={isExporting} className="gap-2 shadow-sm">
                    <Download className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export Report"}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalHours}</div>
                        <p className="text-xs text-muted-foreground">
                            +12% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overtimeHours}</div>
                        <p className="text-xs text-muted-foreground">
                            +4% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeEmployees}</div>
                        <p className="text-xs text-muted-foreground">
                            +2 new this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absence Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.absenceRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            -0.5% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Weekly Hours Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Weekly Hours Distribution</CardTitle>
                        <CardDescription>
                            Total hours worked vs overtime per day
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.weeklyHoursData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}h`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            color: "hsl(var(--foreground))"
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="hours" name="Regular Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="a" />
                                    {/* Backend doesn't differentiate overtime yet, so not showing it stack or using hours as partial */}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Absence Trends Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                        <CardDescription>
                            Late arrivals and absences over the last 4 weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.absenceTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            color: "hsl(var(--foreground))"
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="absent"
                                        name="Absences"
                                        stroke="hsl(var(--destructive))"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="late"
                                        name="Late Arrivals"
                                        stroke="hsl(var(--warning, #f59e0b))"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
