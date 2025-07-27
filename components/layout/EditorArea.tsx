"use client"

import type React from "react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
    MessageSquare,
    X,
    Plus,
    ChevronDown,
    FileText,
    File,
    Image,
    Code,
    Search,
    Settings,
    Command,
    Brain,
    Zap,
    BookOpen,
    Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

type Props = {
    children: React.ReactNode
    onChatToggle: () => void
    onSidebarToggle?: () => void
    showMobileMenu?: boolean
}

export function EditorArea({ children, onChatToggle, onSidebarToggle, showMobileMenu }: Props) {
    const pathname = usePathname()
    const router = useRouter()

    // Get current page title based on route
    const getPageTitle = () => {
        if (pathname.includes('/home')) return 'Research Projects'
        if (pathname.includes('/projects/')) return 'Project Workspace'
        if (pathname.includes('/library')) return 'Paper Library'
        if (pathname.includes('/ai')) return 'AI Assistant'
        if (pathname.includes('/workflows')) return 'Workflows'
        if (pathname.includes('/search')) return 'Search'
        if (pathname.includes('/notifications')) return 'Notifications'
        if (pathname.includes('/settings')) return 'Settings'
        if (pathname.includes('/account')) return 'Account'
        return 'ScholarAI'
    }

    const getPageIcon = () => {
        if (pathname.includes('/home')) return <BookOpen className="h-4 w-4" />
        if (pathname.includes('/projects/')) return <Zap className="h-4 w-4" />
        if (pathname.includes('/library')) return <BookOpen className="h-4 w-4" />
        if (pathname.includes('/ai')) return <Brain className="h-4 w-4" />
        if (pathname.includes('/workflows')) return <Zap className="h-4 w-4" />
        if (pathname.includes('/search')) return <Search className="h-4 w-4" />
        if (pathname.includes('/notifications')) return <MessageSquare className="h-4 w-4" />
        if (pathname.includes('/settings')) return <Settings className="h-4 w-4" />
        if (pathname.includes('/account')) return <Settings className="h-4 w-4" />
        return <BookOpen className="h-4 w-4" />
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between h-14 px-4 sm:px-6 bg-background/80 backdrop-blur-xl border-b border-primary/15 relative z-10">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    {showMobileMenu && onSidebarToggle && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSidebarToggle}
                            className="h-8 w-8 p-0 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20 lg:hidden"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                    )}

                    <div className="flex items-center gap-2 text-foreground/80">
                        {getPageIcon()}
                        <h2 className="font-semibold text-base sm:text-lg truncate">{getPageTitle()}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Search Button - Hidden on mobile, shown on larger screens */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex h-8 px-3 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20"
                        onClick={() => {
                            // Quick search functionality
                            console.log("Quick search")
                        }}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        <span className="text-sm">Search</span>
                        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 font-mono text-[10px] font-medium text-primary">
                            ⌘K
                        </kbd>
                    </Button>

                    {/* Mobile Search Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="sm:hidden h-8 w-8 p-0 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20"
                        onClick={() => {
                            // Quick search functionality
                            console.log("Quick search")
                        }}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {/* Chat Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20"
                        onClick={onChatToggle}
                    >
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline text-sm">AI Chat</span>
                    </Button>

                    {/* Settings Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20"
                        onClick={() => router.push('/interface/settings')}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-y-auto">
                {children}
            </div>
        </div>
    )
} 