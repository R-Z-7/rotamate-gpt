"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, startOfWeek } from "date-fns"
import { AlertTriangle, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AIAssignPreviewResponse,
    AIShiftSuggestion,
    applyAIAssignments,
    previewAIAssignments,
} from "@/lib/api/ai"

type RotaShiftSummary = {
    id: number
    startTime: string
    endTime: string
    role?: string
}

interface AISuggestModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
    currentDate: Date
    shifts: RotaShiftSummary[]
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
    ) {
        const response = (error as { response?: { data?: { detail?: string } } }).response
        if (response?.data?.detail) {
            return response.data.detail
        }
    }
    return fallback
}

function ShiftMeta({ shift }: { shift?: RotaShiftSummary }) {
    if (!shift) {
        return <p className="text-xs text-muted-foreground">Shift metadata unavailable</p>
    }
    return (
        <p className="text-xs text-muted-foreground">
            {format(new Date(shift.startTime), "EEE, MMM d HH:mm")} -{" "}
            {format(new Date(shift.endTime), "HH:mm")} · {shift.role || "Unspecified role"}
        </p>
    )
}

export function AISuggestModal({ isOpen, onClose, onApply, currentDate, shifts }: AISuggestModalProps) {
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)
    const [isApplying, setIsApplying] = useState(false)
    const [includeOpenShifts, setIncludeOpenShifts] = useState(true)
    const [preview, setPreview] = useState<AIAssignPreviewResponse | null>(null)

    const weekStart = useMemo(
        () => startOfWeek(currentDate, { weekStartsOn: 1 }),
        [currentDate]
    )
    const weekStartISO = useMemo(
        () => format(weekStart, "yyyy-MM-dd"),
        [weekStart]
    )
    const shiftMap = useMemo(() => {
        const map = new Map<number, RotaShiftSummary>()
        for (const shift of shifts) {
            map.set(shift.id, shift)
        }
        return map
    }, [shifts])

    const runPreview = useCallback(async () => {
        setIsPreviewLoading(true)
        try {
            const response = await previewAIAssignments({
                week_start: weekStartISO,
                include_open_shifts: includeOpenShifts,
            })
            setPreview(response)
        } catch (error: unknown) {
            console.error(error)
            toast.error(getApiErrorMessage(error, "Failed to generate AI suggestions"))
        } finally {
            setIsPreviewLoading(false)
        }
    }, [includeOpenShifts, weekStartISO])

    useEffect(() => {
        if (!isOpen) {
            return
        }
        runPreview()
    }, [isOpen, runPreview])

    const totalTargetShifts = preview
        ? preview.shift_suggestions.length
        : 0
    const recommendedCount = preview
        ? preview.shift_suggestions.filter((item) => item.recommended_employee_id !== null).length
        : 0
    const unfilledCount = preview?.unfilled_shifts.length || 0
    const recommendedAssignments = preview
        ? preview.shift_suggestions
            .filter((item) => item.recommended_employee_id !== null)
            .map((item) => ({
                shift_id: item.shift_id,
                employee_id: item.recommended_employee_id as number,
            }))
        : []

    const applyRecommendations = async () => {
        if (!preview) {
            return
        }
        if (recommendedAssignments.length === 0) {
            toast.error("No recommended assignments available to apply")
            return
        }

        setIsApplying(true)
        try {
            const result = await applyAIAssignments({
                week_start: weekStartISO,
                assignments: recommendedAssignments,
                apply_target: "DRAFT",
            })
            if (result.rejected.length > 0) {
                toast.warning(
                    `${result.applied.length} applied, ${result.rejected.length} rejected after revalidation`
                )
            } else {
                toast.success(`Applied ${result.applied.length} assignments to draft rota`)
            }
            onApply()
            onClose()
        } catch (error: unknown) {
            console.error(error)
            toast.error(getApiErrorMessage(error, "Failed to apply assignments"))
        } finally {
            setIsApplying(false)
        }
    }

    const renderRecommendation = (suggestion: AIShiftSuggestion) => {
        const shiftMeta = shiftMap.get(suggestion.shift_id)
        const recommended = suggestion.candidates.find(
            (candidate) => candidate.employee_id === suggestion.recommended_employee_id
        )
        return (
            <Card key={suggestion.shift_id}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Shift #{suggestion.shift_id}</CardTitle>
                    <ShiftMeta shift={shiftMeta} />
                </CardHeader>
                <CardContent className="pt-0">
                    {recommended ? (
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-medium">{recommended.employee_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Score: {recommended.total_score.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {suggestion.notes.map((note) => (
                                    <Badge key={note} variant="secondary">{note}</Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            No eligible candidates
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Suggest Assignments
                    </DialogTitle>
                    <DialogDescription>
                        Preview ranked candidates for each shift and apply selected recommendations to draft rota.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="include-open-shifts"
                            checked={includeOpenShifts}
                            onCheckedChange={setIncludeOpenShifts}
                            disabled={isPreviewLoading}
                        />
                        <Label htmlFor="include-open-shifts">Include open shifts</Label>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={runPreview}
                        disabled={isPreviewLoading}
                        className="gap-2"
                    >
                        {isPreviewLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh Preview
                    </Button>
                </div>

                {isPreviewLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating deterministic AI assignment preview...
                        </div>
                    </div>
                ) : preview ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Card>
                                <CardContent className="pt-5">
                                    <p className="text-xs text-muted-foreground">Total shifts</p>
                                    <p className="text-2xl font-semibold">{totalTargetShifts}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-5">
                                    <p className="text-xs text-muted-foreground">Recommended</p>
                                    <p className="text-2xl font-semibold">{recommendedCount}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-5">
                                    <p className="text-xs text-muted-foreground">Unfilled</p>
                                    <p className="text-2xl font-semibold">{unfilledCount}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="recommended" className="flex-1 min-h-0">
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="recommended">Recommended Assignments</TabsTrigger>
                                <TabsTrigger value="candidates">Candidate Breakdown</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recommended" className="h-[52vh]">
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-3">
                                        {preview.shift_suggestions.map((suggestion) => renderRecommendation(suggestion))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="candidates" className="h-[52vh]">
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-4">
                                        {preview.shift_suggestions.map((suggestion) => {
                                            const shiftMeta = shiftMap.get(suggestion.shift_id)
                                            return (
                                                <Card key={suggestion.shift_id}>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base">
                                                            Shift #{suggestion.shift_id}
                                                        </CardTitle>
                                                        <ShiftMeta shift={shiftMeta} />
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        {suggestion.candidates.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground">
                                                                No candidates met hard constraints.
                                                            </p>
                                                        ) : (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Employee</TableHead>
                                                                        <TableHead>Total</TableHead>
                                                                        <TableHead>Avail</TableHead>
                                                                        <TableHead>Skill</TableHead>
                                                                        <TableHead>Hours</TableHead>
                                                                        <TableHead>Rest</TableHead>
                                                                        <TableHead>Weekend</TableHead>
                                                                        <TableHead>Night</TableHead>
                                                                        <TableHead>Preference</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {suggestion.candidates.map((candidate) => (
                                                                        <TableRow key={candidate.employee_id}>
                                                                            <TableCell className="font-medium">
                                                                                {candidate.employee_name}
                                                                            </TableCell>
                                                                            <TableCell>{candidate.total_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.availability_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.skill_match_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.hours_balance_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.rest_margin_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.weekend_balance_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.night_balance_score.toFixed(2)}</TableCell>
                                                                            <TableCell>{candidate.score_breakdown.preference_score.toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                        No preview available
                    </div>
                )}

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={applyRecommendations}
                        disabled={!preview || recommendedAssignments.length === 0 || isApplying}
                        className="gap-2"
                    >
                        {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                        Apply to Draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
