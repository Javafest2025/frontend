"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import {
    Brain,
    Mail,
    Github,
    Twitter,
    Linkedin,
    Youtube,
    Send,
    ArrowRight,
    MapPin,
    Phone,
    Sparkles
} from "lucide-react"

const footerLinks = {
    product: [
        { label: "Features", href: "#features" },
        { label: "Workflow", href: "#workflow" },
        { label: "Integrations", href: "#integrations" },
        { label: "API", href: "#api" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#changelog" }
    ],
    company: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#blog" },
        { label: "Careers", href: "#careers" },
        { label: "Press", href: "#press" },
        { label: "Partners", href: "#partners" },
        { label: "Contact", href: "#contact" }
    ],
    resources: [
        { label: "Documentation", href: "#docs" },
        { label: "Help Center", href: "#help" },
        { label: "Community", href: "#community" },
        { label: "Research Blog", href: "#research" },
        { label: "Case Studies", href: "#cases" },
        { label: "Webinars", href: "#webinars" }
    ],
    legal: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "Cookie Policy", href: "#cookies" },
        { label: "Security", href: "#security" },
        { label: "GDPR", href: "#gdpr" },
        { label: "Data Processing", href: "#data" }
    ]
}

const socialLinks = [
    {
        icon: Twitter,
        label: "Twitter",
        href: "#twitter",
        color: "hover:text-blue-400",
        bgColor: "hover:bg-blue-400/10"
    },
    {
        icon: Linkedin,
        label: "LinkedIn",
        href: "#linkedin",
        color: "hover:text-blue-600",
        bgColor: "hover:bg-blue-600/10"
    },
    {
        icon: Github,
        label: "GitHub",
        href: "#github",
        color: "hover:text-gray-400",
        bgColor: "hover:bg-gray-400/10"
    },
    {
        icon: Youtube,
        label: "YouTube",
        href: "#youtube",
        color: "hover:text-red-500",
        bgColor: "hover:bg-red-500/10"
    }
]

export function Footer() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.1 })
    const [email, setEmail] = useState("")
    const [isSubscribed, setIsSubscribed] = useState(false)

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (email) {
            // Visual-only subscription - no backend call
            setIsSubscribed(true)
            setEmail("")
            // Keep subscribed state for longer to show the feedback
            setTimeout(() => setIsSubscribed(false), 5000)
        }
    }

    return (
        <footer className="relative overflow-hidden bg-gradient-to-b from-muted/30 to-background border-t border-primary/30" ref={ref}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-grid-pattern" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Newsletter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="py-16"
                >
                    <Card className="max-w-4xl mx-auto border-primary/30 bg-gradient-to-br from-background/20 to-muted/10 overflow-hidden backdrop-blur-md">
                        <CardContent className="p-8 lg:p-12">
                            <div className="text-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="flex items-center justify-center mb-6"
                                >
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
                                        <Mail className="h-8 w-8 text-primary" />
                                    </div>
                                </motion.div>

                                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                                    Stay Updated on Our Upcoming Products
                                </h3>

                                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                                    Be the first to know about our latest research tools, AI-powered features, and innovative solutions designed specifically for researchers. Get early access and exclusive updates delivered to your inbox.
                                </p>

                                <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
                                    <div className="flex gap-3">
                                        <Input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSubscribed}
                                            className={`whitespace-nowrap transition-all duration-300 ${isSubscribed
                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                                : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                                                }`}
                                        >
                                            {isSubscribed ? (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                                    Subscribed!
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Subscribe
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Get exclusive early access to new features. No spam, unsubscribe anytime.
                                    </p>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Footer Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="py-16"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-12">
                        {/* Brand Section */}
                        <div className="lg:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <Brain className="h-10 w-10 text-primary" />
                                        <motion.div
                                            className="absolute inset-0 h-10 w-10 bg-primary/20 rounded-full blur-md"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    </div>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                        ScholarAI
                                    </span>
                                </div>

                                <p className="text-muted-foreground leading-relaxed">
                                    Accelerating research with AI-powered tools that help academics discover,
                                    analyze, and synthesize knowledge faster than ever before.
                                </p>

                                {/* Contact Info */}
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span>ECE Building, BUET</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span>+8801842686804</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span>trisn.eclipse@gmail.com</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="flex space-x-3">
                                    {socialLinks.map((social, index) => {
                                        const Icon = social.icon
                                        return (
                                            <motion.a
                                                key={social.label}
                                                href={social.href}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.4, delay: index * 0.1 + 0.8 }}
                                                whileHover={{ scale: 1.1 }}
                                                className={`p-3 rounded-xl bg-background/20 border border-primary/30 ${social.color} ${social.bgColor} transition-all duration-300 hover:border-primary/50 group backdrop-blur-md`}
                                                aria-label={social.label}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </motion.a>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation Links */}
                        {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.6, delay: categoryIndex * 0.1 + 0.8 }}
                                className="space-y-4"
                            >
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </h4>
                                <ul className="space-y-3">
                                    {links.map((link, linkIndex) => (
                                        <motion.li
                                            key={link.label}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4, delay: linkIndex * 0.05 + categoryIndex * 0.1 + 1 }}
                                        >
                                            <Link
                                                href={link.href}
                                                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group"
                                            >
                                                {link.label}
                                                <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                                            </Link>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="border-t border-border/50 py-8"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span>© 2025 ScholarAI. All rights reserved.</span>
                            <span className="hidden md:block">•</span>
                            <span className="hidden md:block">Accelerating research with AI</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                            <Link
                                href="#status"
                                className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center"
                            >
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                                All systems operational
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">Made with ❤️ for researchers</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    )
} 