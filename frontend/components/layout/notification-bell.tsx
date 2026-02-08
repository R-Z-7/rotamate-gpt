"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

type Notification = {
    id: number
    title: string
    description: string
    time: string
    read: boolean
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/")
            // Transform backend data to frontend format if needed
            const data = res.data.map((n: any) => ({
                id: n.id,
                title: n.title,
                description: n.description,
                time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
                read: n.is_read,
                created_at: n.created_at
            }))
            setNotifications(data)
        } catch (error: any) {
            // Silently ignore 401 errors to avoid console spam when session expires
            if (error.response?.status !== 401) {
                console.error("Failed to fetch notifications", error)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`)
            setNotifications(
                notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
        } catch (error) {
            console.error("Failed to mark read", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all")
            setNotifications(notifications.map((n) => ({ ...n, read: true })))
        } catch (error) {
            console.error("Failed to mark all read", error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            onClick={(e) => {
                                e.stopPropagation()
                                markAllAsRead()
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <span
                                        className={`font-medium text-sm ${!notification.read ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                                            }`}
                                    >
                                        {notification.title}
                                    </span>
                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                        {notification.time}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">
                                    {notification.description}
                                </p>
                                {!notification.read && (
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
