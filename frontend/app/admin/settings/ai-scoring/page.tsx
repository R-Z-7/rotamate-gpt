"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAIScoringConfig, getScoringOptimization, updateAIScoringConfig } from "@/lib/api/ai"

type ScoringFormValues = {
    availability_weight: string
    skill_match_weight: string
    hours_balance_weight: string
    rest_margin_weight: string
    weekend_balance_weight: string
    night_balance_weight: string
    preference_weight: string
    min_score_threshold: string
}

const EMPTY_FORM: ScoringFormValues = {
    availability_weight: "25",
    skill_match_weight: "25",
    hours_balance_weight: "20",
    rest_margin_weight: "15",
    weekend_balance_weight: "10",
    night_balance_weight: "10",
    preference_weight: "5",
    min_score_threshold: "",
}

const WEIGHT_FIELDS: Array<{ key: keyof ScoringFormValues; label: string; hint: string }> = [
    {
        key: "availability_weight",
        label: "Availability Weight",
        hint: "Full score for available, 50% for prefer-not availability.",
    },
    {
        key: "skill_match_weight",
        label: "Skill Match Weight",
        hint: "Exact skill gets full score; secondary match receives 70%.",
    },
    {
        key: "hours_balance_weight",
        label: "Hours Balance Weight",
        hint: "Prioritizes employees with lower weekly hours.",
    },
    {
        key: "rest_margin_weight",
        label: "Rest Margin Weight",
        hint: "Rewards larger rest margin above minimum contract rest.",
    },
    {
        key: "weekend_balance_weight",
        label: "Weekend Balance Weight",
        hint: "Rewards employees with fewer weekend shifts in last 4 weeks.",
    },
    {
        key: "night_balance_weight",
        label: "Night Balance Weight",
        hint: "Rewards employees with fewer night shifts in last 4 weeks.",
    },
    {
        key: "preference_weight",
        label: "Preference Weight",
        hint: "Applied when shift time matches employee preferred time.",
    },
]

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

