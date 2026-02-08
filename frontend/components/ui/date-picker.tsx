"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type DatePickerProps = {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = "Pick a date",
    disabled = false,
    className,
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-slate-500",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                    mode="single"
                    selected={date}
                    onSelect={onDateChange}
                    initialFocus
                    className="p-3"
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                        ),
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-slate-400",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-slate-800/50 dark:[&:has([aria-selected])]:bg-slate-800",
                        day: cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                        ),
                        day_range_end: "day-range-end",
                        day_selected:
                            "bg-blue-600 text-slate-50 hover:bg-blue-600 hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50 dark:bg-blue-500 dark:text-slate-50 dark:hover:bg-blue-500 dark:hover:text-slate-50 dark:focus:bg-blue-500 dark:focus:text-slate-50",
                        day_today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
                        day_outside:
                            "day-outside text-slate-500 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30 dark:text-slate-400 dark:aria-selected:bg-slate-800/50 dark:aria-selected:text-slate-400",
                        day_disabled: "text-slate-500 opacity-50 dark:text-slate-400",
                        day_range_middle:
                            "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50",
                        day_hidden: "invisible",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
