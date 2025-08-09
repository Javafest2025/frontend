"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Brain, ArrowRight, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeSection, setActiveSection] = useState("")
    const { navigateWithLoading } = useNavigationWithLoading()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)

            // Update active section based on scroll position
            const sections = ['hero', 'features', 'workflow', 'testimonials', 'integrations']
            const scrollPosition = window.scrollY + 100

            for (const section of sections) {
                const element = document.getElementById(section)
                if (element) {
                    const offsetTop = element.offsetTop
                    const offsetHeight = element.offsetHeight

                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section)
                        break
                    }
                }
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems = [
        { href: "#features", label: "Features", id: "features" },
        { href: "#workflow", label: "Workflow", id: "workflow" },
        { href: "#testimonials", label: "Testimonials", id: "testimonials" },
        { href: "#integrations", label: "Integrations", id: "integrations" },
        { href: "#pricing", label: "Pricing", id: "pricing" },
    ]

    const handleNavClick = (href: string) => {
        setIsMobileMenuOpen(false)
        const element = document.querySelector(href)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-background/95 backdrop-blur-xl border-b border-primary/30 shadow-xl"
                : "bg-background/90 backdrop-blur-lg border-b border-primary/20 shadow-lg"
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
                        onClick={() => navigateWithLoading("/")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                                <motion.div
                                    className="absolute inset-0 h-8 w-8 sm:h-10 sm:w-10 bg-primary/20 rounded-full blur-md"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                    ScholarAI
                                </span>
                                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Research Assistant</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navItems.map((item) => (
                            <motion.button
                                key={item.id}
                                whileHover={{ y: -2 }}
                                className={`text-sm lg:text-base font-medium transition-all duration-300 relative group ${activeSection === item.id
                                    ? "text-primary"
                                    : "text-foreground/80 hover:text-foreground"
                                    }`}
                                onClick={() => handleNavClick(item.href)}
                            >
                                {item.label}
                                {activeSection === item.id && (
                                    <motion.div
                                        layoutId="activeSection"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                    />
                                )}
                                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                            </motion.button>
                        ))}
                    </div>

                    {/* Desktop CTA Button */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        <Button
                            size="sm"
                            className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white border-0 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-105 px-6"
                            onClick={() => navigateWithLoading("/login")}
                        >
                            <span className="relative z-10 flex items-center justify-center font-semibold">
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                transition={{ duration: 0.3 }}
                            />
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 h-9 w-9 p-0"
                        >
                            <motion.div
                                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            </motion.div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-primary/20 overflow-hidden"
                    >
                        {/* Mobile background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

                        <div className="container mx-auto px-4 py-6 space-y-4 relative">
                            {/* Mobile Navigation Items */}
                            <div className="space-y-2">
                                {navItems.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        whileHover={{ x: 4 }}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${activeSection === item.id
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-foreground/80 hover:text-foreground hover:bg-primary/5"
                                            }`}
                                        onClick={() => handleNavClick(item.href)}
                                    >
                                        {item.label}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Mobile CTA Button */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-primary/20">
                                <div className="flex justify-center">
                                    <ThemeToggle />
                                </div>
                                <Button
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white border-0 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false)
                                        navigateWithLoading("/login")
                                    }}
                                >
                                    <span className="relative z-10 flex items-center justify-center font-semibold">
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                        transition={{ duration: 0.3 }}
                                    />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
} 