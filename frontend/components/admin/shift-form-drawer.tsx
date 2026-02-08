"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"

type ShiftFormProps = {
    isOpen: boolean
    onClose: () => void
    onSave: (shift: any) => void
    onDelete?: (id: number) => void
    initialData?: any
    initialDate?: Date
    employees: any[]
}

export function ShiftFormDrawer({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    initialDate,
    employees,
}: ShiftFormProps) {
    const [formData, setFormData] = useState({
        employeeId: "",
        date: undefined as Date | undefined,
        startTime: "09:00",
        endTime: "17:00",
        role: "Nurse",
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                employeeId: initialData.employeeId.toString(),
                date: new Date(initialData.startTime),
                startTime: format(new Date(initialData.startTime), "HH:mm"),
                endTime: format(new Date(initialData.endTime), "HH:mm"),
                role: initialData.role,
            })
        } else {
            setFormData({
                employeeId: "",
                date: initialDate || undefined,
                startTime: "09:00",
                endTime: "17:00",
                role: "Nurse",
            })
        }
    }, [initialData, isOpen, initialDate])

    const handleSubmit = () => {
        if (!formData.date || !formData.startTime || !formData.endTime || !formData.employeeId) {
            return
        }

        const startDateTime = new Date(formData.date)
        const [startHours, startMinutes] = formData.startTime.split(":")
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))

        const endDateTime = new Date(formData.date)
        const [endHours, endMinutes] = formData.endTime.split(":")
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))

        // Handle overnight shifts
        if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1)
        }

        onSave({
            employee_id: parseInt(formData.employeeId),
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            role_type: formData.role,
        })

        onClose()
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
