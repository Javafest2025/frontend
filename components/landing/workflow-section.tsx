"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    FolderPlus,
    Search,
    BarChart3,
    Target,
    ArrowRight,
    CheckCircle,
    Play,
    Sparkles
} from "lucide-react"

const workflowSteps = [
    {
        id: 1,
        icon: FolderPlus,
        title: "Create Project",
        description: "Set up your research domain and topics to scope your investigation",
        details: [
            "Define research questions",
            "Set topic boundaries",
            "Configure search parameters",
            "Create project workspace"
        ],
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-500/10 to-cyan-500/10"
    },
    {
        id: 2,
        icon: Search,
        title: "Fetch Papers",
        description: "AI agents automatically find and download relevant academic papers",
        details: [
            "Multi-database search",
            "Automatic PDF downloads",
            "Metadata extraction",
            "Quality filtering"
        ],
        color: "from-green-500 to-emerald-500",
        bgColor: "from-green-500/10 to-emerald-500/10"
    },
    {
        id: 3,
        icon: BarChart3,
        title: "Analyze & Score",
        description: "Extract insights, generate summaries, and score papers by relevance",
        details: [
            "Content summarization",
            "Key insights extraction",
            "Relevance scoring",
            "Impact assessment"
        ],
        color: "from-purple-500 to-violet-500",
        bgColor: "from-purple-500/10 to-violet-500/10"
    },
    {
        id: 4,
        icon: Target,
        title: "Discover Gaps",
        description: "Identify research opportunities and get suggestions for novel topics",
        details: [
            "Gap identification",
            "Opportunity mapping",
            "Novel topic suggestions",
            "Research roadmap"
        ],
        color: "from-orange-500 to-red-500",
        bgColor: "from-orange-500/10 to-red-500/10"
    }
]

