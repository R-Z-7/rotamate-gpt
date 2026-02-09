"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Shield, Lock, Save } from "lucide-react"
import { toast } from "@/lib/toast"
import api from "@/lib/api"

export default function ProfilePage() {
    const { user, login } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        // Implement logic to update profile (name/email)
        // For now just toast as backend might not have endpoint yet for self-update excluding password
        toast.info("Profile update coming soon")
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        setIsLoading(true)
        try {
            // Assuming endpoint exists or creating it
            await api.put("/users/me/password", {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
            })
            toast.success("Password updated successfully")
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to update password")
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Settings</h1>
                <p className="text-slate-500 mt-2 text-sm sm:text-base">
                    Manage your account details and security settings
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>
                            Your basic account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        defaultValue={user.full_name}
                                        className="pl-9"
                                        disabled // Enable when endpoint ready
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        defaultValue={user.email}
                                        className="pl-9"
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        defaultValue={user.role}
                                        className="pl-9 capitalize"
                                        disabled
                                    />
                                </div>
                            </div>
                            {/* <Button type="submit" disabled>Save Changes</Button> */}
                        </form>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-500" />
                            Security
                        </CardTitle>
                        <CardDescription>
                            Update your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? "Updating..." : "Change Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
