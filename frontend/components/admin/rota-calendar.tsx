"use client"

import * as React from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { User, Clock, Briefcase } from "lucide-react"

type Shift = {
    id: number
    employeeId: number
    employeeName: string
    startTime: string
    endTime: string
    role: string
}

type RotaCalendarProps = {
    shifts: Shift[]
    onShiftMove?: (shiftId: number, newDate: Date) => void
    onShiftClick?: (shift: Shift) => void
    onSlotClick?: (date: Date) => void
    readOnly?: boolean
}

export function RotaCalendar({
    shifts,
    onShiftMove,
    onShiftClick,
    onSlotClick,
    readOnly = false,
}: RotaCalendarProps) {
    const [activeId, setActiveId] = React.useState<number | null>(null)
    const [weekStart] = React.useState(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    )

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        if (readOnly || !onShiftMove) {
            setActiveId(null)
            return
        }
        const { active, over } = event

        if (over && active.id !== over.id) {
            // Check if over.id is a date string (day column)
            // Or if it's another shift, we need to find the day it belongs to.
            // But since shifts are children of DroppableDay, dropping on a shift often means dropping on the day.
            // However, @dnd-kit usually reports the specific droppable under cursor.

            // In our structure:
            // - Day column has id = date.toISOString()
            // - Shifts are Sortable, which are also droppable targets by default in SortableContext.

            // If we drop on a SortableShift, `over.id` will be the shift ID.
            // We need to find which day column contains this shift or corresponds to the drop.

            // Strategy: 
            // 1. If over.id is a date string -> Use it.
            // 2. If over.id is a shift ID -> Find that shift and use its start time's day.

            let targetDate: Date | null = null;
            const dateStr = over.id as string;

            // Check if ID is a valid date string from our columns
            const potentialDate = new Date(dateStr);
            if (!isNaN(potentialDate.getTime()) && dateStr.includes('T')) {
                // Likely a date string (ISO format)
                targetDate = potentialDate;
            } else {
                // Assume it's a shift ID
                const overShiftId = over.id as number;
                const overShift = shifts.find(s => s.id === overShiftId);
                if (overShift) {
                    targetDate = new Date(overShift.startTime);
                }
            }

            if (targetDate) {
                // Ensure we preserve the TIME of the shift, only changing the DATE
                // Implementation on parent handles time preservation, we just pass the new DATE.
                onShiftMove(active.id as number, targetDate);
            }
        }

        setActiveId(null)
    }

    const getShiftsForDay = (date: Date) => {
        return shifts.filter((shift) => isSameDay(new Date(shift.startTime), date))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-7 gap-4 h-full min-h-[600px]">
                {weekDays.map((day) => (
                    <DroppableDay
                        key={day.toISOString()}
                        day={day}
                        readOnly={readOnly}
                        onSlotClick={onSlotClick}
                    >
                        {getShiftsForDay(day).map((shift) => (
                            <SortableShift
                                key={shift.id}
                                shift={shift}
                                onClick={() => onShiftClick?.(shift)}
                                disabled={readOnly}
                            />
                        ))}
                    </DroppableDay>
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <ShiftCard
                        shift={shifts.find((s) => s.id === activeId)!}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

// Helper component for the drop zone
import { useDroppable } from "@dnd-kit/core"

function DroppableDay({
    day,
    children,
    readOnly,
    onSlotClick,
    activeId
}: {
    day: Date,
    children: React.ReactNode,
    readOnly: boolean,
    onSlotClick?: (date: Date) => void,
    activeId?: number | null
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: day.toISOString(),
        disabled: readOnly,
    })

    const isToday = isSameDay(day, new Date())

    // Explicitly check if the dragged item is over this container
    // When dragging a shift OVER another shift, dnd-kit might report the shift as 'over'
    // but the drop event bubbles or we can check visually.
    // For simple visual feedback, `isOver` from `useDroppable` is best when the cursor is over the container directly.

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className={cn(
                "text-center p-3 rounded-t-lg font-medium transition-colors",
                isToday ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground",
                isOver && !readOnly ? "bg-primary/80 text-primary-foreground scale-105" : ""
            )}>
                <div className="text-xs uppercase tracking-wider opacity-80">{format(day, "EEE")}</div>
                <div className="text-xl font-bold">{format(day, "d")}</div>
            </div>
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-b-lg border-2 border-t-0 p-2 space-y-2 transition-all duration-200",
                    isToday ? "border-primary/20 bg-primary/5" : "border-muted bg-card",
                    !readOnly && "hover:bg-accent/50 cursor-pointer",
                    isOver && !readOnly && "border-primary ring-2 ring-primary/20 bg-primary/10 shadow-inner"
                )}
                onClick={() => !readOnly && onSlotClick?.(day)}
            >
                {children}
            </div>
        </div>
    )
}

function ShiftCard({
    shift,
    onClick,
    isOverlay,
    className
}: {
    shift: Shift
    onClick?: () => void
    isOverlay?: boolean
    className?: string
}) {
    // Generate initials
    const initials = shift.employeeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <div
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
            }}
            className={cn(
                "p-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 group relative overflow-hidden",
                "hover:shadow-md hover:border-primary/50",
                isOverlay && "shadow-xl border-primary scale-105 cursor-grabbing rotate-2",
                className
            )}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />

            <div className="pl-2 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Clock className="h-3 w-3" />
                        <span>
                            {format(new Date(shift.startTime), "HH:mm")} - {format(new Date(shift.endTime), "HH:mm")}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold ring-2 ring-background">
                        {initials}
                    </div>
                    <div className="text-sm font-medium truncate leading-none">
                        {shift.employeeName}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{shift.role}</span>
                </div>
            </div>
        </div>
    )
}

function SortableShift({ shift, onClick, disabled }: { shift: Shift; onClick: () => void; disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: shift.id, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1, // Hide original when dragging
        zIndex: isDragging ? 50 : "auto",
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ShiftCard shift={shift} onClick={onClick} />
        </div>
    )
}
