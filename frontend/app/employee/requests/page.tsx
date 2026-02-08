"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Calendar, X } from "lucide-react"
import api from "@/lib/api"
import { toast } from "@/lib/toast"
import { format } from "date-fns"

type TimeOffRequest = {
    id: number
    start_date: string
    end_date: string
    reason: string
    status: string
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<TimeOffRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState("all")
    const [newRequest, setNewRequest] = useState({
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        reason: "",
    })

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await api.get("/time-off/")
            setRequests(res.data)
        } catch (err) {
            toast.error("Failed to load requests")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitRequest = async () => {
        if (!newRequest.start_date || !newRequest.end_date) {
            toast.error("Please select both start and end dates")
            return
        }

        try {
            await api.post("/time-off/", {
                start_date: newRequest.start_date.toISOString(),
                end_date: newRequest.end_date.toISOString(),
                reason: newRequest.reason,
            })
            toast.success("Time-off request submitted successfully")
            setIsDialogOpen(false)
            setNewRequest({ start_date: undefined, end_date: undefined, reason: "" })
            fetchRequests()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to submit request")
        }
    }

    const handleCancelRequest = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this request?")) return

        try {
            await api.delete(`/time-off/${id}`)
            toast.success("Request cancelled successfully")
            fetchRequests()
        } catch (err) {
            toast.error("Failed to cancel request")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
                return "success"
            case "pending":
                return "warning"
            case "rejected":
                return "danger"
            default:
                return "default"
        }
    }

    const filteredRequests =
        statusFilter === "all"
            ? requests
            : requests.filter((req) => req.status === statusFilter)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        Time-Off Requests
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Submit and manage your time-off requests
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="primary" size="lg" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Request Time Off
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Time Off</DialogTitle>
                            <DialogDescription>
                                Submit a new time-off request for approval
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Start Date</label>
                                <DatePicker
                                    date={newRequest.start_date}
                                    onDateChange={(date) =>
                                        setNewRequest({ ...newRequest, start_date: date })
                                    }
                                    placeholder="Select start date"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">End Date</label>
                                <DatePicker
                                    date={newRequest.end_date}
                                    onDateChange={(date) =>
                                        setNewRequest({ ...newRequest, end_date: date })
                                    }
                                    placeholder="Select end date"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-blue-500"
                                    placeholder="Enter reason for time off..."
                                    value={newRequest.reason}
                                    onChange={(e) =>
                                        setNewRequest({ ...newRequest, reason: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSubmitRequest}>
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter */}
            <Card variant="elevated">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">Filter by status:</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Requests</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"
                            />
                        ))}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <Card variant="elevated" className="text-center py-12">
                        <CardContent>
                            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                No time-off requests
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                {statusFilter === "all"
                                    ? "You haven't submitted any requests yet"
                                    : `No ${statusFilter} requests found`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredRequests.map((request) => (
                        <Card key={request.id} variant="elevated">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                            <h3 className="font-semibold text-lg">
                                                {format(new Date(request.start_date), "MMM d, yyyy")} -{" "}
                                                {format(new Date(request.end_date), "MMM d, yyyy")}
                                            </h3>
                                            <Badge variant={getStatusColor(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </div>
                                        {request.reason && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                                                {request.reason}
                                            </p>
                                        )}
                                    </div>
                                    {request.status === "pending" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCancelRequest(request.id)}
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
