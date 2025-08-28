"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserData } from "@/lib/api/user-service"
import {
    BookOpen,
    Plus,
    Search,
    Upload,
    FileText,
    MessageSquare,
    Brain,
    Sparkles,
    Play,
    Library,
    Eye,
    Target,
    Lightbulb,
    Users,
    Calendar,
    CheckCircle,
    Star,
    Edit3,
    Quote,
    Clipboard,
    Download
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

// Helper function to convert Tailwind color classes to RGB values for shimmer effect
const getShimmerColor = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
        'text-blue-500': 'rgba(59, 130, 246, 0.2)',
        'text-green-500': 'rgba(34, 197, 94, 0.2)',
        'text-purple-500': 'rgba(168, 85, 247, 0.2)',
        'text-pink-500': 'rgba(236, 72, 153, 0.2)',
        'text-orange-500': 'rgba(249, 115, 22, 0.2)',
        'text-indigo-500': 'rgba(99, 102, 241, 0.2)',
        'text-cyan-500': 'rgba(6, 182, 212, 0.2)',
        'text-emerald-500': 'rgba(16, 185, 129, 0.2)',
        'text-amber-500': 'rgba(245, 158, 11, 0.2)',
        'text-red-500': 'rgba(239, 68, 68, 0.2)',
        'text-yellow-500': 'rgba(234, 179, 8, 0.2)'
    }
    return colorMap[colorClass] || 'rgba(59, 130, 246, 0.2)' // fallback to blue
}

