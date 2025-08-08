"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/context/ThemeContext"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="relative w-10 h-10 rounded-lg border border-primary/20 bg-background/20 backdrop-blur-md shadow-lg"
            >
                <div className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-lg border border-primary/20 bg-background/20 backdrop-blur-md hover:bg-primary/20 transition-all duration-300 group shadow-lg"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="relative"
            >
                {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                ) : (
                    <Moon className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                )}
            </motion.div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
        </Button>
    )
}
