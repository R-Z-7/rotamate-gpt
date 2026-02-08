"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Save, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { format, addDays, startOfWeek } from "date-fns"
import { cn } from "@/lib/utils"

type AvailabilityRecord = {
    id?: number
    date: string
    is_available: boolean
    reason?: string
}

export default function AvailabilityPage() {
    const [availability, setAvailability] = useState<Record<string, AvailabilityRecord>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    useEffect(() => {
        fetchAvailability()
    }, [weekStart])

    const fetchAvailability = async () => {
        try {
            const res = await api.get("/availability/")
            const availabilityMap: Record<string, AvailabilityRecord> = {}
            res.data.forEach((record: any) => {
                const dateKey = format(new Date(record.date), "yyyy-MM-dd")
                availabilityMap[dateKey] = {
                    id: record.id,
                    date: record.date,
                    is_available: record.is_available,
                    reason: record.reason,
                }
            })
            setAvailability(availabilityMap)
        } catch (err: any) {
            if (err.response?.status === 401) {
                toast.error("Session expired. Redirecting to login...")
                localStorage.removeItem("token")
                window.location.href = "/login"
            } else {
                toast.error("Failed to load availability")
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    const toggleAvailability = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd")
        const current = availability[dateKey]

        setAvailability({
            ...availability,
            [dateKey]: {
                ...current,
                date: date.toISOString(),
                is_available: !current?.is_available,
            },
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const promises = Object.values(availability).map((record) => {
                if (record.id) {
                    // Update existing
                    return api.put(`/availability/${record.id}`, {
                        is_available: record.is_available,
                        reason: record.reason,
                    })
                } else {
                    // Create new
                    return api.post("/availability/", {
                        date: record.date,
                        is_available: record.is_available,
                        reason: record.reason,
                    })
                }
            })

            await Promise.all(promises)
            toast.success("Availability saved successfully")
            fetchAvailability()
        } catch (err) {
            toast.error("Failed to save availability")
        } finally {
            setSaving(false)
        }
    }

    const goToPreviousWeek = () => {
        setWeekStart(addDays(weekStart, -7))
    }

    const goToNextWeek = () => {
        setWeekStart(addDays(weekStart, 7))
    }

    const goToCurrentWeek = () => {
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Availability</h1>
                    <p className="text-muted-foreground mt-1">
                        Set your availability to help managers schedule shifts.
                    </p>
                </div>
                <Button
                    size="lg"
                    className="gap-2 shadow-sm"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Week Navigation */}
            <Card className="bg-card">
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button variant="outline" onClick={goToPreviousWeek} className="w-full sm:w-auto">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous Week
                    </Button>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 font-semibold text-lg">
                            <Calendar className="h-5 w-5 text-primary" />
                            <span>
                                {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
                            </span>
                        </div>
                        <Button variant="link" size="sm" onClick={goToCurrentWeek} className="mt-1 h-auto p-0 text-primary">
                            Jump to Current Week
                        </Button>
                    </div>
                    <Button variant="outline" onClick={goToNextWeek} className="w-full sm:w-auto">
                        Next Week
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </Card>

            {/* Availability Grid */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>Click on days to toggle status</span>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-sm font-normal">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500" />
                                <span className="text-muted-foreground">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-destructive/10 border border-destructive" />
                                <span className="text-muted-foreground">Unavailable</span>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4">
                            {weekDays.map((_, i) => (
                                <div
                                    key={i}
                                    className="h-32 bg-muted animate-pulse rounded-lg"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                            {weekDays.map((day) => {
                                const dateKey = format(day, "yyyy-MM-dd")
                                const record = availability[dateKey]
                                const isAvailable = record?.is_available ?? true
                                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))

                                return (
                                    <button
                                        key={dateKey}
                                        onClick={() => !isPast && toggleAvailability(day)}
                                        disabled={isPast}
                                        className={cn(
                                            "relative p-4 rounded-lg border transition-all duration-200 text-left h-32 flex flex-col justify-between group",
                                            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                            isAvailable
                                                ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900"
                                                : "border-destructive/20 bg-destructive/5 hover:border-destructive/40",
                                            isPast && "opacity-50 cursor-not-allowed hover:shadow-none grayscale"
                                        )}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                                {format(day, "EEE")}
                                            </div>
                                            {isPast && (
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                                    PAST
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-3xl font-bold">
                                            {format(day, "d")}
                                        </div>

                                        <div
                                            className={cn(
                                                "text-xs font-semibold px-2 py-1 rounded-full w-fit",
                                                isAvailable
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                                    : "bg-destructive/10 text-destructive"
                                            )}
                                        >
                                            {isAvailable ? "Available" : "Unavailable"}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
