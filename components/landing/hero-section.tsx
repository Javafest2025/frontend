"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Sparkles, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { HeroBackground } from "./hero-background"

export function HeroSection() {
    const [text, setText] = useState("")
    const fullText = "Accelerate Your Research Journey"

    useEffect(() => {
        let i = 0
        const timer = setInterval(() => {
            setText(fullText.slice(0, i))
            i++
            if (i > fullText.length) {
                clearInterval(timer)
            }
        }, 100)

        return () => clearInterval(timer)
    }, [])

    return (
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
            <HeroBackground />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <div className="inline-flex items-center px-3 sm:px-5 py-2 rounded-full relative overflow-hidden shadow-lg backdrop-blur-md border border-primary/30 bg-gradient-to-r from-primary/20 via-background/40 to-purple-500/20">
                            <span className="relative z-10 flex items-center justify-center mr-2">
                                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary drop-shadow-glow" />
                            </span>
                            <span className="relative z-10 font-bold text-xs sm:text-base lg:text-lg tracking-wide bg-gradient-to-r from-primary via-foreground to-purple-400 bg-clip-text text-transparent drop-shadow-md">
                                AI-Powered Research Assistant
                            </span>
                        </div>
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 lg:mb-8 px-2">
                        <span className="block leading-tight">{text}</span>
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient block">
                            {text.length === fullText.length && <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                with AI
                            </motion.span>}
                        </span>
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mx-auto mt-4 sm:mt-6 max-w-2xl sm:max-w-3xl lg:max-w-4xl"
                    >
                        <div className="relative">
                            {/* Enhanced background with multiple layers for better contrast */}
                            <div className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-xl border-2 border-primary/30 shadow-2xl shadow-primary/20 -z-10" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-background/60 via-background/40 to-background/60 -z-10" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 -z-10" />

                            <p className="relative z-10 font-sans font-medium text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-foreground drop-shadow-lg tracking-wide px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6">
                                Transform how you <span className="font-semibold text-primary/90">discover</span>, <span className="font-semibold text-purple-400/90">analyze</span>, and <span className="font-semibold text-blue-400/90">synthesize</span> academic papers with our intelligent AI agents. From automated paper retrieval to gap analysis and contextual Q&amp;A.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xl mx-auto"
                    >
                        <div className="flex-1 min-w-[180px] w-full sm:w-auto">
                            <Link href="/login">
                                <Button
                                    size="lg"
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white border-0 shadow-2xl shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-105 font-semibold text-base sm:text-lg tracking-wide backdrop-blur-md"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        Start Researching
                                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 min-w-[180px] w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full group border-primary/30 bg-background/60 backdrop-blur-md hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 font-semibold text-base sm:text-lg tracking-wide"
                            >
                                <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                                Watch Demo
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.8 }}
                        className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-2xl mx-auto px-4"
                    >
                        {[
                            { value: "50K+", label: "Papers Analyzed", icon: <svg className='w-4 h-4 sm:w-5 sm:h-5 text-primary' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' /><path d='M6 17V5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v12' /></svg> },
                            { value: "10x", label: "Faster Research", icon: <svg className='w-4 h-4 sm:w-5 sm:h-5 text-primary' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M13 2v8h8' /><path d='M21 21a16 16 0 1 1-8-19' /></svg> },
                            { value: "1000+", label: "Researchers", icon: <svg className='w-4 h-4 sm:w-5 sm:h-5 text-primary' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><circle cx='12' cy='7' r='4' /><path d='M5.5 21a7.5 7.5 0 0 1 13 0' /></svg> }
                        ].map((metric, index) => (
                            <motion.div
                                key={index}
                                whileHover={{
                                    scale: 1.07,
                                    boxShadow: "0 8px 40px 0 rgba(99,102,241,0.25)",
                                    borderColor: "#6366f1"
                                }}
                                className="relative text-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 group overflow-hidden"
                            >
                                {/* Enhanced background with multiple layers for better contrast */}
                                <div className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-xl border-2 border-primary/30 shadow-2xl shadow-primary/20 -z-10" />
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-background/60 via-background/40 to-background/60 -z-10" />
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 -z-10" />

                                <span className="relative z-10 flex justify-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                    {metric.icon}
                                </span>
                                <div className="relative z-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight mb-1">
                                    {metric.value}
                                </div>
                                <div className="relative z-10 text-xs sm:text-sm md:text-base lg:text-lg font-medium text-muted-foreground tracking-wide">
                                    {metric.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
} 