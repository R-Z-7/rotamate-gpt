"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Settings } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"

type EmployeePreferenceFormValues = {
    preferred_shift_length: number
    preferred_time_of_day: string
    open_shift_participation_enabled: boolean
    notify_new_open_shifts: boolean
    allow_auto_assign_open_shifts: boolean
    maximum_shifts_per_week: number | null
}

const DEFAULT_FORM: EmployeePreferenceFormValues = {
    preferred_shift_length: 8,
    preferred_time_of_day: "any",
    open_shift_participation_enabled: true,
    notify_new_open_shifts: true,
    allow_auto_assign_open_shifts: false,
    maximum_shifts_per_week: null
}

export default function EmployeeSettingsPage() {
    const { user } = useAuth()
    const [form, setForm] = useState<EmployeePreferenceFormValues>(DEFAULT_FORM)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                const res = await api.get(`/settings/employee-preferences/${user.id}`)
                if (res.data) {
                    setForm({
                        preferred_shift_length: res.data.preferred_shift_length || 8,
                        preferred_time_of_day: res.data.preferred_time_of_day || "any",
                        open_shift_participation_enabled: res.data.open_shift_participation_enabled ?? true,
                        notify_new_open_shifts: res.data.notify_new_open_shifts ?? true,
                        allow_auto_assign_open_shifts: res.data.allow_auto_assign_open_shifts ?? false,
                        maximum_shifts_per_week: res.data.maximum_shifts_per_week || null
                    })
                }
            } catch (error: any) {
                console.error(error)
                // If 404, it just means they don't have preferences yet, which is fine
                if (error.response?.status !== 404) {
                    toast.error("Failed to load preferences")
                }
            } finally {
                setIsLoading(false)
            }
        }
        loadPreferences()
    }, [user])

    const savePreferences = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            const res = await api.put(`/settings/employee-preferences/${user.id}`, form)
            if (res.data) {
                setForm(res.data)
            }
            toast.success("Preferences saved successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to save preferences")
        } finally {
            setIsSaving(false)
        }
    }

    const updateField = (field: keyof EmployeePreferenceFormValues, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preferences...
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings & Preferences</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure how the AI handles your schedule and manages open shift algorithms.
                    </p>
                </div>
                <Button onClick={savePreferences} disabled={isSaving} className="gap-2 shrink-0">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Preferences
                </Button>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                        <Settings className="h-5 w-5" />
                        <CardTitle>AI Scheduling Preferences</CardTitle>
                    </div>
                    <CardDescription>
                        These metrics act as soft weights for the AI Auto-assigner. The system will attempt to maximize your score by abiding by these preferences when possible without breaking Contract Rules.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Preferred Shift Length */}
                        <div className="space-y-3">
                            <Label>Preferred Shift Length (Hours)</Label>
                            <Select
                                value={form.preferred_shift_length.toString()}
                                onValueChange={(val) => updateField("preferred_shift_length", Number(val))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4 Hours (Half-day)</SelectItem>
                                    <SelectItem value="8">8 Hours (Standard)</SelectItem>
                                    <SelectItem value="10">10 Hours</SelectItem>
                                    <SelectItem value="12">12 Hours (Long shift)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">The AI will favor shift lengths closest to this number.</p>
                        </div>

                        {/* Preferred Time of Day */}
                        <div className="space-y-3">
                            <Label>Preferred Time of Day</Label>
                            <Select
                                value={form.preferred_time_of_day}
                                onValueChange={(val) => updateField("preferred_time_of_day", val)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any (No Preference)</SelectItem>
                                    <SelectItem value="morning">Morning (AM)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon (Mid)</SelectItem>
                                    <SelectItem value="evening">Evening (PM)</SelectItem>
                                    <SelectItem value="night">Night (Graveyard)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">The AI will apply a scoring bonus to shifts overlapping this window.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Open Shifts Configuration</CardTitle>
                    <CardDescription>
                        Dictate your participation in the Open Shift ecosystem. 
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                            <Label>Participate in Open Shifts</Label>
                            <p className="text-sm text-muted-foreground">If disabled, you will not see Open Shifts in your dashboard.</p>
                        </div>
                        <Switch
                            checked={form.open_shift_participation_enabled}
                            onCheckedChange={(checked) => updateField("open_shift_participation_enabled", checked)}
                        />
                    </div>

                    <div className={`flex items-center justify-between border-b pb-4 transition-opacity ${!form.open_shift_participation_enabled ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className="space-y-1">
                            <Label>Notify on New Open Shifts</Label>
                            <p className="text-sm text-muted-foreground">Receive a real-time notification when the AI converts an unassigned role into an open shift.</p>
                        </div>
                        <Switch
                            checked={form.notify_new_open_shifts}
                            onCheckedChange={(checked) => updateField("notify_new_open_shifts", checked)}
                        />
                    </div>

                    <div className={`flex items-center justify-between pt-2 transition-opacity ${!form.open_shift_participation_enabled ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className="space-y-1 text-emerald-600 dark:text-emerald-400">
                            <Label>Auto-Claim Eligible Shifts</Label>
                            <p className="text-sm text-muted-foreground dark:text-emerald-500/80">Allow the automation scheduler to immediately hard-assign open shifts to you if you are perfectly capable.</p>
                        </div>
                        <Switch
                            checked={form.allow_auto_assign_open_shifts}
                            onCheckedChange={(checked) => updateField("allow_auto_assign_open_shifts", checked)}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
