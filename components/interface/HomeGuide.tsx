"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { getUserData } from "@/lib/api/user-service"
import { ProjectCreateDialog } from "@/components/interface/ProjectCreateDialog"
import {
    BookOpen,
    Brain,
    MessageSquare,
    Download,
    Edit3,
    Quote,
    Clipboard,
    Users,
    Calendar,
    Target,
    Sparkles,
    CheckCircle,
    Star,
    FolderPlus,
    Library
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
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const userData = getUserData()
        setUser(userData)
    }, [])

    const getGreeting = () => {
        if (user?.fullName) {
            return user.fullName
        }
        return "Scholar"
    }

    const handleCreateProject = () => {
        setShowCreateDialog(true)
    }

    const handleBrowseProjects = () => {
        router.push('/interface/projects')
    }

    const handleProjectCreated = () => {
        setShowCreateDialog(false)
        router.push('/interface/projects')
    }

    return (
        <div className="w-full bg-gradient-to-br from-background via-background/95 to-primary/5 relative">
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

                {/* Quick Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12 sm:mb-16"
                >
                    <div className="flex items-center justify-center mb-6 sm:mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
                        <div className="flex items-center gap-3 mx-4">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-center">Get Started</h2>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/30" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                        {/* Create New Project Button */}
                        <motion.button
                            onClick={handleCreateProject}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative group"
                        >
                            <Card className="bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-blue-600/20 backdrop-blur-xl border border-blue-400/40 hover:border-blue-400/60 shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 h-full cursor-pointer overflow-hidden">
                                {/* Shimmer effect on hover */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: `linear-gradient(45deg, transparent 30%, rgba(96, 165, 250, 0.3) 50%, transparent 70%)`,
                                        animation: "shimmer 1.5s ease-in-out infinite"
                                    }}
                                />
                                
                                <CardContent className="p-6 sm:p-8 relative z-10">
                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:shadow-xl shadow-blue-500/40"
                                        >
                                            <FolderPlus className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-500" />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-blue-100 group-hover:text-blue-50 transition-colors duration-300">
                                                Create New Project
                                            </h3>
                                            <p className="text-sm sm:text-base text-blue-200/80 group-hover:text-blue-100/90 transition-colors duration-300">
                                                Start a new research project and organize your academic work
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.button>

                        {/* Browse Projects Button */}
                        <motion.button
                            onClick={handleBrowseProjects}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative group"
                        >
                            <Card className="bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-purple-600/20 backdrop-blur-xl border border-purple-400/40 hover:border-purple-400/60 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 h-full cursor-pointer overflow-hidden">
                                {/* Shimmer effect on hover */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: `linear-gradient(45deg, transparent 30%, rgba(167, 139, 250, 0.3) 50%, transparent 70%)`,
                                        animation: "shimmer 1.5s ease-in-out infinite"
                                    }}
                                />
                                
                                <CardContent className="p-6 sm:p-8 relative z-10">
                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:shadow-xl shadow-purple-500/40"
                                        >
                                            <Library className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-500" />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-purple-100 group-hover:text-purple-50 transition-colors duration-300">
                                                Browse Projects
                                            </h3>
                                            <p className="text-sm sm:text-base text-purple-200/80 group-hover:text-purple-100/90 transition-colors duration-300">
                                                View and manage all your existing research projects
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.button>
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

            {/* Create Project Dialog */}
            <ProjectCreateDialog 
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onProjectCreated={handleProjectCreated}
            />
        </div>
    )
}
