"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [floatingShapes, setFloatingShapes] = useState<Array<{
        left: number
        top: number
        width: number
        height: number
        duration: number
    }>>([])

    useEffect(() => {
        // Generate floating shapes on client only to avoid hydration mismatch
        const shapes = [...Array(6)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            width: 20 + Math.random() * 40,
            height: 20 + Math.random() * 40,
            duration: 20 + Math.random() * 10
        }))
        setFloatingShapes(shapes)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Particles system
        const particles: Array<{
            x: number
            y: number
            vx: number
            vy: number
            radius: number
            opacity: number
            connections: number[]
        }> = []

        // Create particles
        const particleCount = 100
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                connections: []
            })
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Update and draw particles
            particles.forEach((particle, i) => {
                // Update position
                particle.x += particle.vx
                particle.y += particle.vy

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

                // Keep in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x))
                particle.y = Math.max(0, Math.min(canvas.height, particle.y))

                // Draw particle
                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`
                ctx.fill()

                // Find connections
                particle.connections = []
                particles.forEach((other, j) => {
                    if (i !== j) {
                        const dx = particle.x - other.x
                        const dy = particle.y - other.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < 120) {
                            particle.connections.push(j)

                            // Draw connection line
                            const opacity = (120 - distance) / 120 * 0.3
                            ctx.beginPath()
                            ctx.moveTo(particle.x, particle.y)
                            ctx.lineTo(other.x, other.y)
                            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
                            ctx.lineWidth = 1
                            ctx.stroke()
                        }
                    }
                })
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [])

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

            {/* Animated canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 opacity-40"
            />

            {/* Floating geometric shapes */}
            <div className="absolute inset-0">
                {floatingShapes.map((shape, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${shape.left}%`,
                            top: `${shape.top}%`,
                        }}
                        animate={{
                            x: [0, 30, -30, 0],
                            y: [0, -30, 30, 0],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: shape.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <div
                            className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-sm"
                            style={{
                                width: `${shape.width}px`,
                                height: `${shape.height}px`,
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Radial glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-5 mix-blend-multiply bg-noise" />
        </div>
    )
} 