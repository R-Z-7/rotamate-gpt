"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Building, Shield, Save, UserCog } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [emailNotifs, setEmailNotifs] = useState(true)
    const [pushNotifs, setPushNotifs] = useState(true)
    const [shiftUpdates, setShiftUpdates] = useState(true)
    const [companyInfo, setCompanyInfo] = useState({
        name: "Acme Healthcare Ltd",
        address: "123 Medical Way, London, UK",
        email: "admin@acmehealth.co.uk",
        phone: "+44 20 1234 5678"
    })

    const handleSave = () => {
        toast.success("Settings saved successfully")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your application preferences and company details.
                </p>
            </div>

            <Tabs defaultValue="company" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="company">Company Info</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                </TabsList>

                {/* Company Info Tab */}
                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                Company Details
                            </CardTitle>
                            <CardDescription>
                                Update your organization's public information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    value={companyInfo.name}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={companyInfo.address}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Contact Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={companyInfo.email}
                                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={companyInfo.phone}
                                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Configure how you receive alerts and updates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive daily summaries and urgent alerts via email.
                                    </p>
                                </div>
                                <Switch
                                    checked={emailNotifs}
                                    onCheckedChange={setEmailNotifs}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive real-time alerts in your browser.
                                    </p>
                                </div>
                                <Switch
                                    checked={pushNotifs}
                                    onCheckedChange={setPushNotifs}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Shift Updates</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when your rota changes or is published.
                                    </p>
                                </div>
                                <Switch
                                    checked={shiftUpdates}
                                    onCheckedChange={setShiftUpdates}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Roles & Permissions
                            </CardTitle>
                            <CardDescription>
                                View and manage access levels for your team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-md border p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Administrator</p>
                                            <p className="text-sm text-muted-foreground">Full access to all system features</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">View Permissions</Button>
                                </div>

                                <div className="rounded-md border p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-500/10 p-2 rounded-full">
                                            <UserCog className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Manager</p>
                                            <p className="text-sm text-muted-foreground">Can manage rotas and approve requests</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">View Permissions</Button>
                                </div>

                                <div className="rounded-md border p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-500/10 p-2 rounded-full">
                                            <UserCog className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Employee</p>
                                            <p className="text-sm text-muted-foreground">Can view own schedule and request time off</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">View Permissions</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
