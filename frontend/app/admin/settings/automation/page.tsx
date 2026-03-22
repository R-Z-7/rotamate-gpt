"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Play } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

type AutomationFormValues = {
    is_enabled: boolean
    schedule_type: string
    run_time: string
    unfilled_shifts_policy: string
}

export default function AutomationSettingsPage() {
    const [form, setForm] = useState<AutomationFormValues>({
        is_enabled: false,
        schedule_type: "weekly",
        run_time: "00:00",
        unfilled_shifts_policy: "leave_unassigned"
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            try {
                const res = await api.get('/automation/config')
                if (res.data) {
                    setForm({
                        is_enabled: res.data.is_enabled,
                        schedule_type: res.data.schedule_type || "weekly",
                        run_time: res.data.run_time || "00:00",
                        unfilled_shifts_policy: res.data.unfilled_shifts_policy || "leave_unassigned",
                    })
                }
            } catch (error: any) {
                console.error(error)
                if (error.response?.status !== 404) {
                    toast.error("Failed to load automation config")
                }
            } finally {
                setIsLoading(false)
            }
        }
        loadConfig()
    }, [])

    const saveConfig = async () => {
        setIsSaving(true)
        try {
            const res = await api.put("/automation/config", form)
            if (res.data) {
                setForm(res.data)
            }
            toast.success("Automation configuration saved")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to save configuration")
        } finally {
            setIsSaving(false)
        }
    }

    const runAutomationNow = async () => {
        setIsRunning(true)
        try {
            await api.post("/automation/trigger")
            toast.success("Automation job triggered successfully!")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to trigger automation")
        } finally {
            setIsRunning(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading automation settings...
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Scheduling Automation</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure the background worker to automatically generate and assign weekly shifts based on AI scoring constraints.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={runAutomationNow}
                        disabled={isRunning}
                        className="gap-2"
                    >
                        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Run Now
                    </Button>
                    <Button onClick={saveConfig} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Config
                    </Button>
                </div>
            </div>

            <Card className={form.is_enabled ? "border-emerald-500/50 shadow-sm" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Master Switch</CardTitle>
                            <CardDescription>
                                Enable or disable background automated AI scheduling across the tenant.
                            </CardDescription>
                        </div>
                        <Switch
                            checked={form.is_enabled}
                            onCheckedChange={(checked) => setForm({ ...form, is_enabled: checked })}
                        />
                    </div>
                </CardHeader>
            </Card>

            <Card className={!form.is_enabled ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <CardHeader>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                        Dictate how and when the automation scheduler generates shifts without admin supervision.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label>Schedule Frequency</Label>
                            <Select
                                value={form.schedule_type}
                                onValueChange={(val) => setForm({ ...form, schedule_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">How often should the background worker produce shifts?</p>
                        </div>

                        <div className="space-y-3">
                            <Label>Run Time (HH:MM 24hr UTC)</Label>
                            <Input
                                type="time"
                                value={form.run_time}
                                onChange={(e) => setForm({ ...form, run_time: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">What time of day should the background sync run on Sundays?</p>
                        </div>

                        <div className="space-y-3 col-span-1 md:col-span-2">
                            <Label>Unfilled Shift Policy (Fallback)</Label>
                            <Select
                                value={form.unfilled_shifts_policy}
                                onValueChange={(val) => setForm({ ...form, unfilled_shifts_policy: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="convert_to_open">Convert to Open Shifts (Allow Claims)</SelectItem>
                                    <SelectItem value="leave_unassigned">Leave Unassigned (Admin Action Required)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                If the AI scoring engine fails to find a suitable employee for a shift pattern because everyone is unavailable or exceeds hour limits, how should the system handle the ghost shift?
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
