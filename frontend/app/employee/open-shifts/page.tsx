"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { Calendar, Clock, MapPin, Hand } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function OpenShiftsPage() {
    const [openShifts, setOpenShifts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOpenShifts()
    }, [])

    const fetchOpenShifts = async () => {
        setLoading(true)
        try {
            const res = await api.get('/shifts/', { params: { status: 'open' } })
            setOpenShifts(res.data)
        } catch (err) {
            console.error(err)
            toast.error("Failed to load open shifts")
        } finally {
            setLoading(false)
        }
    }

    const claimShift = async (shiftId: number) => {
        try {
            await api.post(`/shifts/${shiftId}/claim`)
            toast.success("Shift claimed successfully!")
            fetchOpenShifts()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to claim shift")
        }
    }

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                        Open Shifts
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm sm:text-base">
                        Browse and claim available shifts that fit your schedule.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-lg bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto pb-8">
                        {openShifts.length === 0 ? (
                            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                                <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                    No open shifts available right now
                                </p>
                                <p className="text-sm text-slate-500 mt-1">Check back later for new opportunities.</p>
                            </div>
                        ) : (
                            openShifts.map((shift: any, index: number) => (
                                <motion.div
                                    key={shift.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <Card className="border-l-4 border-l-emerald-500 overflow-hidden shadow-soft hover:shadow-medium transition-shadow flex flex-col h-full">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                                    {shift.role_type}
                                                </CardTitle>
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-500">
                                                    Open
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {format(new Date(shift.start_time), "EEEE, MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {format(new Date(shift.start_time), "HH:mm")}
                                                    </span>
                                                    <span className="text-sm text-slate-400">to</span>
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {format(new Date(shift.end_time), "HH:mm")}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-4 border-t bg-slate-50 dark:bg-slate-900/50">
                                            <Button 
                                                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                                onClick={() => claimShift(shift.id)}
                                            >
                                                <Hand className="h-4 w-4" />
                                                Claim Shift
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
