import api from "@/lib/api"

export interface AIScoringConfig {
    id: number | null
    tenant_id: number
    availability_weight: number
    skill_match_weight: number
    hours_balance_weight: number
    rest_margin_weight: number
    weekend_balance_weight: number
    night_balance_weight: number
    preference_weight: number
    min_score_threshold: number | null
    created_at: string
    updated_at: string
}

export interface AICandidateBreakdown {
    availability_score: number
    skill_match_score: number
    hours_balance_score: number
    rest_margin_score: number
    weekend_balance_score: number
    night_balance_score: number
    preference_score: number
}

export interface AICandidate {
    employee_id: number
    employee_name: string
    total_score: number
    score_breakdown: AICandidateBreakdown
    flags: string[]
}

export interface AIShiftSuggestion {
    shift_id: number
    recommended_employee_id: number | null
    recommended_score: number | null
    candidates: AICandidate[]
    notes: string[]
}

export interface AIUnfilledShift {
    shift_id: number
    reasons: string[]
}

export interface AIFairnessItem {
    employee_id: number
    employee_name: string
    recommended_shift_count: number
    recommended_hours: number
}

export interface AIAssignPreviewResponse {
    week_start: string
    scoring_config_used: AIScoringConfig
    shift_suggestions: AIShiftSuggestion[]
    unfilled_shifts: AIUnfilledShift[]
    fairness_summary: AIFairnessItem[]
}

export interface AIAssignPreviewPayload {
    week_start: string
    include_open_shifts: boolean
}

export interface AIAssignmentInput {
    shift_id: number
    employee_id: number
}

export interface AIAssignApplyPayload {
    week_start: string
    assignments: AIAssignmentInput[]
    apply_target: "DRAFT"
}

export interface AIAssignmentRejected {
    shift_id: number
    employee_id: number
    reasons: string[]
}

export interface AIAssignApplyResponse {
    applied: AIAssignmentInput[]
    rejected: AIAssignmentRejected[]
}

export interface AIScoringConfigUpdatePayload {
    availability_weight?: number
    skill_match_weight?: number
    hours_balance_weight?: number
    rest_margin_weight?: number
    weekend_balance_weight?: number
    night_balance_weight?: number
    preference_weight?: number
    min_score_threshold?: number | null
    clear_min_score_threshold?: boolean
}

export async function previewAIAssignments(
    payload: AIAssignPreviewPayload
): Promise<AIAssignPreviewResponse> {
    const res = await api.post("/ai/assign/preview", payload)
    return res.data
}

export async function applyAIAssignments(
    payload: AIAssignApplyPayload
): Promise<AIAssignApplyResponse> {
    const res = await api.post("/ai/assign/apply", payload)
    return res.data
}

export async function getAIScoringConfig(): Promise<AIScoringConfig> {
    const res = await api.get("/settings/ai-scoring")
    return res.data
}

export async function updateAIScoringConfig(
    payload: AIScoringConfigUpdatePayload
): Promise<AIScoringConfig> {
    const res = await api.put("/settings/ai-scoring", payload)
    return res.data
}
