"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Brain, ArrowRight, Menu, X, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"

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
        const element = document.querySelector(href)
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }
        setIsMobileMenuOpen(false)
    }

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
                ? "bg-background/70 backdrop-blur-2xl border-b border-primary/20 shadow-2xl shadow-primary/5"
                : "bg-transparent"
                }`}
        >
            {/* Animated background gradient */}
            {isScrolled && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5"
                />
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex h-16 items-center justify-between">
                    {/* Enhanced Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-3 group cursor-pointer"
                        onClick={() => handleNavClick('#hero')}
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2, repeat: Infinity }
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-full blur-md"
                            />
                            <Brain className="h-8 w-8 text-primary relative z-10 group-hover:text-purple-400 transition-colors duration-300" />
                        </div>
                        <div className="relative">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent group-hover:from-purple-400 group-hover:via-primary group-hover:to-purple-400 transition-all duration-300">
                                ScholarAI
                            </span>
                            {/* Animated underline */}
                            <motion.div
                                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                initial={{ width: 0 }}
                                whileHover={{ width: "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.href}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                                onClick={() => handleNavClick(item.href)}
                                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${activeSection === item.id
                                    ? 'text-primary bg-primary/10 border border-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                                    }`}
                            >
                                {item.label}

                                {/* Hover effect background */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    layoutId="navbar-hover"
                                />

                                {/* Active indicator */}
                                {activeSection === item.id && (
                                    <motion.div
                                        layoutId="navbar-active"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl border border-primary/30"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                {/* Sparkle effect on hover */}
                                <motion.div
                                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="h-3 w-3 text-primary/60" />
                                </motion.div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Enhanced Desktop CTA */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Button
                            onClick={() => navigateWithLoading("/login", "Preparing login interface...")}
                            className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border-0 shadow-2xl shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>

                            {/* Animated shine effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                                animate={{ translateX: ["0%", "200%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Hover glow */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100"
                                transition={{ duration: 0.3 }}
                            />
                        </Button>
                    </div>

                    {/* Enhanced Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300"
                        >
                            <motion.div
                                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </motion.div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Enhanced Mobile Menu */}
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
                            {navItems.map((item, index) => (
                                <motion.button
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleNavClick(item.href)}
                                    className={`block w-full text-left py-3 px-4 rounded-xl transition-all duration-300 ${activeSection === item.id
                                        ? 'text-primary bg-primary/10 border border-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        {item.label}
                                        {activeSection === item.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 bg-primary rounded-full"
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            ))}

                            <div className="pt-4 space-y-3 border-t border-primary/20">
                                <Button
                                    onClick={() => navigateWithLoading("/login", "Preparing login interface...")}
                                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/25"
                                >
                                    <span className="flex items-center justify-center">
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
} 