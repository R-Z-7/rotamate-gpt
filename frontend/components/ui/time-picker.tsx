"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type TimePickerProps = {
    time?: string // Format: "HH:mm"
    onTimeChange?: (time: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function TimePicker({
    time,
    onTimeChange,
    placeholder = "Pick a time",
    disabled = false,
    className,
}: TimePickerProps) {
    const [hours, setHours] = React.useState(time?.split(":")[0] || "09")
    const [minutes, setMinutes] = React.useState(time?.split(":")[1] || "00")

    React.useEffect(() => {
        if (time) {
            const [h, m] = time.split(":")
            setHours(h)
            setMinutes(m)
        }
    }, [time])

    const handleTimeChange = (newHours: string, newMinutes: string) => {
        const timeString = `${newHours}:${newMinutes}`
        onTimeChange?.(timeString)
    }

    const hourOptions = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
    )
    const minuteOptions = Array.from({ length: 60 }, (_, i) =>
        i.toString().padStart(2, "0")
    )

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !time && "text-slate-500",
                        className
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {time || <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Hour</label>
                        <Select
                            value={hours}
                            onValueChange={(value) => {
                                setHours(value)
                                handleTimeChange(value, minutes)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {hourOptions.map((hour) => (
                                    <SelectItem key={hour} value={hour}>
                                        {hour}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-5 text-2xl font-bold">:</div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Minute</label>
                        <Select
                            value={minutes}
                            onValueChange={(value) => {
                                setMinutes(value)
                                handleTimeChange(hours, value)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {minuteOptions.map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                        {minute}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
