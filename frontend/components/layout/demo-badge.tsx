"use client"

import { useEffect, useState } from "react"

export function DemoBadge() {
    // In a real app, this would check an env var or API state
    const [isDemo, setIsDemo] = useState(true)

    if (!isDemo) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg animate-fade-in hover:bg-orange-700 transition-colors cursor-help" title="System is running with demo data">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            DEMO MODE
        </div>
    )
}
