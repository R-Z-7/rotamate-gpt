"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Save, Shield, Mail, Globe } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
    const handleSave = () => {
        toast.success("Platform settings updated")
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Configure global system parameters.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                General Configuration
                            </CardTitle>
                            <CardDescription>
                                Basic platform settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Platform Name</Label>
                                <Input defaultValue="RotaMate Enterprise" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@rotamate.com" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Disable access for all non-admin users.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Security Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enforce 2FA</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require two-factor authentication for all admins.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="grid gap-2">
                                <Label>Session Timeout (minutes)</Label>
                                <Input type="number" defaultValue="60" />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Email Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>SMTP Host</Label>
                                <Input defaultValue="smtp.sendgrid.net" />
                            </div>
                            <div className="grid gap-2">
                                <Label>SMTP Port</Label>
                                <Input defaultValue="587" />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
