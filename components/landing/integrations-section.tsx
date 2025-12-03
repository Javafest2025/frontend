"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Globe,
    Database,
    FileText,
    Sparkles,
    Link,
    Zap,
    Shield,
    Search,
    Microscope,
    Brain,
    Network,
    Cpu,
    Dna
} from "lucide-react"

const integrations = [
    {
        name: "arXiv",
        description: "Open-access repository of electronic preprints",
        logo: "/api/placeholder/100/100",
        category: "Preprint Server",
        papers: "2.3M+",
        domains: ["Physics", "Mathematics", "+2"],
        color: "from-red-500/20 to-orange-500/20",
        iconColor: "text-red-500",
        icon: FileText,
        isPopular: true
    },
    {
        name: "PubMed",
        description: "Biomedical literature database",
        logo: "/api/placeholder/100/100",
        category: "Medical Database",
        papers: "34M+",
        domains: ["Medicine", "Life Sciences", "+2"],
        color: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-500",
        icon: Microscope,
        isPopular: true
    },
    {
        name: "IEEE Xplore",
        description: "Digital library for engineering and technology",
        logo: "/api/placeholder/100/100",
        category: "Engineering Database",
        papers: "5.5M+",
        domains: ["Engineering", "Computer Science", "+1"],
        color: "from-indigo-500/20 to-purple-500/20",
        iconColor: "text-indigo-500",
        icon: Zap,
        isPopular: true
    },
    {
        name: "Google Scholar",
        description: "Academic search engine and citation database",
        logo: "/api/placeholder/100/100",
        category: "Search Engine",
        papers: "400M+",
        domains: ["All Disciplines"],
        color: "from-green-500/20 to-emerald-500/20",
        iconColor: "text-green-500",
        icon: Search,
        isPopular: true
    },
    {
        name: "Semantic Scholar",
        description: "AI-powered academic search engine",
        logo: "/api/placeholder/100/100",
        category: "AI-Powered Search",
        papers: "200M+",
        domains: ["Computer Science", "Biomedicine", "+1"],
        color: "from-purple-500/20 to-pink-500/20",
        iconColor: "text-purple-500",
        icon: Brain,
        isPopular: true
    },
    {
        name: "CrossRef",
        description: "Citation linking and metadata registry",
        logo: "/api/placeholder/100/100",
        category: "Metadata Registry",
        papers: "140M+",
        domains: ["All Disciplines"],
        color: "from-yellow-500/20 to-orange-500/20",
        iconColor: "text-yellow-600",
        icon: Network,
        isPopular: false
    },
    {
        name: "DBLP",
        description: "Computer science bibliography",
        logo: "/api/placeholder/100/100",
        category: "CS Bibliography",
        papers: "6M+",
        domains: ["Computer Science"],
        color: "from-teal-500/20 to-cyan-500/20",
        iconColor: "text-teal-500",
        icon: Cpu,
        isPopular: false
    },
    {
        name: "bioRxiv",
        description: "Preprint server for biology",
        logo: "/api/placeholder/100/100",
        category: "Biology Preprints",
        papers: "200K+",
        domains: ["Biology", "Life Sciences"],
        color: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-500",
        icon: Dna,
        isPopular: false
    }
]

const features = [
    {
        icon: Zap,
        title: "Real-time Sync",
        description: "Instant access to the latest papers as they're published"
    },
    {
        icon: Shield,
        title: "Secure Access",
        description: "Enterprise-grade security with proper API authentication"
    },
    {
        icon: Database,
        title: "Unified Search",
        description: "Search across all databases with a single query"
    },
    {
        icon: Link,
        title: "Smart Deduplication",
        description: "Automatically removes duplicate papers across sources"
    }
]

export function IntegrationsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })

    return (
        <section id="integrations" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/30" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Integrations</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                        Connected to
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Every Source</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                        Access the world's largest academic databases and repositories through a unified,
                        intelligent search interface powered by AI.
                    </p>
                </motion.div>

                {/* Integration Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16"
                >
                    {[
                        { value: "500M+", label: "Papers Available", icon: FileText },
                        { value: "50+", label: "Data Sources", icon: Database },
                        { value: "100%", label: "Coverage", icon: Globe },
                        { value: "<1s", label: "Search Speed", icon: Zap }
                    ].map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-6 rounded-xl bg-gradient-to-br from-background/20 to-muted/10 border border-primary/30 hover:border-primary/50 transition-all duration-300 group backdrop-blur-md"
                            >
                                <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                                <div className="text-xl sm:text-2xl md:text-2xl font-bold text-primary mb-1">{stat.value}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* Integrations Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16"
                >
                    {integrations.map((integration, index) => {
                        const IconComponent = integration.icon
                        return (
                            <motion.div
                                key={integration.name}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1 + 0.8,
                                    ease: "easeOut"
                                }}
                                whileHover={{ y: -5 }}
                                className="group relative"
                            >
                                <Card className="h-full border-primary/30 bg-gradient-to-br from-background/20 to-muted/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden relative backdrop-blur-md">
                                    {integration.isPopular && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30">
                                                Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    <CardContent className="p-4 sm:p-5 md:p-6 relative z-10">
                                        {/* Logo placeholder with custom icon */}
                                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-background to-muted/50 border border-border/50 group-hover:border-primary/30 transition-colors">
                                            <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${integration.iconColor}`} />
                                        </div>

                                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                            {integration.name}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                                            {integration.description}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground/60">Papers:</span>
                                                <span className="font-semibold text-primary">{integration.papers}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground/60">
                                                <span className="font-medium">Category:</span> {integration.category}
                                            </div>
                                        </div>

                                        {/* Domains */}
                                        <div className="flex flex-wrap gap-1">
                                            {integration.domains.map((domain, domainIndex) => (
                                                <Badge
                                                    key={domainIndex}
                                                    variant="outline"
                                                    className="text-xs border-border/50 hover:border-primary/30 transition-colors"
                                                >
                                                    {domain}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>

                                    {/* Connection indicator */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.1 + 1 }}
                                        className="absolute bottom-3 right-3"
                                    >
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    </motion.div>

                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                        style={{ transform: "skewX(-20deg)" }}
                                    />
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* Features Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16"
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5, delay: index * 0.1 + 1.4 }}
                                whileHover={{ scale: 1.02 }}
                                className="text-center p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl bg-gradient-to-br from-background/20 to-muted/10 border border-primary/30 hover:border-primary/50 transition-all duration-300 group backdrop-blur-md"
                            >
                                <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                            </motion.div>
                        )
                    })}
                </motion.div>

            </div>
        </section>
    )
} 