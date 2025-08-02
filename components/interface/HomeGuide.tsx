"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserData } from "@/lib/api/auth"
import {
    BookOpen,
    Plus,
    Search,
    Upload,
    FileText,
    MessageSquare,
    Brain,
    Sparkles,
    ArrowRight,
    Play,
    Library,
    Webhook,
    FileUp,
    Eye,
    Bot,
    Zap,
    Target,
    Lightbulb,
    Users,
    Calendar,
    CheckCircle,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

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
        bgColor: "bg-blue-500/10",
        action: "Go to Projects",
        href: "/interface/projects"
    },
    {
        id: 2,
        title: "Create Project",
        description: "Start a new research project to organize your work",
        icon: Plus,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        action: "Create Project",
        href: "/interface/projects"
    },
    {
        id: 3,
        title: "Open Project",
        description: "Access your project workspace and tools",
        icon: Play,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        action: "Open Project",
        href: "/interface/projects"
    },
    {
        id: 4,
        title: "Go to Library",
        description: "Access the project library to manage papers",
        icon: Library,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        action: "View Library",
        href: "/interface/projects"
    },
    {
        id: 5,
        title: "Add Papers",
        description: "Search web or upload PDFs to add papers to your library",
        icon: Search,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        action: "Add Papers",
        href: "/interface/projects"
    },
    {
        id: 6,
        title: "Open Paper",
        description: "Select and open a paper for detailed analysis",
        icon: FileText,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        action: "Open Paper",
        href: "/interface/projects"
    },
    {
        id: 7,
        title: "Summarize",
        description: "Use AI to generate intelligent summaries and insights",
        icon: Brain,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        action: "Summarize",
        href: "/interface/projects"
    },
    {
        id: 8,
        title: "View PDF",
        description: "Read and annotate the full PDF document",
        icon: Eye,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        action: "View PDF",
        href: "/interface/projects"
    },
    {
        id: 9,
        title: "Chat",
        description: "Ask questions and get intelligent answers from your papers",
        icon: MessageSquare,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        action: "Start Chat",
        href: "/interface/projects"
    }
]

const features = [
    {
        icon: Brain,
        title: "AI-Powered Analysis",
        description: "Intelligent paper summarization and insight extraction"
    },
    {
        icon: MessageSquare,
        title: "Interactive Chat",
        description: "Ask questions and get answers from your research papers"
    },
    {
        icon: Users,
        title: "Collaboration",
        description: "Share projects and collaborate with research teams"
    },
    {
        icon: Target,
        title: "Research Focus",
        description: "Stay organized with project-based research management"
    },
    {
        icon: Calendar,
        title: "Progress Tracking",
        description: "Monitor your research progress and deadlines"
    },
    {
        icon: Sparkles,
        title: "Smart Insights",
        description: "Discover connections and patterns across your papers"
    }
]

export function HomeGuide() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const userData = getUserData()
        setUser(userData)
    }, [])

    const handleAction = (href: string) => {
        router.push(href)
    }

    const getGreeting = () => {
        if (user?.fullName) {
            return user.fullName
        }
        return "Scholar"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
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
                    <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-8">Research Workflow</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {workflowSteps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
                                    onClick={() => handleAction(step.href)}>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center", step.bgColor)}>
                                                <step.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", step.color)} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">Step {step.id}</Badge>
                                                </div>
                                                <h3 className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{step.description}</p>
                                        <Button
                                            className="w-full gradient-primary-to-accent text-white text-xs sm:text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAction(step.href)
                                            }}
                                        >
                                            {step.action}
                                            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Features Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-8">Powerful Features</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                                            <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        </div>
                                        <h3 className="font-semibold mb-2 text-sm sm:text-base">{feature.title}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="text-center mt-8 sm:mt-12"
                >
                    <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 max-w-2xl mx-auto">
                        <CardContent className="p-6 sm:p-8">
                            <Lightbulb className="h-8 w-8 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">Ready to Begin Your Research Journey?</h3>
                            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                                Follow the workflow above to start exploring, analyzing, and discovering insights with AI-powered research tools.
                            </p>
                            <Button
                                size="lg"
                                className="gradient-primary-to-accent text-white text-sm sm:text-base"
                                onClick={() => handleAction("/interface/projects")}
                            >
                                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                Start Research Workflow
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
} 