export function WorkflowSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })
    const [activeStep, setActiveStep] = useState(1)
    const [isPlaying, setIsPlaying] = useState(false)

    const handlePlayDemo = () => {
        setIsPlaying(true)
        setActiveStep(1)

        // Auto-progress through steps
        const intervals: NodeJS.Timeout[] = []
        workflowSteps.forEach((_, index) => {
            const timeout = setTimeout(() => {
                setActiveStep(index + 1)
                if (index === workflowSteps.length - 1) {
                    setTimeout(() => setIsPlaying(false), 1000)
                }
            }, index * 2000)
            intervals.push(timeout)
        })

        // Clean up timeouts after demo
        setTimeout(() => {
            intervals.forEach(clearTimeout)
        }, workflowSteps.length * 2000 + 1000)
    }

    return (
        <section id="workflow" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/30" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Workflow</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                        How ScholarAI
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Works</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
                        A seamless workflow powered by specialized AI agents that work together
                        to accelerate your research process from start to finish.
                    </p>

                    <Button
                        onClick={handlePlayDemo}
                        disabled={isPlaying}
                        className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                    >
                        <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                        {isPlaying ? "Playing Demo..." : "Watch Workflow Demo"}
                    </Button>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Desktop Timeline */}
                    <div className="hidden md:block">
                        <div className="relative">
                            {/* Progress Line */}
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={isInView ? { width: "100%" } : { width: "0%" }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="absolute top-16 left-0 h-1 bg-gradient-to-r from-primary to-purple-600 rounded-full z-10"
                            />
                            <div className="absolute top-16 left-0 w-full h-1 bg-border rounded-full" />

                            {/* Steps */}
                            <div className="grid grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                {workflowSteps.map((step, index) => {
                                    const Icon = step.icon
                                    const isActive = activeStep === step.id
                                    const isCompleted = activeStep > step.id

                                    return (
                                        <motion.div
                                            key={step.id}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                            transition={{
                                                duration: 0.6,
                                                delay: index * 0.2 + 0.3,
                                                ease: "easeOut"
                                            }}
                                            className="relative cursor-pointer"
                                            onClick={() => !isPlaying && setActiveStep(step.id)}
                                        >
                                            {/* Step Circle */}
                                            <motion.div
                                                className="relative mx-auto mb-6 flex items-center justify-center"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: isActive ? [1, 1.2, 1] : 1,
                                                        boxShadow: isActive
                                                            ? ["0 0 0 rgba(99, 102, 241, 0)", "0 0 30px rgba(99, 102, 241, 0.3)", "0 0 0 rgba(99, 102, 241, 0)"]
                                                            : "0 0 0 rgba(99, 102, 241, 0)"
                                                    }}
                                                    transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                                                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center relative ${isCompleted
                                                        ? 'bg-gradient-to-r from-primary to-purple-600 border-primary'
                                                        : isActive
                                                            ? 'bg-gradient-to-r from-primary/20 to-purple-600/20 border-primary'
                                                            : 'bg-background border-border hover:border-primary/50'
                                                        } transition-all duration-300`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-8 w-8 text-white" />
                                                    ) : (
                                                        <Icon className={`h-8 w-8 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    )}
                                                </motion.div>

                                                {/* Step Number */}
                                                <motion.div
                                                    animate={{
                                                        backgroundColor: isActive ? "#6366f1" : "transparent",
                                                        color: isActive ? "#ffffff" : "#6b7280"
                                                    }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-background bg-muted text-xs font-bold flex items-center justify-center"
                                                >
                                                    {step.id}
                                                </motion.div>
                                            </motion.div>

                                            {/* Step Content */}
                                            <motion.div
                                                animate={{
                                                    scale: isActive ? 1.02 : 1,
                                                    y: isActive ? -5 : 0
                                                }}
                                                transition={{ duration: 0.3 }}
                                                className={`p-6 rounded-2xl border transition-all duration-300 ${isActive
                                                    ? 'border-primary/30 bg-gradient-to-br ' + step.bgColor + ' shadow-lg shadow-primary/10'
                                                    : 'border-border/50 bg-background/50 hover:border-primary/20'
                                                    }`}
                                            >
                                                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                    {step.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                                    {step.description}
                                                </p>

                                                {/* Details that appear when active */}
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{
                                                        height: isActive ? "auto" : 0,
                                                        opacity: isActive ? 1 : 0
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="space-y-2">
                                                        {step.details.map((detail, detailIndex) => (
                                                            <motion.div
                                                                key={detailIndex}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{
                                                                    opacity: isActive ? 1 : 0,
                                                                    x: isActive ? 0 : -20
                                                                }}
                                                                transition={{ delay: detailIndex * 0.1 }}
                                                                className="flex items-center text-xs text-muted-foreground"
                                                            >
                                                                <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                                                                {detail}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </motion.div>

                                            {/* Arrow between steps */}
                                            {index < workflowSteps.length - 1 && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                    transition={{ delay: index * 0.2 + 0.8 }}
                                                    className="absolute top-8 -right-4 z-20"
                                                >
                                                    <ArrowRight className="h-6 w-6 text-primary/60" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Timeline */}
                    <div className="md:hidden space-y-8">
                        {workflowSteps.map((step, index) => {
                            const Icon = step.icon
                            const isActive = activeStep === step.id
                            const isCompleted = activeStep > step.id

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.2 + 0.3,
                                        ease: "easeOut"
                                    }}
                                    className="flex items-start space-x-4"
                                    onClick={() => !isPlaying && setActiveStep(step.id)}
                                >
                                    {/* Timeline line and circle */}
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            animate={{
                                                scale: isActive ? [1, 1.1, 1] : 1,
                                                boxShadow: isActive
                                                    ? ["0 0 0 rgba(99, 102, 241, 0)", "0 0 20px rgba(99, 102, 241, 0.3)", "0 0 0 rgba(99, 102, 241, 0)"]
                                                    : "0 0 0 rgba(99, 102, 241, 0)"
                                            }}
                                            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isCompleted
                                                ? 'bg-gradient-to-r from-primary to-purple-600 border-primary'
                                                : isActive
                                                    ? 'bg-gradient-to-r from-primary/20 to-purple-600/20 border-primary'
                                                    : 'bg-background border-border'
                                                } transition-all duration-300`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="h-6 w-6 text-white" />
                                            ) : (
                                                <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                            )}
                                        </motion.div>

                                        {index < workflowSteps.length - 1 && (
                                            <div className="w-0.5 h-16 bg-border mt-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.02 : 1
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${isActive
                                            ? 'border-primary/30 bg-gradient-to-br ' + step.bgColor
                                            : 'border-border/50 bg-background/50'
                                            }`}
                                    >
                                        <h3 className={`text-lg font-semibold mb-2 ${isActive ? 'text-primary' : 'text-foreground'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </motion.div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-6">
                        Ready to experience this intelligent workflow?
                    </p>
                    <Link href="/login">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                        >
                            Start Your Research Journey
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
} 