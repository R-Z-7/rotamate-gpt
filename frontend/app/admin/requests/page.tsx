"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Clock, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const requestsData = [
    { id: 1, employee: "Sarah Connor", type: "Vacation", dates: "Feb 20 - Feb 24", status: "Pending", reason: "Family trip" },
    { id: 2, employee: "John Smith", type: "Sick Leave", dates: "Feb 14", status: "Pending", reason: "Medical appointment" },
    { id: 3, employee: "Emily Chen", type: "Personal", dates: "Mar 01", status: "Approved", reason: "Moving house" },
    { id: 4, employee: "Michael Wong", type: "Vacation", dates: "Apr 10 - Apr 20", status: "Declined", reason: "High volume period" },
]

export default function RequestsPage() {
    const [filter, setFilter] = useState("all")

    const handleApprove = (id: number) => {
        toast.success(`Request #${id} approved`)
    }

    const handleDecline = (id: number) => {
        toast.error(`Request #${id} declined`)
    }

    const filteredRequests = filter === "all"
        ? requestsData
        : requestsData.filter(r => r.status.toLowerCase() === filter)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Time Off Requests</h1>
                    <p className="text-muted-foreground mt-2">
                        Review and manage employee leave requests.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">{request.employee}</TableCell>
                                    <TableCell>{request.type}</TableCell>
                                    <TableCell>{request.dates}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={request.reason}>{request.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            request.status === "Approved" ? "success" :
                                                request.status === "Declined" ? "destructive" : "secondary"
                                        }>
                                            {request.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {request.status === "Pending" && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(request.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDecline(request.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No requests found matching your filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
