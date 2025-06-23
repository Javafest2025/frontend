"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Zap, Search, Database, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchLoadingStep } from "@/types/websearch"

interface SearchLoadingProgressProps {
    isVisible: boolean
    progress: number
    currentStep: string
    onComplete?: () => void
}

const loadingSteps: SearchLoadingStep[] = [
    { id: "init", message: "Request sent to search agent...", completed: false, timestamp: new Date() },
    { id: "agent", message: "Agent initiated successfully", completed: false, timestamp: new Date() },
    { id: "sources", message: "Fetching from academic databases...", completed: false, timestamp: new Date() },
    { id: "arxiv", message: "Scanning arXiv repository...", completed: false, timestamp: new Date() },
    { id: "semantic", message: "Querying Semantic Scholar...", completed: false, timestamp: new Date() },
    { id: "processing", message: "Processing and filtering results...", completed: false, timestamp: new Date() },
    { id: "metadata", message: "Enriching paper metadata...", completed: false, timestamp: new Date() },
    { id: "complete", message: "Search completed successfully!", completed: false, timestamp: new Date() }
]

export function SearchLoadingProgress({
    isVisible,
    progress,
    currentStep,
    onComplete
}: SearchLoadingProgressProps) {
    const [steps, setSteps] = useState<SearchLoadingStep[]>(loadingSteps)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    useEffect(() => {
        if (!isVisible) {
            setSteps(loadingSteps.map(step => ({ ...step, completed: false })))
            setCurrentStepIndex(0)
            return
        }

        const stepIndex = Math.floor((progress / 100) * steps.length)
        setCurrentStepIndex(stepIndex)

        // Update completed steps
        setSteps(prevSteps =>
            prevSteps.map((step, index) => ({
                ...step,
                completed: index < stepIndex,
                timestamp: index === stepIndex ? new Date() : step.timestamp
            }))
        )

        // Call onComplete when progress reaches 100%
        if (progress >= 100 && onComplete) {
            setTimeout(onComplete, 1000)
        }
    }, [progress, isVisible, onComplete, steps.length])

    if (!isVisible) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        >
            <div className="bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4"
                    >
                        <Search className="h-8 w-8 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Searching Academic Papers
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Our AI agent is scanning multiple databases for relevant research papers
                    </p>
                </div>

                {/* Progress Bar Container */}
                <div className="relative mb-8">
                    {/* Background Track */}
                    <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden">
                        {/* Progress Fill */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-full relative"
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </motion.div>
                    </div>

                    {/* Spinning Gears at the End */}
                    <motion.div
                        style={{ left: `${Math.min(progress, 95)}%` }}
                        className="absolute -top-2 transform -translate-x-1/2"
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-1">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Settings className="h-6 w-6 text-blue-500" />
                            </motion.div>
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            >
                                <Settings className="h-4 w-4 text-cyan-500" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Progress Percentage */}
                    <div className="text-center mt-4">
                        <span className="text-2xl font-bold text-primary">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>

                {/* Loading Steps */}
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                    opacity: index <= currentStepIndex ? 1 : 0.4,
                                    x: 0,
                                    scale: index === currentStepIndex ? 1.02 : 1
                                }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                                    index === currentStepIndex && "bg-primary/5 border border-primary/20",
                                    step.completed && "bg-green-500/5 border border-green-500/20"
                                )}
                            >
                                {/* Step Icon */}
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                                    step.completed
                                        ? "bg-green-500 text-white"
                                        : index === currentStepIndex
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {step.completed ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : index === currentStepIndex ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Zap className="h-4 w-4" />
                                        </motion.div>
                                    ) : (
                                        <Database className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Step Message */}
                                <div className="flex-1">
                                    <p className={cn(
                                        "text-sm font-medium transition-colors duration-300",
                                        step.completed
                                            ? "text-green-600 dark:text-green-400"
                                            : index === currentStepIndex
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                    )}>
                                        {step.message}
                                    </p>
                                    {index === currentStepIndex && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 2, ease: "easeInOut" }}
                                            className="h-0.5 bg-gradient-to-r from-primary to-cyan-500 mt-1 rounded-full"
                                        />
                                    )}
                                </div>

                                {/* Timestamp */}
                                {(step.completed || index === currentStepIndex) && (
                                    <span className="text-xs text-muted-foreground">
                                        {step.timestamp.toLocaleTimeString()}
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-muted-foreground">
                    <p>This may take a few moments depending on your search criteria</p>
                </div>
            </div>
        </motion.div>
    )
} 