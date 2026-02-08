"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/animations/animated-counter"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
    title: string
    value: number
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    gradient?: boolean
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    gradient = false,
    className,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className={className}
        >
            <Card className={cn(
                "border shadow-soft card-hover",
                gradient && "bg-primary text-primary-foreground border-primary"
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={cn(
                        "text-sm font-medium",
                        !gradient && "text-muted-foreground"
                    )}>
                        {title}
                    </CardTitle>
                    <Icon className={cn(
                        "h-4 w-4",
                        gradient ? "text-primary-foreground/80" : "text-muted-foreground"
                    )} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={value} />
                    </div>
                    {description && (
                        <p className={cn(
                            "text-xs mt-1",
                            gradient ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                            {description}
                        </p>
                    )}
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-2 text-xs font-medium",
                            trend.isPositive
                                ? (gradient ? "text-primary-foreground" : "text-emerald-600")
                                : (gradient ? "text-primary-foreground" : "text-red-600")
                        )}>
                            <span>{trend.isPositive ? "↑" : "↓"}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className={cn(
                                "font-normal",
                                gradient ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                                from last month
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
