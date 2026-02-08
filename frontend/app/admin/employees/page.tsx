"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Plus, Search, Edit, Trash2, UserCircle, MoreHorizontal, Mail, Shield, AlertCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Employee = {
    id: number
    full_name: string
    email: string
    role: string
    is_active: boolean
}

export default function EmployeesPage() {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [editForm, setEditForm] = useState({
        full_name: "",
        email: "",
        role: "employee",
        is_active: true
    })
    const [newEmployee, setNewEmployee] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "employee",
    })

    useEffect(() => {
        fetchEmployees()
    }, [])

    useEffect(() => {
        filterEmployees()
    }, [employees, searchQuery, roleFilter])

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/users/")
            setEmployees(res.data)
        } catch (err: any) {
            if (err.response?.status === 401) {
                toast.error("Session expired. Redirecting to login...")
                localStorage.removeItem("token")
                router.push("/login")
            } else {
                toast.error("Failed to load employees")
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    const filterEmployees = () => {
        let filtered = employees

        if (searchQuery) {
            filtered = filtered.filter(
                (emp) =>
                    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (roleFilter !== "all") {
            filtered = filtered.filter((emp) => emp.role === roleFilter)
        }

        setFilteredEmployees(filtered)
    }

    const handleAddEmployee = async () => {
        try {
            await api.post("/auth/register", newEmployee)
            toast.success("Employee added successfully")
            setIsAddDialogOpen(false)
            setNewEmployee({ full_name: "", email: "", password: "", role: "employee" })
            fetchEmployees()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to add employee")
        }
    }

    const handleEditClick = (employee: Employee) => {
        setSelectedEmployee(employee)
        setEditForm({
            full_name: employee.full_name,
            email: employee.email,
            role: employee.role,
            is_active: employee.is_active
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateEmployee = async () => {
        if (!selectedEmployee) return
        try {
            await api.put(`/users/${selectedEmployee.id}`, editForm)
            toast.success("Employee updated successfully")
            setIsEditDialogOpen(false)
            fetchEmployees()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to update employee")
        }
    }

    const handleDeleteEmployee = async (id: number) => {
        // Simple confirmation for now, could be a dialog
        if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return

        try {
            await api.delete(`/users/${id}`)
            toast.success("Employee deleted successfully")
            fetchEmployees()
        } catch (err) {
            toast.error("Failed to delete employee")
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage your team members, roles, and permissions.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Create a new account for a team member. They will receive an email to set their password.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    placeholder="e.g. Jane Doe"
                                    value={newEmployee.full_name}
                                    onChange={(e) =>
                                        setNewEmployee({ ...newEmployee, full_name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="e.g. jane@company.com"
                                    value={newEmployee.email}
                                    onChange={(e) =>
                                        setNewEmployee({ ...newEmployee, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Temporary Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newEmployee.password}
                                    onChange={(e) =>
                                        setNewEmployee({ ...newEmployee, password: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select
                                    value={newEmployee.role}
                                    onValueChange={(value) =>
                                        setNewEmployee({ ...newEmployee, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddEmployee}>
                                Create Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters & Actions */}
            <Card>
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Employee Table */}
            <Card className="overflow-hidden">
                <div className="relative w-full overflow-auto">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-1/4 bg-muted animate-pulse rounded ml-auto" />
                                </div>
                            ))}
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-muted/50 p-4 rounded-full mb-4">
                                <UserCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No employees found</h3>
                            <p className="text-muted-foreground max-w-sm mt-1">
                                We couldn't find any employees matching your filters. Try adjusting your search query.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => { setSearchQuery(""); setRoleFilter("all"); }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {(employee.full_name || "U")
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{employee.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{employee.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {employee.role === 'admin' && <Shield className="h-3 w-3 text-blue-500" />}
                                                <span className="capitalize text-sm">{employee.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={employee.is_active ? "success" : "secondary"}>
                                                {employee.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => window.location.href = `mailto:${employee.email}`}>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Send Email
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteEmployee(employee.id)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Account
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update profile information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={editForm.full_name}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, full_name: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, email: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                                value={editForm.role}
                                onValueChange={(value) =>
                                    setEditForm({ ...editForm, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={editForm.is_active}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, is_active: e.target.checked })
                                }
                                className="h-4 w-4 border-muted-foreground rounded text-primary focus:ring-primary"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="is_active"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Active Account
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Allow this user to log in and access the system.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateEmployee}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
