import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, User, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import api from "@/lib/api"
import { toast } from "sonner"
import { SuggestScheduleButton } from "./suggest-schedule-button"

interface SmartScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
    currentDate: Date
}

interface SuggestedShift {
    employee_id: number
    employee_name: string
    start_time: string
    end_time: string
    role: string
    reason: string
}

export function SmartScheduleModal({ isOpen, onClose, onApply, currentDate }: SmartScheduleModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<SuggestedShift[]>([])
    const [explanation, setExplanation] = useState<string | null>(null)

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            // Determine range (current week)
            const start = new Date(currentDate)
            start.setHours(0, 0, 0, 0)
            // assuming mostly week view starts Monday
            const day = start.getDay() || 7
            if (day !== 1) start.setHours(-24 * (day - 1))

            const end = new Date(start)
            end.setDate(end.getDate() + 6)
            end.setHours(23, 59, 59, 999)

            const res = await api.post("/ai/suggest_schedule", {
                start_date: start.toISOString(),
                end_date: end.toISOString()
            })

            setSuggestions(res.data.shifts)
            setExplanation(res.data.explanation)
            toast.success("AI Suggestions Generated!")
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to generate schedule")
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            // In a real app, optimize backend to bulk insert
            // For now, loop requests to reusing existing POST endpoint if no bulk exists
            // Or ideally create a new bulk endpoint.
            // Let's assume we call existing POST /shifts/ for each

            const promises = suggestions.map(shift =>
                api.post("/shifts/", {
                    employee_id: shift.employee_id,
                    start_time: shift.start_time,
                    end_time: shift.end_time,
                    role_type: shift.role,
                    status: "assigned"
                })
            )

            await Promise.all(promises)

            toast.success(`Successfully added ${suggestions.length} shifts`)
            onApply()
            onClose()
        } catch (err) {
            toast.error("Failed to apply some shifts")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-purple-500" />
                        AI Smart Scheduling
                    </DialogTitle>
                    <DialogDescription>
                        Generate an optimized schedule based on employee availability and constraints.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4">
                    {!suggestions.length ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4 text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                                <Calendar className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Ready to Generate</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Click the button below to analyze availability and generate a rota.
                                </p>
                            </div>
                            <SuggestScheduleButton onClick={handleGenerate} isLoading={isLoading} />
                        </div>
                    ) : (
                        <div className="space-y-4 h-full flex flex-col">
                            {explanation && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>{explanation}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Proposed Shifts ({suggestions.length})
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setSuggestions([])}>
                                    Clear & Retry
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 pr-4 -mr-4">
                                <div className="space-y-3">
                                    {suggestions.map((shift, i) => (
                                        <div key={i} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex gap-3">
                                                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{shift.employee_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(shift.start_time), "EEE, MMM d")}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(shift.start_time), "HH:mm")} - {format(new Date(shift.end_time), "HH:mm")}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {shift.role}
                                                    </div>
                                                </div>
                                            </div>
                                            {shift.reason && (
                                                <div className="text-xs text-muted-foreground italic max-w-[120px] text-right">
                                                    AI: {shift.reason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {suggestions.length > 0 && (
                        <Button onClick={handleConfirm} disabled={isLoading} className="gap-2">
                            {isLoading ? "Applying..." : "Confirm & Apply to Rota"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
