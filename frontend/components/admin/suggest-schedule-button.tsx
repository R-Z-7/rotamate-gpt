import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuggestScheduleButtonProps {
    onClick: () => void
    isLoading?: boolean
}

export function SuggestScheduleButton({ onClick, isLoading }: SuggestScheduleButtonProps) {
    return (
        <Button
            onClick={onClick}
            disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
        >
            <Sparkles className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Generating..." : "AI Suggest Assignments"}
        </Button>
    )
}