// Helper function to get border color classes
const getBorderColor = (colorClass: string): { border: string, hoverBorder: string } => {
    const colorMap: { [key: string]: { border: string, hoverBorder: string } } = {
        'text-blue-500': { border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/40' },
        'text-green-500': { border: 'border-green-500/20', hoverBorder: 'hover:border-green-500/40' },
        'text-purple-500': { border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/40' },
        'text-pink-500': { border: 'border-pink-500/20', hoverBorder: 'hover:border-pink-500/40' },
        'text-orange-500': { border: 'border-orange-500/20', hoverBorder: 'hover:border-orange-500/40' },
        'text-indigo-500': { border: 'border-indigo-500/20', hoverBorder: 'hover:border-indigo-500/40' },
        'text-cyan-500': { border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-500/40' },
        'text-emerald-500': { border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/40' },
        'text-amber-500': { border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/40' },
        'text-red-500': { border: 'border-red-500/20', hoverBorder: 'hover:border-red-500/40' },
        'text-yellow-500': { border: 'border-yellow-500/20', hoverBorder: 'hover:border-yellow-500/40' }
    }
    return colorMap[colorClass] || { border: 'border-primary/20', hoverBorder: 'hover:border-primary/40' }
}

interface User {
    email?: string
    fullName?: string
}

const workflowSteps = [
    {
        id: 1,
        title: "Go to Projects",
        description: "Navigate to the Projects section to manage your research",
        icon: BookOpen,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    {
        id: 2,
        title: "Create Project",
        description: "Start a new research project to organize your work",
        icon: Plus,
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    {
        id: 3,
        title: "Open Project",
        description: "Access your project workspace and tools",
        icon: Play,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        id: 4,
        title: "Collect Papers",
        description: "Search web or upload PDFs to add papers to your library",
        icon: Search,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10"
    },
    {
        id: 5,
        title: "Add Papers",
        description: "Search web or upload PDFs to add papers to your library",
        icon: Upload,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10"
    },
    {
        id: 6,
        title: "Go to Library",
        description: "Access the project library to manage papers",
        icon: Library,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10"
    },
    {
        id: 7,
        title: "Open Paper",
        description: "Select and open a paper for detailed analysis",
        icon: FileText,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10"
    },
    {
        id: 8,
        title: "Summarize",
        description: "Use AI to generate intelligent summaries and insights",
        icon: Brain,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10"
    },
    {
        id: 9,
        title: "View PDF",
        description: "Read and annotate the full PDF document",
        icon: Eye,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10"
    },
    {
        id: 10,
        title: "Chat",
        description: "Ask questions and get intelligent answers from your papers",
        icon: MessageSquare,
        color: "text-red-500",
        bgColor: "bg-red-500/10"
    },
    {
        id: 11,
        title: "Analyze Gaps",
        description: "Identify research gaps and opportunities in your field",
        icon: Target,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        id: 12,
        title: "Get Topic Suggestions",
        description: "AI-powered research topic recommendations based on your papers",
        icon: Lightbulb,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
    },
    {
        id: 13,
        title: "Write Papers",
        description: "AI-integrated LaTeX editor for academic writing",
        icon: FileText,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    {
        id: 14,
        title: "Manage Todo",
        description: "Organize research tasks and reading lists",
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    {
        id: 15,
        title: "Notes & Annotations",
        description: "Create and manage research notes and annotations",
        icon: Star,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10"
    }
]

const aiFeatures = [
    {
        icon: Brain,
        title: "AI-Powered Analysis",
        description: "Intelligent paper summarization and insight extraction",
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10"
    },
    {
        icon: MessageSquare,
        title: "Interactive Chat",
        description: "Ask questions and get answers from your research papers",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10"
    },
    {
        icon: Download,
        title: "Smart Paper Collection",
        description: "Intelligent AI-based paper fetching and recommendation",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    {
        icon: Edit3,
        title: "AI Integrated LaTeX Editor",
        description: "Write academic papers with AI assistance and LaTeX support",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        icon: Quote,
        title: "AI Based Citation Management",
        description: "Automated citation generation and bibliography management",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10"
    },
    {
        icon: Clipboard,
        title: "AI Review and Suggestion",
        description: "Get intelligent feedback and suggestions for your research",
        color: "text-pink-500",
        bgColor: "bg-pink-500/10"
    }
]

const researchFeatures = [
    {
        icon: Users,
        title: "Collaboration",
        description: "Share projects and collaborate with research teams",
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10"
    },
    {
        icon: Calendar,
        title: "Progress Tracking",
        description: "Monitor your research progress and deadlines",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10"
    },
    {
        icon: Target,
        title: "Research Focus",
        description: "Stay organized with project-based research management",
        color: "text-red-500",
        bgColor: "bg-red-500/10"
    },
    {
        icon: Sparkles,
        title: "Smart Insights",
        description: "Discover connections and patterns across your papers",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
    },
    {
        icon: CheckCircle,
        title: "Task Management",
        description: "Organize research tasks and reading lists efficiently",
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    {
        icon: Star,
        title: "Notes & Annotations",
        description: "Create and manage research notes with smart organization",
        color: "text-pink-500",
        bgColor: "bg-pink-500/10"
    }
]

export function HomeGuide() {
    const [user, setUser] = useState<User | null>(null)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const userData = getUserData()
        setUser(userData)
    }, [])

    // Step illumination animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % 16) // 0-15, then back to 0
        }, 2000) // Move to next step every 2000ms (much slower)

        return () => clearInterval(interval)
    }, [])

    const getGreeting = () => {
        if (user?.fullName) {
            return user.fullName
        }
        return "Scholar"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 mb-4 sm:mb-6">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-primary">Welcome to ScholarAI</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-primary mb-3 sm:mb-4">
                        Hi {getGreeting()!}!
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                        Your intelligent research companion is ready to help you discover, analyze, and synthesize academic papers with AI.
                    </p>
                </motion.div>

                {/* Research Workflow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-8 sm:mb-12"
                >
                    <div className="flex items-center justify-center mb-6 sm:mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
                        <div className="flex items-center gap-3 mx-4">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-center">Research Workflow</h2>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/30" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 relative">

                        {workflowSteps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                className="relative"
                            >
                                <Card
                                    className={cn(
                                        "bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500 group h-full relative overflow-hidden",
                                        currentStep === step.id && "border-primary/50 shadow-primary/20 bg-background/60"
                                    )}
                                >
                                    {/* Electric current overlay */}
                                    {currentStep === step.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute inset-0 rounded-lg"
                                            style={{
                                                background: `linear-gradient(45deg, transparent 30%, ${getShimmerColor(step.color)} 50%, transparent 70%)`,
                                                animation: "shimmer 1.5s ease-in-out infinite"
                                            }}
                                        />
                                    )}

                                    <CardContent className="p-4 sm:p-6 relative z-10">
                                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                            <div className={cn(
                                                "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all duration-500",
                                                step.bgColor,
                                                currentStep === step.id && "scale-110 shadow-lg"
                                            )}
                                                style={currentStep === step.id ? {
                                                    boxShadow: `0 10px 25px -5px ${getShimmerColor(step.color).replace('0.2', '0.3')}`
                                                } : {}}
                                            >
                                                <step.icon className={cn(
                                                    "h-5 w-5 sm:h-6 sm:w-6 transition-all duration-500",
                                                    step.color,
                                                    currentStep === step.id && "scale-110 drop-shadow-lg"
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-xs transition-all duration-500",
                                                            currentStep === step.id && "bg-primary/20 border-primary/50 text-primary"
                                                        )}
                                                    >
                                                        Step {step.id}
                                                    </Badge>
                                                </div>
                                                <h3 className={cn(
                                                    "text-base sm:text-lg font-semibold group-hover:text-primary transition-all duration-500",
                                                    currentStep === step.id && "text-primary drop-shadow-sm"
                                                )}>
                                                    {step.title}
                                                </h3>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-xs sm:text-sm text-muted-foreground transition-all duration-500",
                                            currentStep === step.id && "text-foreground/80"
                                        )}>
                                            {step.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-center mb-6 sm:mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
                        <div className="flex items-center gap-3 mx-4">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-center">Powerful AI Features</h2>
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/30" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {aiFeatures.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                            >
                                <Card className={cn(
                                    "group bg-background/20 backdrop-blur-xl border shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-background/30 relative overflow-hidden",
                                    getBorderColor(feature.color || 'text-primary').border,
                                    getBorderColor(feature.color || 'text-primary').hoverBorder
                                )}>
                                    {/* Glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{
                                            background: `linear-gradient(45deg, transparent 30%, ${getShimmerColor(feature.color || 'text-primary')} 50%, transparent 70%)`
                                        }}
                                    />

                                    <CardContent className="p-4 sm:p-6 relative z-10">
                                        <div className={cn(
                                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300",
                                            feature.bgColor || "bg-primary/10",
                                            "group-hover:shadow-lg"
                                        )}
                                            style={{
                                                boxShadow: `0 4px 12px -2px ${getShimmerColor(feature.color || 'text-primary').replace('0.2', '0.3')}`
                                            }}
                                        >
                                            <feature.icon className={cn(
                                                "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300",
                                                feature.color || "text-primary"
                                            )} />
                                        </div>
                                        <h3 className="font-semibold mb-2 text-sm sm:text-base group-hover:text-foreground transition-colors duration-300">{feature.title}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Research Management Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <div className="flex items-center justify-center mb-6 sm:mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
                        <div className="flex items-center gap-3 mx-4">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-center">Research Management Tools</h2>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/30" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {researchFeatures.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                            >
                                <Card className={cn(
                                    "group bg-background/20 backdrop-blur-xl border shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-background/30 relative overflow-hidden",
                                    getBorderColor(feature.color || 'text-primary').border,
                                    getBorderColor(feature.color || 'text-primary').hoverBorder
                                )}>
                                    {/* Glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{
                                            background: `linear-gradient(45deg, transparent 30%, ${getShimmerColor(feature.color || 'text-primary')} 50%, transparent 70%)`
                                        }}
                                    />

                                    <CardContent className="p-4 sm:p-6 relative z-10">
                                        <div className={cn(
                                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300",
                                            feature.bgColor || "bg-primary/10",
                                            "group-hover:shadow-lg"
                                        )}
                                            style={{
                                                boxShadow: `0 4px 12px -2px ${getShimmerColor(feature.color || 'text-primary').replace('0.2', '0.3')}`
                                            }}
                                        >
                                            <feature.icon className={cn(
                                                "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300",
                                                feature.color || "text-primary"
                                            )} />
                                        </div>
                                        <h3 className="font-semibold mb-2 text-sm sm:text-base group-hover:text-foreground transition-colors duration-300">{feature.title}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>


            </div>
        </div>
    )
} 