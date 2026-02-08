"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Brain, TrendingUp, Clock, Shield } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Create and manage rotas with intelligent conflict detection and optimization.",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get smart suggestions for shift assignments based on availability and preferences.",
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Manage your workforce efficiently with comprehensive employee profiles.",
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Track hours, analyze trends, and make data-driven staffing decisions.",
    },
    {
      icon: Clock,
      title: "Time-Off Management",
      description: "Handle vacation requests and time-off approvals seamlessly.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-6 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            RotaMate
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-4 py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]" />

          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
                Workforce scheduling made{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  smart
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
                RotaMate helps you manage shifts, track availability, and generate fair rotas with the power of AI.
                Say goodbye to scheduling headaches and hello to efficient workforce management.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="px-8">
                    Start for Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8">
                    Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-24 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage your team
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Powerful features designed for modern workforce management
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="elevated" className="h-full">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-24 bg-gradient-to-r from-blue-600 to-blue-400">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your scheduling?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of teams already using RotaMate to streamline their workforce management.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="px-8">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 dark:border-slate-800 py-8 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} RotaMate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
