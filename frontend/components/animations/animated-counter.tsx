"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"

interface AnimatedCounterProps {
    value: number
    duration?: number
    className?: string
}

export function AnimatedCounter({
    value,
    duration = 2,
    className
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, {
        damping: 60,
        stiffness: 100,
    })
    const isInView = useInView(ref, { once: true, margin: "0px" })

    useEffect(() => {
        if (isInView) {
            motionValue.set(value)
        }
    }, [motionValue, isInView, value])

    useEffect(() => {
        const unsubscribe = springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.floor(latest).toLocaleString()
            }
        })

        return () => unsubscribe()
    }, [springValue])

    return <span ref={ref} className={className}>0</span>
}
