"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Moon, Volume2, Mail } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [emailNotifs, setEmailNotifs] = useState(true)
    const [pushNotifs, setPushNotifs] = useState(true)
    const [shiftUpdates, setShiftUpdates] = useState(true)

    const handleSave = () => {
        toast.success("Settings saved successfully")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 text-sm sm:text-base">
                    Manage your application preferences
                </p>
            </div>

            <div className="grid gap-6">
                {/* Appearance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5 text-blue-500" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize how the application looks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Dark Mode</Label>
                                <p className="text-sm text-slate-500">
                                    Switch between light and dark themes
                                </p>
                            </div>
                            <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-500" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Configure how you receive alerts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-slate-500">
                                    Receive updates via email
                                </p>
                            </div>
                            <Switch
                                checked={emailNotifs}
                                onCheckedChange={setEmailNotifs}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-sm text-slate-500">
                                    Receive push notifications in browser
                                </p>
                            </div>
                            <Switch
                                checked={pushNotifs}
                                onCheckedChange={setPushNotifs}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Shift Updates</Label>
                                <p className="text-sm text-slate-500">
                                    Get notified when your rota changes
                                </p>
                            </div>
                            <Switch
                                checked={shiftUpdates}
                                onCheckedChange={setShiftUpdates}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </div>
    )
}
