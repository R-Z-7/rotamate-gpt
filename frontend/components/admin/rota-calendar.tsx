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

        // The 'over' id handles the drop target. 
        // In this grid implementation, we need to know WHICH day we dropped on.
        // We can attach data to the droppable zones.

        // Simplified Logic: For now, we are relying on visual cue only as the implementation 
        // of finding the exact *date* from the drop zone requires the drop zone to be a droppable.
        // Assuming the parent component will handle the logic if we pass the shift info.

        // However, looking at the previous implementation, the drop logic seemed incomplete 
        // in the provided snippet ("// Logic to update shift date").
        // To make this fully functional, we'd need DndContext's `over` to have the date ID.

        // Since I'm focusing on attributes/styling, I will retain the structure but ensure
        // the drop zones have IDs corresponding to the date ISO string.

        if (over && active.id !== over.id) {
            // If over.id is a date string (which we set on the columns), we move to that date.
            const dateStr = over.id as string
            const newDate = new Date(dateStr)

            if (!isNaN(newDate.getTime())) {
                onShiftMove(active.id as number, newDate)
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
    onSlotClick
}: {
    day: Date,
    children: React.ReactNode,
    readOnly: boolean,
    onSlotClick?: (date: Date) => void
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: day.toISOString(),
        disabled: readOnly,
    })

    const isToday = isSameDay(day, new Date())

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className={cn(
                "text-center p-3 rounded-t-lg font-medium transition-colors",
                isToday ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
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
                    isOver && "border-primary ring-2 ring-primary/20 bg-accent"
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
