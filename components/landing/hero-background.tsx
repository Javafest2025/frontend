"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    opacity: number
    connections: number[]
    type: 'neuron' | 'data'
    pulsePhase: number
}

interface CitationNode {
    x: number
    y: number
    title: string
    citations: number
    field: string
    opacity: number
    scale: number
    movePhase: number
    baseX: number // base position for large movements
    baseY: number // base position for large movements
    flowDirection: number // direction of flow (0-2π)
    flowSpeed: number // speed of flow movement
    orbitRadius: number // radius of orbital movement
    currentAngle: number // current angle in orbit
    windResistance: number // how much it resists wind
}

export function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, { stiffness: 100, damping: 30 })
    const springY = useSpring(mouseY, { stiffness: 100, damping: 30 })
    const animationFrameRef = useRef<number>()
    const startTimeRef = useRef<number>(Date.now())

    const [citationNodes, setCitationNodes] = useState<CitationNode[]>([])
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [animationTick, setAnimationTick] = useState(0)

    // Sample research papers/citations for floating elements
    const sampleCitations = [
        { title: "Attention Is All You Need", citations: 45623, field: "ML" },
        { title: "BERT: Pre-training Deep Bidirectional", citations: 23451, field: "NLP" },
        { title: "ResNet: Deep Residual Learning", citations: 67234, field: "CV" },
        { title: "Transformer Networks", citations: 12890, field: "DL" },
        { title: "Neural Architecture Search", citations: 8765, field: "AI" },
        { title: "Graph Neural Networks", citations: 15432, field: "GNN" },
    ]

    useEffect(() => {
        // Generate citation nodes with underwater floating patterns
        const nodes: CitationNode[] = sampleCitations.map((citation, index) => {
            // Start positions distributed but not grid-locked
            const angle = (index / sampleCitations.length) * Math.PI * 2
            const radius = 0.2 + Math.random() * 0.5 // 20-70% from center
            const centerX = 50
            const centerY = 50

            const baseX = centerX + Math.cos(angle) * radius * 35
            const baseY = centerY + Math.sin(angle) * radius * 25

            return {
                x: baseX,
                y: baseY,
                baseX,
                baseY,
                title: citation.title,
                citations: citation.citations,
                field: citation.field,
                opacity: 0.4 + Math.random() * 0.3,
                scale: 0.85 + Math.random() * 0.3,
                movePhase: Math.random() * Math.PI * 2,
                flowDirection: Math.random() * Math.PI * 2, // random initial direction
                flowSpeed: 0.3 + Math.random() * 0.4, // slower, more fluid speeds
                orbitRadius: 8 + Math.random() * 15, // smaller, gentler orbits
                currentAngle: Math.random() * Math.PI * 2,
                windResistance: 0.6 + Math.random() * 0.3 // higher resistance like water
            }
        })
        setCitationNodes(nodes)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const updateDimensions = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
            setDimensions({ width: rect.width, height: rect.height })
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)

        // Enhanced particle system
        const particles: Particle[] = []
        const particleCount = Math.min(150, Math.floor((dimensions.width * dimensions.height) / 8000))

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 3 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                connections: [],
                type: Math.random() > 0.7 ? 'data' : 'neuron',
                pulsePhase: Math.random() * Math.PI * 2
            })
        }

        let animationId: number
        let time = 0

        const animate = () => {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height)
            time += 0.01

            // Update and draw particles
            particles.forEach((particle, i) => {
                // Update position with subtle drift
                particle.x += particle.vx + Math.sin(time + particle.pulsePhase) * 0.1
                particle.y += particle.vy + Math.cos(time + particle.pulsePhase) * 0.1
                particle.pulsePhase += 0.02

                // Boundary wrapping
                if (particle.x < 0) particle.x = dimensions.width
                if (particle.x > dimensions.width) particle.x = 0
                if (particle.y < 0) particle.y = dimensions.height
                if (particle.y > dimensions.height) particle.y = 0

                // Mouse interaction
                const mouseInfluence = 100
                const dx = (springX.get() - particle.x)
                const dy = (springY.get() - particle.y)
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouseInfluence) {
                    const force = (mouseInfluence - distance) / mouseInfluence
                    particle.x += dx * force * 0.02
                    particle.y += dy * force * 0.02
                }

                // Draw particle with pulsing effect
                const pulseSize = 1 + Math.sin(particle.pulsePhase) * 0.3
                const alpha = particle.opacity * (0.6 + Math.sin(particle.pulsePhase) * 0.4)

                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.radius * pulseSize, 0, Math.PI * 2)

                if (particle.type === 'neuron') {
                    ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
                } else {
                    ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`
                }
                ctx.fill()

                // Add glow effect
                ctx.shadowColor = particle.type === 'neuron' ? '#6366f1' : '#8b5cf6'
                ctx.shadowBlur = 15
                ctx.fill()
                ctx.shadowBlur = 0

                // Find and draw connections
                particle.connections = []
                particles.forEach((other, j) => {
                    if (i !== j) {
                        const dx = particle.x - other.x
                        const dy = particle.y - other.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < 120) {
                            particle.connections.push(j)

                            // Dynamic connection opacity
                            const baseOpacity = (120 - distance) / 120 * 0.4
                            const pulseEffect = Math.sin(time * 2 + distance * 0.01) * 0.2
                            const connectionOpacity = baseOpacity + pulseEffect

                            // Gradient line
                            const gradient = ctx.createLinearGradient(particle.x, particle.y, other.x, other.y)
                            gradient.addColorStop(0, `rgba(99, 102, 241, ${connectionOpacity})`)
                            gradient.addColorStop(0.5, `rgba(139, 92, 246, ${connectionOpacity * 1.5})`)
                            gradient.addColorStop(1, `rgba(168, 85, 247, ${connectionOpacity})`)

                            ctx.beginPath()
                            ctx.moveTo(particle.x, particle.y)
                            ctx.lineTo(other.x, other.y)
                            ctx.strokeStyle = gradient
                            ctx.lineWidth = 1.5
                            ctx.stroke()
                        }
                    }
                })
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', updateDimensions)
            cancelAnimationFrame(animationId)
        }
    }, [dimensions.width, dimensions.height, springX, springY])

    // Animation loop for smooth position updates
    useEffect(() => {
        const animate = () => {
            setAnimationTick(tick => tick + 1)
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
            mouseX.set(e.clientX - rect.left)
            mouseY.set(e.clientY - rect.top)
        }
    }

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {/* Subtle gradient background matching auth theme */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)',
                        'radial-gradient(circle at 60% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
                    ]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Subtle wave overlay */}
            <motion.div
                className="absolute inset-0 opacity-15"
                style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
                }}
                animate={{
                    transform: ['translateX(-100%) translateY(-100%)', 'translateX(100%) translateY(100%)']
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Neural network canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ filter: 'blur(0.5px)' }}
            />

            {/* Floating citation nodes */}
            <div className="absolute inset-0">
                {citationNodes.map((node, index) => {
                    // Create underwater floating movement
                    const currentTime = (Date.now() - startTimeRef.current) * 0.001 // convert to seconds
                    const timeOffset = index * 3.5

                    // Gentle swaying like underwater plants
                    const swayX = Math.sin(currentTime * 0.08 * node.flowSpeed + timeOffset) * node.orbitRadius * 1.5
                    const swayY = Math.cos(currentTime * 0.06 * node.flowSpeed + timeOffset) * (node.orbitRadius * 0.8)

                    // Slow water current drift
                    const currentDriftX = Math.sin(currentTime * 0.04 + node.flowDirection) * 12
                    const currentDriftY = Math.cos(currentTime * 0.03 + node.flowDirection + Math.PI / 6) * 8

                    // Buoyancy effect - gentle rising and falling like in water
                    const buoyancyY = Math.sin(currentTime * 0.25 + node.movePhase) * 6

                    // Very gentle micro movements (less jittery, more fluid)
                    const fluidX = Math.sin(currentTime * 0.7 + node.movePhase) * 2
                    const fluidY = Math.cos(currentTime * 0.5 + node.movePhase + Math.PI / 4) * 1.5

                    // Underwater thermal-like vertical movement
                    const thermalY = Math.sin(currentTime * 0.15 + index * 0.8) * 4

                    // Gentle figure-8 motion like floating debris
                    const floatX = Math.sin(currentTime * 0.12 + timeOffset) * 8
                    const floatY = Math.sin(currentTime * 0.24 + timeOffset) * 4

                    // Calculate final position with water-like damping
                    const finalX = node.baseX + swayX + currentDriftX + fluidX + floatX
                    const finalY = node.baseY + swayY + currentDriftY + buoyancyY + thermalY + floatY

                    // Ensure cards stay within bounds but allow fluid movement
                    const boundedX = Math.max(3, Math.min(97, finalX))
                    const boundedY = Math.max(8, Math.min(85, finalY))

                    return (
                        <motion.div
                            key={index}
                            className="absolute pointer-events-none"
                            style={{
                                left: `${boundedX}%`,
                                top: `${boundedY}%`,
                                willChange: 'transform',
                            }}
                            animate={{
                                // Gentle underwater swaying animation
                                rotate: [
                                    -1.5 + Math.sin(index) * 1.5,
                                    1.5 + Math.cos(index) * 1.5,
                                    -1 + Math.sin(index + 1) * 1.5
                                ],
                                scale: [
                                    node.scale * 0.97,
                                    node.scale * 1.03,
                                    node.scale * 0.99
                                ],
                                opacity: [
                                    node.opacity * 0.8,
                                    node.opacity * 1.0,
                                    node.opacity * 0.9
                                ],
                            }}
                            transition={{
                                duration: 35 + index * 5, // Much slower, more fluid
                                repeat: Infinity,
                                ease: [0.25, 0.25, 0.75, 0.75], // More linear, water-like easing
                                delay: index * 3,
                                repeatType: "mirror"
                            }}
                            whileHover={{
                                scale: node.scale * 1.15,
                                rotate: 0,
                                transition: {
                                    duration: 0.8, // Slower hover response like in water
                                    ease: [0.25, 0.46, 0.45, 0.94]
                                }
                            }}
                        >
                            <motion.div
                                className="relative group"
                                animate={{
                                    // Gentle 3D rotation like floating underwater
                                    rotateY: [0, 4, -4, 0],
                                    rotateX: [0, 2, -2, 0],
                                    rotateZ: [-0.5, 0.5, -0.5]
                                }}
                                transition={{
                                    duration: 40 + index * 3, // Very slow rotation
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 2
                                }}
                            >
                                {/* Enhanced citation card matching auth theme */}
                                <div className="relative bg-gradient-to-br from-background/20 via-background/10 to-transparent backdrop-blur-md border border-primary/30 rounded-xl p-4 max-w-xs shadow-2xl shadow-primary/10 group-hover:shadow-primary/20 transition-all duration-500">
                                    {/* Top gradient border */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/30 via-purple-500/20 to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                    <div className="absolute inset-[1px] rounded-xl bg-background/10 backdrop-blur-md"></div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Header with field badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
                                                <span className="text-xs text-primary font-semibold tracking-wide">{node.field}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                                <div className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="text-sm text-foreground/80 font-medium leading-snug mb-3 line-clamp-2">
                                            {node.title}
                                        </div>

                                        {/* Citations and metrics */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-3 h-3 text-primary/70" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs text-muted-foreground/60 font-medium">
                                                    {node.citations.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-primary/60 font-mono">
                                                h-index: {Math.floor(node.citations / 1000) + 50}
                                            </div>
                                        </div>

                                        {/* Impact indicator */}
                                        <div className="mt-3 flex items-center space-x-2">
                                            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((node.citations / 70000) * 100, 100)}%` }}
                                                    transition={{ duration: 2, delay: index * 0.2 }}
                                                />
                                            </div>
                                            <span className="text-xs text-primary/70 font-medium">Impact</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced glow effects */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/15 rounded-xl blur-xl -z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-2xl -z-20 opacity-40" />

                                {/* Floating particles around card */}
                                <motion.div
                                    className="absolute -top-2 -right-2 w-2 h-2 bg-primary/60 rounded-full"
                                    animate={{
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: index * 0.5
                                    }}
                                />
                                <motion.div
                                    className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-500/60 rounded-full"
                                    animate={{
                                        scale: [0, 1, 0],
                                        opacity: [0, 0.8, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: index * 0.3 + 1
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Depth layers */}
            <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                    background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)'
                }}
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Grid overlay for depth */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '100px 100px',
                        animation: 'grid-move 20s linear infinite'
                    }}
                />
            </div>

            {/* Custom CSS for grid animation */}
            <style jsx>{`
                @keyframes grid-move {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(100px, 100px); }
                }
            `}</style>
        </div>
    )
} 