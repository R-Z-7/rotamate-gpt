"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

type ContractRuleFormValues = {
    max_hours_week: number
    max_hours_day: number
    min_rest_hours: number
    max_consecutive_days: number
    requires_approval_for_overtime: boolean
}

const DEFAULT_FORM: ContractRuleFormValues = {
    max_hours_week: 40,
    max_hours_day: 12,
    min_rest_hours: 11,
    max_consecutive_days: 6,
    requires_approval_for_overtime: true,
}

export default function ContractRulesPage() {
    const [form, setForm] = useState<ContractRuleFormValues>(DEFAULT_FORM)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadRules = async () => {
            setIsLoading(true)
            try {
                const res = await api.get('/settings/contract-rules')
                if (res.data) {
                    setForm({
                        max_hours_week: Number(res.data.max_hours_week) || 40,
                        max_hours_day: Number(res.data.max_hours_day) || 12,
                        min_rest_hours: Number(res.data.min_rest_hours) || 11,
                        max_consecutive_days: Number(res.data.max_consecutive_days) || 6,
                        requires_approval_for_overtime: Boolean(res.data.requires_approval_for_overtime),
                    })
                }
            } catch (error: any) {
                console.error(error)
                toast.error("Failed to load contract rules")
            } finally {
                setIsLoading(false)
            }
        }
        loadRules()
    }, [])

    const saveRules = async () => {
        // Validate inputs before saving
        if (form.max_hours_week <= 0 || form.max_hours_day <= 0) {
            toast.error("Hours must be strictly positive.")
            return
        }
        if (form.max_hours_day > form.max_hours_week) {
            toast.error("Daily max cannot exceed weekly max.")
            return
        }
        setIsSaving(true)
        try {
            const res = await api.put("/settings/contract-rules", {
                max_hours_week: Number(form.max_hours_week),
                max_hours_day: Number(form.max_hours_day),
                min_rest_hours: Number(form.min_rest_hours),
                max_consecutive_days: Number(form.max_consecutive_days),
                requires_approval_for_overtime: form.requires_approval_for_overtime,
            })
            if (res.data) {
                setForm(res.data)
            }
            toast.success("Contract rules saved successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to save contract rules")
        } finally {
            setIsSaving(false)
        }
    }

    const updateField = (field: keyof ContractRuleFormValues, value: number | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading contract rules...
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contract Rules</h1>
                    <p className="text-muted-foreground mt-1">
                        Define rigid global constraints dictating minimum rest periods and maximum working hours. All manual schedules and AI automations will respect these barriers.
                    </p>
                </div>
                <Button onClick={saveRules} disabled={isSaving} className="gap-2 shrink-0">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Policies
                </Button>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldAlert className="h-5 w-5" />
                        <CardTitle>Global Tenant Policies</CardTitle>
                    </div>
                    <CardDescription>
                        These limits act as physical hardware barriers. If an employee exceeds these limits via a manual shift assignment, the system will instantly throw an Override Violation requiring explicit administrative reasoning.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Weekly Max */}
                        <div className="space-y-3">
                            <Label>Maximum Weekly Hours</Label>
                            <Input
                                type="number"
                                min={1}
                                max={168}
                                value={form.max_hours_week}
                                onChange={(e) => updateField("max_hours_week", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">The firm limit on scheduled working hours per 7-day week (Mon-Sun).</p>
                        </div>

                        {/* Daily Max */}
                        <div className="space-y-3">
                            <Label>Maximum Daily Hours (Shift Length)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={24}
                                value={form.max_hours_day}
                                onChange={(e) => updateField("max_hours_day", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">The highest allowable shift duration for a single continuous working period.</p>
                        </div>

                        {/* Min Rest */}
                        <div className="space-y-3">
                            <Label>Minimum Rest Period (Hours)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={48}
                                value={form.min_rest_hours}
                                onChange={(e) => updateField("min_rest_hours", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">The mandatory gap of uninterrupted rest between the end of one shift and the start of the next.</p>
                        </div>

                        {/* Consecutive Days */}
                        <div className="space-y-3">
                            <Label>Maximum Consecutive Days</Label>
                            <Input
                                type="number"
                                min={1}
                                max={30}
                                value={form.max_consecutive_days}
                                onChange={(e) => updateField("max_consecutive_days", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">How many days in a row an employee can work before a guaranteed off-day is enforced.</p>
                        </div>

                    </div>

                    <div className="pt-6 border-t flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Overtime Pre-authorization</Label>
                            <p className="text-sm text-muted-foreground">Flag shifts pushing employees above standard hour limits instead of flat rejecting them. Requires Admin Override Acknowledgement.</p>
                        </div>
                        <Switch
                            checked={form.requires_approval_for_overtime}
                            onCheckedChange={(checked) => updateField("requires_approval_for_overtime", checked)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
