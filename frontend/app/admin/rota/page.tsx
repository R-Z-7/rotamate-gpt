"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotaCalendar } from "@/components/admin/rota-calendar"
import { ShiftFormDrawer } from "@/components/admin/shift-form-drawer"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SuggestScheduleButton } from "@/components/admin/suggest-schedule-button"
import { AISuggestModal } from "@/app/admin/rota/components/AISuggestModal"

export default function RotaPage() {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [shifts, setShifts] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedShift, setSelectedShift] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [isSmartModalOpen, setIsSmartModalOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [currentDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = addWeeks(weekStart, 1)

            const [shiftsRes, employeesRes] = await Promise.all([
                api.get("/shifts/", {
                    params: {
                        start_date: weekStart.toISOString(),
                        end_date: weekEnd.toISOString(),
                    },
                }),
                api.get("/users/"),
            ])

            const formattedShifts = shiftsRes.data.map((shift: any) => ({
                id: shift.id,
                employeeId: shift.employee_id,
                employeeName: shift.employee?.full_name || "Unknown",
                startTime: shift.start_time,
                endTime: shift.end_time,
                role: shift.role_type || "Nurse",
            }))

            setShifts(formattedShifts)
            setEmployees(employeesRes.data)
        } catch (err: any) {
            if (err.response?.status === 401) {
                toast.error("Session expired. Redirecting to login...")
                localStorage.removeItem("token")
                router.push("/login")
            } else {
                toast.error("Failed to load rota data")
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePreviousWeek = () => setCurrentDate((date) => subWeeks(date, 1))
    const handleNextWeek = () => setCurrentDate((date) => addWeeks(date, 1))
    const handleToday = () => setCurrentDate(new Date())

    const handleShiftMove = async (shiftId: number, newDate: Date) => {
        const shiftIndex = shifts.findIndex((s) => s.id === shiftId)
        if (shiftIndex === -1) return
        const shift = shifts[shiftIndex]

        const oldStartTime = new Date(shift.startTime)
        const oldEndTime = new Date(shift.endTime)
        const originalShifts = [...shifts] // Backup for rollback

        const newStartTime = new Date(newDate)
        newStartTime.setHours(oldStartTime.getHours(), oldStartTime.getMinutes())

        const newEndTime = new Date(newDate)
        newEndTime.setHours(oldEndTime.getHours(), oldEndTime.getMinutes())

        if (newEndTime < newStartTime) {
            newEndTime.setDate(newEndTime.getDate() + 1)
        }

        // Optimistic Update
        const updatedShift = {
            ...shift,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
        }

        const newShifts = [...shifts]
        newShifts[shiftIndex] = updatedShift
        setShifts(newShifts)

        try {
            await api.put(`/shifts/${shiftId}`, {
                start_time: newStartTime.toISOString(),
                end_time: newEndTime.toISOString(),
                employee_id: shift.employeeId,
            })
            toast.success("Shift rescheduled")
            // No need to fetchData() immediately if successful, but we can to be safe
            // or just rely on the optimistic update.
            // fetchData() 
        } catch (err) {
            toast.error("Failed to move shift")
            // Rollback
            setShifts(originalShifts)
            // Maybe fetch to ensure sync
            fetchData()
        }
    }

    const handleCreateShift = () => {
        setSelectedShift(null)
        setSelectedDate(undefined)
        setIsDrawerOpen(true)
    }

    const handleEditShift = (shift: any) => {
        setSelectedShift(shift)
        setIsDrawerOpen(true)
    }

    const handleSlotClick = (date: Date) => {
        setSelectedDate(date)
        setSelectedShift(null)
        setIsDrawerOpen(true)
    }

    const handleSaveShift = async (shiftData: any) => {
        try {
            if (selectedShift) {
                await api.put(`/shifts/${selectedShift.id}`, shiftData)
                toast.success("Shift updated")
            } else {
                await api.post("/shifts/", shiftData)
                toast.success("Shift created")
            }
            setIsDrawerOpen(false)
            fetchData()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to save shift")
        }
    }

    const handleDeleteShift = async (id: number) => {
        if (!confirm("Are you sure you want to delete this shift?")) return

        try {
            await api.delete(`/shifts/${id}`)
            toast.success("Shift deleted")
            setIsDrawerOpen(false)
            fetchData()
        } catch (err) {
            toast.error("Failed to delete shift")
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Rota Schedule</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage weekly shifts by dragging and dropping.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                    <SuggestScheduleButton onClick={() => setIsSmartModalOpen(true)} />
                    <Button onClick={handleCreateShift} className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        Add Shift
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium min-w-[140px] text-center">
                            {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} -{" "}
                            {format(addWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 1), "MMM d, yyyy")}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button variant="ghost" size="sm" onClick={handleToday}>
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                        <Filter className="h-3.5 w-3.5" />
                        Filter Roles
                    </Button>
                </div>
            </div>

            {/* Calendar Area */}
            <div className="flex-1 min-h-0 bg-background/50 rounded-lg border shadow-sm p-4 overflow-auto">
                {loading ? (
                    <div className="grid grid-cols-7 gap-4 h-full min-h-[500px]">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2 h-full">
                                <div className="h-12 bg-muted/50 animate-pulse rounded-t-lg" />
                                <div className="flex-1 bg-muted/20 animate-pulse rounded-b-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <RotaCalendar
                        shifts={shifts}
                        onShiftMove={handleShiftMove}
                        onShiftClick={handleEditShift}
                        onSlotClick={handleSlotClick}
                    />
                )}
            </div>

            <ShiftFormDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSaveShift}
                onDelete={handleDeleteShift}
                employees={employees}
                initialData={selectedShift}
                initialDate={selectedDate}
            />

            <AISuggestModal
                isOpen={isSmartModalOpen}
                onClose={() => setIsSmartModalOpen(false)}
                onApply={() => fetchData()}
                currentDate={currentDate}
                shifts={shifts}
            />
        </div>
    )
}