export default function AIScoringSettingsPage() {
    const [form, setForm] = useState<ScoringFormValues>(EMPTY_FORM)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const scoreWeightTotal = useMemo(() => {
        return WEIGHT_FIELDS.reduce((sum, field) => {
            const value = parseFloat(form[field.key] || "0")
            return sum + (Number.isFinite(value) ? value : 0)
        }, 0)
    }, [form])

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            try {
                const config = await getAIScoringConfig()
                setForm({
                    availability_weight: String(config.availability_weight),
                    skill_match_weight: String(config.skill_match_weight),
                    hours_balance_weight: String(config.hours_balance_weight),
                    rest_margin_weight: String(config.rest_margin_weight),
                    weekend_balance_weight: String(config.weekend_balance_weight),
                    night_balance_weight: String(config.night_balance_weight),
                    preference_weight: String(config.preference_weight),
                    min_score_threshold:
                        config.min_score_threshold !== null
                            ? String(config.min_score_threshold)
                            : "",
                })
            } catch (error: unknown) {
                console.error(error)
                toast.error(getApiErrorMessage(error, "Failed to load AI scoring config"))
            } finally {
                setIsLoading(false)
            }
        }
        loadConfig()
    }, [])

    const updateField = (key: keyof ScoringFormValues, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const [optimizationResult, setOptimizationResult] = useState<any>(null)
    const [isOptimizing, setIsOptimizing] = useState(false)

    const handleOptimize = async () => {
        setIsOptimizing(true)
        try {
            const result = await getScoringOptimization()
            setOptimizationResult(result)
            if (result.suggested_weight_changes && Object.keys(result.suggested_weight_changes).length > 0) {
                toast.success("Optimization analysis complete. Review suggestions below.")
            } else {
                toast.info("Analysis complete. No changes suggested at this time.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to run optimization analysis")
        } finally {
            setIsOptimizing(false)
        }
    }

    const applyOptimization = () => {
        if (!optimizationResult?.suggested_weight_changes) return

        const updates = optimizationResult.suggested_weight_changes
        setForm((prev) => {
            const next = { ...prev }
            if (updates.skill_match_weight) next.skill_match_weight = String(updates.skill_match_weight)
            if (updates.preference_weight) next.preference_weight = String(updates.preference_weight)
            return next
        })
        toast.success("Suggested weights applied to form. Click Save to persist.")
        setOptimizationResult(null)
    }

    const saveConfig = async () => {
        const parsedWeights = WEIGHT_FIELDS.map(({ key }) => Number(form[key]))
        if (parsedWeights.some((value) => !Number.isFinite(value) || value < 0)) {
            toast.error("All weights must be valid non-negative numbers")
            return
        }

        let minScoreThreshold: number | null = null
        if (form.min_score_threshold.trim() !== "") {
            const parsed = Number(form.min_score_threshold)
            if (!Number.isFinite(parsed) || parsed < 0) {
                toast.error("Minimum score threshold must be a non-negative number")
                return
            }
            minScoreThreshold = parsed
        }

        setIsSaving(true)
        try {
            const config = await updateAIScoringConfig({
                availability_weight: Number(form.availability_weight),
                skill_match_weight: Number(form.skill_match_weight),
                hours_balance_weight: Number(form.hours_balance_weight),
                rest_margin_weight: Number(form.rest_margin_weight),
                weekend_balance_weight: Number(form.weekend_balance_weight),
                night_balance_weight: Number(form.night_balance_weight),
                preference_weight: Number(form.preference_weight),
                min_score_threshold: minScoreThreshold,
                clear_min_score_threshold: minScoreThreshold === null,
            })

            setForm({
                availability_weight: String(config.availability_weight),
                skill_match_weight: String(config.skill_match_weight),
                hours_balance_weight: String(config.hours_balance_weight),
                rest_margin_weight: String(config.rest_margin_weight),
                weekend_balance_weight: String(config.weekend_balance_weight),
                night_balance_weight: String(config.night_balance_weight),
                preference_weight: String(config.preference_weight),
                min_score_threshold:
                    config.min_score_threshold !== null ? String(config.min_score_threshold) : "",
            })
            toast.success("AI scoring settings saved")
        } catch (error: unknown) {
            console.error(error)
            toast.error(getApiErrorMessage(error, "Failed to save AI scoring settings"))
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading AI scoring settings...
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Scoring Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure deterministic scoring weights used by AI assignment preview and draft apply.
                </p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        ✨ AI Scoring Optimization
                    </CardTitle>
                    <CardDescription>
                        Analyze past overrides to learn from your scheduling preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            The system can analyze recent manual overrides to suggest weight adjustments.
                            If you frequently assign employees with higher skill matches than the AI suggests,
                            it will recommend increasing the Skill Match Weight.
                        </p>

                        {!optimizationResult ? (
                            <Button onClick={handleOptimize} disabled={isOptimizing} variant="outline">
                                {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Run Analysis
                            </Button>
                        ) : (
                            <div className="bg-background border rounded-md p-4 space-y-3">
                                <div className="space-y-1">
                                    <p className="font-medium">Analysis Result</p>
                                    <p className="text-sm text-muted-foreground">{optimizationResult.suggestion_text}</p>
                                </div>

                                {optimizationResult.suggested_weight_changes && Object.keys(optimizationResult.suggested_weight_changes).length > 0 && (
                                    <div className="pt-2">
                                        <Button onClick={applyOptimization} size="sm">
                                            Apply Suggestions
                                        </Button>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setOptimizationResult(null)}>
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Scoring Weights</CardTitle>
                    <CardDescription>
                        Current total configured score weight: <span className="font-medium">{scoreWeightTotal.toFixed(2)}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {WEIGHT_FIELDS.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Input
                                id={field.key}
                                type="number"
                                min="0"
                                step="0.1"
                                value={form[field.key]}
                                onChange={(event) => updateField(field.key, event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{field.hint}</p>
                        </div>
                    ))}

                    <div className="space-y-2">
                        <Label htmlFor="min_score_threshold">Minimum Score Threshold</Label>
                        <Input
                            id="min_score_threshold"
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.min_score_threshold}
                            onChange={(event) => updateField("min_score_threshold", event.target.value)}
                            placeholder="Leave empty for no threshold"
                        />
                        <p className="text-xs text-muted-foreground">
                            Candidates below this total score are excluded from preview recommendations.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={saveConfig} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
