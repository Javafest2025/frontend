"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
    Search,
    FileText,
    BarChart3,
    Target,
    MessageSquare,
    Clock,
    CheckCircle,
    Brain,
    Sparkles,
    FileCode,
    BookOpen,
    Layers
} from "lucide-react"

const features = [
    {
        icon: Search,
        title: "Automated Paper Retrieval",
        description: "WebSearch Agent finds and downloads relevant papers from multiple academic databases",
        highlights: [
            "Multi-source academic search",
            "Automatic PDF downloads",
            "Duplicate detection",
            "Smart filtering"
        ],
        gradient: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-500"
    },
    {
        icon: FileText,
        title: "Smart Summarization",
        description: "Scraper & Summarizer Agents extract key insights and generate structured summaries",
        highlights: [
            "Multi-level summaries",
            "Structured fact extraction",
            "Key metrics tables",
            "Visual abstracts"
        ],
        gradient: "from-green-500/20 to-emerald-500/20",
        iconColor: "text-green-500"
    },
    {
        icon: BarChart3,
        title: "Intelligent Scoring",
        description: "Critic Agent evaluates papers based on impact, relevance, and quality metrics",
        highlights: [
            "Citation-based ranking",
            "Venue prestige analysis",
            "Relevance scoring",
            "Impact prediction"
        ],
        gradient: "from-purple-500/20 to-violet-500/20",
        iconColor: "text-purple-500"
    },
    {
        icon: Target,
        title: "Research Gap Analysis",
        description: "Gap Analysis Agent identifies research opportunities and suggests novel topics",
        highlights: [
            "Automated gap detection",
            "Topic suggestions",
            "Opportunity scoring",
            "Trend analysis"
        ],
        gradient: "from-orange-500/20 to-red-500/20",
        iconColor: "text-orange-500"
    },
    {
        icon: MessageSquare,
        title: "Contextual Q&A",
        description: "QA Agent provides instant answers based on your selected documents",
        highlights: [
            "Document-grounded answers",
            "Multi-paper context",
            "Citation tracking",
            "Interactive chat"
        ],
        gradient: "from-indigo-500/20 to-blue-500/20",
        iconColor: "text-indigo-500"
    },
    {
        icon: Clock,
        title: "Project Management",
        description: "Organize research with task checklists, reminders, and progress tracking",
        highlights: [
            "Reading progress tracking",
            "Calendar integration",
            "Smart reminders",
            "Team collaboration"
        ],
        gradient: "from-pink-500/20 to-rose-500/20",
        iconColor: "text-pink-500"
    },
    {
        icon: FileCode,
        title: "AI Integrated LaTeX Editor",
        description: "Advanced LaTeX editor with AI-powered assistance for academic writing and formatting",
        highlights: [
            "Real-time LaTeX compilation",
            "AI writing suggestions",
            "Template library",
            "Collaborative editing"
        ],
        gradient: "from-teal-500/20 to-cyan-500/20",
        iconColor: "text-teal-500"
    },
    {
        icon: BookOpen,
        title: "Smart Citation Manager",
        description: "Intelligent citation management with automatic formatting and reference tracking",
        highlights: [
            "Auto-citation detection",
            "Multiple format support",
            "Reference validation",
            "Bibliography generation"
        ],
        gradient: "from-amber-500/20 to-yellow-500/20",
        iconColor: "text-amber-500"
    },
    {
        icon: Layers,
        title: "Integrated Research Environment",
        description: "Unified workspace combining all research tools in one seamless platform",
        highlights: [
            "Multi-tool integration",
            "Workflow automation",
            "Data synchronization",
            "Cross-platform access"
        ],
        gradient: "from-slate-500/20 to-gray-500/20",
        iconColor: "text-slate-500"
    }
]

export function FeaturesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })

    return (
        <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-muted/30 to-background" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Features</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                        Intelligent Research
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Workflow</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                        Our AI agents work together to streamline every aspect of your research process,
                        from discovery to analysis and insight generation.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    ease: "easeOut"
                                }}
                                whileHover={{ y: -8 }}
                                className="group"
                            >
                                <Card className="h-full border-primary/30 bg-gradient-to-br from-background/20 to-muted/10 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative backdrop-blur-md">
                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    <CardHeader className="relative z-10">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} border border-border/50`}
                                            >
                                                <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                                            </motion.div>
                                            <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                                                {feature.title}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-300">
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="relative z-10">
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            whileHover={{ height: "auto", opacity: 1 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 space-y-3">
                                                {feature.highlights.map((highlight, highlightIndex) => (
                                                    <motion.div
                                                        key={highlightIndex}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        whileHover={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: highlightIndex * 0.05 }}
                                                        className="flex items-center text-sm"
                                                    >
                                                        <CheckCircle className="mr-3 h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-muted-foreground">{highlight}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>

                                    </CardContent>

                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                        style={{ transform: "skewX(-20deg)" }}
                                    />
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>

                {/* AI Brain visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-20 text-center"
                >
                    <div className="relative inline-block">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 mx-auto mb-6 relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl" />
                            <Brain className="w-full h-full text-primary relative z-10" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-foreground mb-4">
                            Powered by Advanced AI
                        </h3>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Multiple specialized agents working in harmony to accelerate your research workflow
                            and unlock insights you never thought possible.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
} 