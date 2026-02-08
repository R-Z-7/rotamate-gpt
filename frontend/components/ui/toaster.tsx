"use client"

import { Toaster as Sonner } from "sonner"
import { useTheme } from "next-themes"

export function Toaster() {
    const { theme } = useTheme()

    return (
        <Sonner
            theme={theme as "light" | "dark" | "system"}
            position="bottom-right"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800",
                    description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
                    actionButton:
                        "group-[.toast]:bg-blue-600 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-blue-500",
                    cancelButton:
                        "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400",
                },
            }}
        />
    )
}
