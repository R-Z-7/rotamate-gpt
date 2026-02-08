"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface NavCardProps {
    title: string
    description?: string
    icon?: LucideIcon
    href?: string
    className?: string
    iconClassName?: string
    children?: React.ReactNode
    footer?: React.ReactNode
}

export function NavCard({
    title,
    description,
    icon: Icon,
    href,
    className,
    iconClassName,
    children,
    footer,
}: NavCardProps) {
    const content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {Icon && (
                    <Icon className={cn("h-5 w-5 text-muted-foreground", iconClassName)} />
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </>
    )

    if (href) {
        return (
            <Card className={cn("transition-all hover:shadow-md hover:border-primary/50 group cursor-pointer", className)}>
                <Link href={href} className="block h-full">
                    {content}
                </Link>
            </Card>
        )
    }

    return (
        <Card className={className}>
            {content}
        </Card>
    )
}
