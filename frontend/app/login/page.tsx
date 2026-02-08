"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await api.post("/auth/login", formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            login(res.data.access_token);

            // Basic role check/redirect usually happens here or in context
            // For now context redirects to /dashboard
        } catch (err) {
            setError("Invalid credentials")
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your email to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-slate-500">
                        Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
