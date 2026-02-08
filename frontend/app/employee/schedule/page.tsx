"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { Calendar, Clock, MapPin, List, LayoutGrid } from "lucide-react"
import { motion } from "framer-motion"
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { Button } from "@/components/ui/button"
import { RotaCalendar } from "@/components/admin/rota-calendar"

export default function MySchedulePage() {
    const [shifts, setShifts] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        fetchShifts()
    }, [currentDate])

    const fetchShifts = async () => {
        setLoading(true)
        try {
            // For list view we might want all upcoming, but for calendar we want specific range
            // For now, let's fetch a broader range or just all
            const res = await api.get('/shifts/')

            // Transform for calendar if needed, but RotaCalendar expects similar structure
            // We need to map role_type to role for RotaCalendar if we reuse it directly with types
            // But RotaCalendar types define role: string
            const formatted = res.data.map((s: any) => ({
                id: s.id,
                employeeId: s.employee_id,
                employeeName: s.employee?.full_name || "Me",
                startTime: s.start_time,
                endTime: s.end_time,
                role: s.role_type || "Shift", // Mapping
                status: s.status
            }))

            setShifts(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'success'
            case 'pending':
                return 'warning'
            case 'cancelled':
                return 'danger'
            default:
                return 'default'
        }
    }

    // Calendar navigation (only used in calendar view)
    const handlePreviousWeek = () => setCurrentDate((date) => subWeeks(date, 1))
    const handleNextWeek = () => setCurrentDate((date) => addWeeks(date, 1))
    const handleToday = () => setCurrentDate(new Date())

    return (
        <div className="space-y-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        My Schedule
                    </h1>
                    <p className="text-slate-500 mt-2">
                        View your upcoming shifts and manage your schedule
                    </p>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="gap-2"
                    >
                        <List className="h-4 w-4" />
                        List
                    </Button>
                    <Button
                        variant={viewMode === "calendar" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("calendar")}
                        className="gap-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Calendar
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-lg bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : viewMode === "list" ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto pb-8">
                        {shifts.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                    No upcoming shifts
                                </p>
                            </div>
                        ) : (
                            shifts.map((shift: any, index: number) => (
                                <motion.div
                                    key={shift.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <Card variant="elevated" className="border-l-4 border-l-blue-500 overflow-hidden">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-lg font-semibold">
                                                    {shift.role}
                                                </CardTitle>
                                                <Badge variant={getStatusColor(shift.status)}>
                                                    {shift.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {format(new Date(shift.startTime), "EEEE, MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {format(new Date(shift.startTime), "HH:mm")}
                                                    </span>
                                                    <span className="text-sm text-slate-400">to</span>
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {format(new Date(shift.endTime), "HH:mm")}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" onClick={handlePreviousWeek}>Previous</Button>
                                <span className="font-medium">
                                    {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - {" "}
                                    {format(addWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 1), "MMM d, yyyy")}
                                </span>
                                <Button variant="outline" size="sm" onClick={handleNextWeek}>Next</Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleToday}>Today</Button>
                        </div>
                        <div className="flex-1 border rounded-lg overflow-auto">
                            <RotaCalendar
                                shifts={shifts}
                                readOnly
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
