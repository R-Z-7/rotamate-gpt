"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

type ShiftFormProps = {
    isOpen: boolean
    onClose: () => void
    onSave: (shift: any) => void
    onDelete?: (id: number) => void
    initialData?: any
    initialDate?: Date
    employees: any[]
    onRefresh?: () => void
}

export function ShiftFormDrawer({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    initialDate,
    employees,
    onRefresh,
}: ShiftFormProps) {
    const [formData, setFormData] = useState({
        employeeId: "",
        date: undefined as Date | undefined,
        startTime: "09:00",
        endTime: "17:00",
        role: "Nurse",
        status: "assigned",
    })
    
    const [requiresOverride, setRequiresOverride] = useState(false)
    const [overrideReason, setOverrideReason] = useState("")

    useEffect(() => {
        if (initialData) {
            setFormData({
                employeeId: initialData.employeeId ? initialData.employeeId.toString() : "",
                date: new Date(initialData.startTime),
                startTime: format(new Date(initialData.startTime), "HH:mm"),
                endTime: format(new Date(initialData.endTime), "HH:mm"),
                role: initialData.role,
                status: initialData.status || "assigned",
            })
            setRequiresOverride(false)
            setOverrideReason("")
        } else {
            setFormData({
                employeeId: "",
                date: initialDate || undefined,
                startTime: "09:00",
                endTime: "17:00",
                role: "Nurse",
                status: "assigned",
            })
            setRequiresOverride(false)
            setOverrideReason("")
        }
    }, [initialData, isOpen, initialDate])

    const handleSubmit = async () => {
        if (!formData.date || !formData.startTime || !formData.endTime) return
        if (formData.status !== "open" && !formData.employeeId) return

        const startDateTime = new Date(formData.date)
        const [startHours, startMinutes] = formData.startTime.split(":")
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))

        const endDateTime = new Date(formData.date)
        const [endHours, endMinutes] = formData.endTime.split(":")
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))

        if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1)
        }

        try {
            await onSave({
                employee_id: formData.status === "open" ? undefined : parseInt(formData.employeeId),
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                role_type: formData.role,
                status: formData.status,
                ...(requiresOverride && overrideReason ? { override_reason: overrideReason } : {}),
            })
            setRequiresOverride(false)
            setOverrideReason("")
        } catch (err: any) {
            const detail = err.response?.data?.detail || ""
            if (detail.includes("override_reason")) {
                setRequiresOverride(true)
            }
        }
    }

    const handleResolveOverride = async () => {
        if (!initialData) return
        try {
            await api.post(`/shifts/${initialData.id}/override/resolve`, { status: "resolved" })
            toast.success("Override resolved")
            if (onRefresh) onRefresh()
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to resolve override")
        }
    }

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>
                            {initialData ? "Edit Shift" : "Create New Shift"}
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="open">Open Shift</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.status !== "open" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Employee</label>
                                <Select
                                    value={formData.employeeId}
                                    onValueChange={(val) => setFormData({ ...formData, employeeId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <DatePicker
                                date={formData.date}
                                onDateChange={(date) => setFormData({ ...formData, date })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Time</label>
                                <TimePicker
                                    time={formData.startTime}
                                    onTimeChange={(time) => setFormData({ ...formData, startTime: time })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Time</label>
                                <TimePicker
                                    time={formData.endTime}
                                    onTimeChange={(time) => setFormData({ ...formData, endTime: time })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Nurse">Nurse</SelectItem>
                                    <SelectItem value="HCA">HCA</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {requiresOverride && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-destructive">Override Reason Required</label>
                                <Input
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="Employee is unavailable. Enter reason..."
                                    className="border-destructive"
                                />
                            </div>
                        )}

                        {initialData?.overrideRequest && 
                         (initialData.overrideRequest.status === 'pending' || initialData.overrideRequest.status === 'change_requested') && (
                            <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
                                <AlertTriangle className="h-4 w-4 stroke-amber-600 dark:stroke-amber-400" />
                                <AlertTitle>Employee Override Response: {initialData.overrideRequest.status.replace("_", " ")}</AlertTitle>
                                <AlertDescription>
                                    <p className="mb-2 text-sm text-amber-800 dark:text-amber-300">
                                        The employee has responded to this shift override. Please resolve to finalize the placement.
                                    </p>
                                    <Button size="sm" onClick={handleResolveOverride} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Resolved
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DrawerFooter>
                        <Button onClick={handleSubmit}>Save Shift</Button>
                        {initialData && onDelete && (
                            <Button variant="destructive" onClick={() => onDelete(initialData.id)}>
                                Delete Shift
                            </Button>
                        )}
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

import { format } from "date-fns"
