"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Search,
    Plus,
    Bell,
    User,
    Settings,
    Moon,
    Sun,
    LogOut,
    ChevronRight,
    Home,
    FileText,
    CheckSquare,
    Bot,
    Brain,
    MessageSquare,
    Send,
    X,
    RefreshCw
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getUserData, isAuthenticated } from "@/lib/api/user-service/auth"
import { accountApi } from "@/lib/api/user-service"
import { scholarbotApi } from "@/lib/api/project-service/scholarbot"
import { notificationsApi } from "@/lib/api/notification-service/notifications"
import { UserAccount } from "@/types/account"
import { cn } from "@/lib/utils/cn"
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip"
import { useSettings } from "@/contexts/SettingsContext"

interface BreadcrumbItem {
    label: string
    href?: string
    fullLabel?: string // For tooltip on truncated items
}

const getBreadcrumbs = async (pathname: string): Promise<BreadcrumbItem[]> => {
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
        return [{ label: 'Home' }]
    }

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ''

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        currentPath += `/${segment}`

        // Map segment to readable label
        let label = segment.charAt(0).toUpperCase() + segment.slice(1)
        let fullLabel = label

        // Special cases for better labels
        if (segment === 'interface') {
            label = 'Dashboard'
            fullLabel = 'Dashboard'
        } else if (segment === 'account') {
            label = 'Account'
            fullLabel = 'Account'
        } else if (segment === 'projects') {
            label = 'Projects'
            fullLabel = 'Projects'
        } else if (segment === 'todo') {
            label = 'ToDo'
            fullLabel = 'ToDo'
        } else if (segment === 'overview') {
            label = 'Overview'
            fullLabel = 'Overview'
        } else if (segment === 'collect-papers') {
            label = 'Collect Papers'
            fullLabel = 'Collect Papers'
        } else if (segment === 'reading-list') {
            label = 'Reading List'
            fullLabel = 'Reading List'
        } else if (segment === 'notes') {
            label = 'Notes'
            fullLabel = 'Notes'
        } else if (segment === 'latex-editor') {
            label = 'LaTeX Editor'
            fullLabel = 'LaTeX Editor'
        } else if (segment === 'collaboration') {
            label = 'Collaboration'
            fullLabel = 'Collaboration'
        } else if (segment === 'library') {
            label = 'Library'
            fullLabel = 'Library'
        } else if (segment === 'settings') {
            label = 'Settings'
            fullLabel = 'Settings'
        } else if (segment === 'analytics') {
            label = 'Analytics'
            fullLabel = 'Analytics'
        } else if (segment === 'insights') {
            label = 'Insights'
            fullLabel = 'Insights'
        } else if (segment === 'tasks') {
            label = 'Tasks'
            fullLabel = 'Tasks'
        } else if (segment === 'notifications') {
            label = 'Notifications'
            fullLabel = 'Notifications'
        } else if (segment === 'agents') {
            label = 'Agents'
            fullLabel = 'Agents'
        } else if (segment === 'workflows') {
            label = 'Workflows'
            fullLabel = 'Workflows'
        } else if (segment === 'search') {
            label = 'Search'
            fullLabel = 'Search'
        } else if (segment === 'ai') {
            label = 'AI'
            fullLabel = 'AI'
        } else if (segment === 'authors') {
            label = 'Authors'
            fullLabel = 'Authors'
        } else if (segment === 'dashboard') {
            label = 'Dashboard'
            fullLabel = 'Dashboard'
        } else if (segment === 'home') {
            label = 'Home'
            fullLabel = 'Home'
        } else {
            // Check if this is a UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (uuidRegex.test(segment)) {
                // Determine if this UUID should be treated as a project ID based on URL context
                const isProjectContext = i > 0 && segments[i - 1] === 'projects'
                const isPaperContext = i > 2 && segments[i - 1] === 'library' && segments[i - 2] !== undefined

                if (isProjectContext && !isPaperContext) {
                    // This is a project ID - try to fetch project name
                    try {
                        const { projectsApi } = await import('@/lib/api/project-service')
                        const project = await projectsApi.getProject(segment, true) // silent = true
                        label = project.name
                        fullLabel = project.name
                    } catch (error) {
                        // Fallback to truncated ID if API fails (silently handle for breadcrumbs)
                        label = `${segment.substring(0, 8)}...`
                        fullLabel = segment
                    }
                } else if (isPaperContext) {
                    // This is a paper ID - just show truncated ID
                    label = `${segment.substring(0, 8)}...`
                    fullLabel = segment
                } else {
                    // Unknown context - show truncated ID
                    label = `${segment.substring(0, 8)}...`
                    fullLabel = segment
                }
            }
        }

        breadcrumbs.push({
            label,
            fullLabel,
            href: i === segments.length - 1 ? undefined : currentPath
        })
    }

    return breadcrumbs
}

const getPageIcon = (pathname: string) => {
    if (pathname.includes('/settings')) return Settings
    if (pathname.includes('/account')) return User
    if (pathname.includes('/projects')) return FileText
    if (pathname.includes('/todo')) return CheckSquare
    if (pathname.includes('/notifications')) return Bell
    return Home
}

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const userData = getUserData()
    const { settings, updateSetting } = useSettings()

    const [searchQuery, setSearchQuery] = useState("")
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [notificationCount, setNotificationCount] = useState(0)
    const [accountData, setAccountData] = useState<UserAccount | null>(null)
    const [showScholarBot, setShowScholarBot] = useState(false)
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
    const [chatMessages, setChatMessages] = useState<Array<{ id: string, type: 'user' | 'bot', content: string, timestamp: Date }>>([
        {
            id: '1',
            type: 'bot',
            content: "Welcome back! I'm ScholarBot — your AI Research Assistant.\nI can help you track progress, organize tasks, manage notes, and explore any questions you have for your projects\n\nTry asking:\n• \"Summarize todos due this week\"\n• \"Create a todo for submitting the draft\"\n• \"Search papers on protein folding\"\n\nWhat would you like to work on right now?",
            timestamp: new Date()
        }
    ])
    const [chatInput, setChatInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)

    // Add drag functionality for chat interface
    const chatPanelRef = useRef<HTMLDivElement>(null)
    const [chatWidth, setChatWidth] = useState(384) // Default width (w-96 = 384px)
    const [isDragging, setIsDragging] = useState(false)

    // Handle mouse dragging for resizing the chat interface
    const handleChatMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("Mouse down on resize handle")
        setIsDragging(true)
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            console.log("Mouse move, dragging:", isDragging, "clientX:", e.clientX)

            // Calculate new width based on mouse position
            const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX))
            setChatWidth(newWidth)

            if (chatPanelRef.current) {
                document.body.style.cursor = "ew-resize"
            }
        }

        const handleMouseUp = () => {
            console.log("Mouse up, stopping drag")
            setIsDragging(false)
            document.body.style.cursor = ""
        }

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
        }
    }, [isDragging])

    // Fetch account data and notification count
    useEffect(() => {
        const loadAccountData = async () => {
            try {
                const account = await accountApi.getAccount()
                setAccountData(account)
            } catch (error) {
                console.error("Failed to load account data for header:", error)
            }
        }

        const loadNotificationCount = async () => {
            try {
                const count = await notificationsApi.getNotificationCount()
                setNotificationCount(count)
            } catch (error) {
                console.error("Failed to load notification count:", error)
            }
        }

        loadAccountData()
        loadNotificationCount()

        // Refresh notification count every 30 seconds
        const interval = setInterval(loadNotificationCount, 30000)
        return () => clearInterval(interval)
    }, [])

    const PageIcon = getPageIcon(pathname)

    // Load breadcrumbs when pathname changes
    useEffect(() => {
        const loadBreadcrumbs = async () => {
            try {
                const breadcrumbData = await getBreadcrumbs(pathname)
                setBreadcrumbs(breadcrumbData)
            } catch (error) {
                console.error('Error loading breadcrumbs:', error)
                // Fallback to basic breadcrumbs
                const segments = pathname.split('/').filter(Boolean)
                const fallbackBreadcrumbs = segments.map((segment, index) => ({
                    label: segment.charAt(0).toUpperCase() + segment.slice(1),
                    fullLabel: segment.charAt(0).toUpperCase() + segment.slice(1)
                }))
                setBreadcrumbs(fallbackBreadcrumbs)
            }
        }
        loadBreadcrumbs()
    }, [pathname])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            // TODO: Implement global search functionality
            console.log("Searching for:", searchQuery)
        }
    }

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'project':
                router.push('/interface/projects')
                break
            case 'todo':
                router.push('/interface/todo')
                break
            default:
                break
        }
    }

    const handleLogout = () => {
        // TODO: Implement logout functionality
        console.log("Logging out...")
    }

    const toggleTheme = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
        updateSetting('theme', newTheme)
    }

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return

        const userMessage = {
            id: Date.now().toString(),
            type: 'user' as const,
            content: chatInput.trim(),
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, userMessage])
        const messageToSend = chatInput.trim()
        setChatInput("")
        setIsTyping(true)

        try {
            console.log("🤖 Sending message to ScholarBot:", messageToSend)
            console.log("🔐 User authenticated:", isAuthenticated())
            console.log("👤 User data:", getUserData())

            // Call the real ScholarBot API
            const response = await scholarbotApi.sendMessage(messageToSend)

            console.log("✅ ScholarBot response:", response)

            const botResponse = {
                id: (Date.now() + 1).toString(),
                type: 'bot' as const,
                content: response.message || "I received your message but couldn't process it properly. Please try again.",
                timestamp: new Date()
            }

            setChatMessages(prev => [...prev, botResponse])
        } catch (error) {
            console.error("❌ ScholarBot API error:", error)

            const errorResponse = {
                id: (Date.now() + 1).toString(),
                type: 'bot' as const,
                content: "Sorry, I'm having trouble connecting to my services right now. Please try again later or check your connection.",
                timestamp: new Date()
            }

            setChatMessages(prev => [...prev, errorResponse])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleRefreshChat = () => {
        setChatMessages([
            {
                id: '1',
                type: 'bot',
                content: "Welcome back! I'm ScholarBot — your AI Research Assistant.\nI can help you track progress, organize tasks, manage notes, and explore any questions you have for your projects\n\nTry asking:\n• \"Summarize todos due this week\"\n• \"Create a todo for submitting the draft\"\n• \"Search papers on protein folding\"\n\nWhat would you like to work on right now?",
                timestamp: new Date()
            }
        ])
        setChatInput("")
        setIsTyping(false)
    }

    return (
        <>
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Left Section - Breadcrumbs */}
                    <div className="flex items-center space-x-2">
                        <nav className="flex items-center space-x-1 text-sm">
                            {breadcrumbs.map((crumb, index) => (
                                <div key={index} className="flex items-center">
                                    {index > 0 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                                    )}
                                    {crumb.href ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(crumb.href!)}
                                            className="h-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {crumb.label}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center space-x-2 px-2 py-1">
                                            <PageIcon className="h-4 w-4 text-primary" />
                                            <EnhancedTooltip
                                                content={crumb.fullLabel && crumb.fullLabel !== crumb.label ? crumb.fullLabel : ""}
                                                side="bottom"
                                            >
                                                <span className="font-medium text-foreground max-w-32 truncate">
                                                    {crumb.label}
                                                </span>
                                            </EnhancedTooltip>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Center Section - Global Search */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearch} className="relative">
                            <EnhancedTooltip content="Global search - Find projects, papers, todos, and more">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search projects, papers, todos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className={cn(
                                            "pl-10 pr-4 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300",
                                            isSearchFocused && "ring-2 ring-primary/20 border-primary/50"
                                        )}
                                    />
                                    {searchQuery && (
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 bg-primary hover:bg-primary/90"
                                        >
                                            Search
                                        </Button>
                                    )}
                                </div>
                            </EnhancedTooltip>
                        </form>
                    </div>

                    {/* Right Section - Quick Actions, Notifications, Profile */}
                    <div className="flex items-center space-x-3">
                        {/* Quick Actions */}
                        <DropdownMenu>
                            <EnhancedTooltip content="Quick Actions - Create new items">
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="group relative overflow-hidden h-9 w-9 p-0 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                        style={{
                                            background: `
                                                 conic-gradient(
                                                     from 45deg at 50% 50%,
                                                     hsl(var(--accent)) 0deg,
                                                     hsl(var(--accent) / 0.7) 90deg,
                                                     hsl(var(--accent)) 180deg,
                                                     hsl(var(--accent) / 0.7) 270deg,
                                                     hsl(var(--accent)) 360deg
                                                 )
                                             `,
                                            boxShadow: `
                                                 0 0 20px hsl(var(--accent) / 0.3),
                                                 0 0 40px hsl(var(--accent) / 0.2),
                                                 0 0 0 1px hsl(var(--accent) / 0.4)
                                             `
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `
                                                 conic-gradient(
                                                     from 45deg at 50% 50%,
                                                     hsl(var(--accent)) 0deg,
                                                     hsl(var(--accent) / 0.8) 90deg,
                                                     hsl(var(--accent)) 180deg,
                                                     hsl(var(--accent) / 0.8) 270deg,
                                                     hsl(var(--accent)) 360deg
                                                 )
                                             `;
                                            e.currentTarget.style.boxShadow = `
                                                    0 0 30px hsl(var(--accent) / 0.5),
                                                    0 0 60px hsl(var(--accent) / 0.3),
                                                    0 0 0 1px hsl(var(--accent) / 0.6)
                                                `;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `
                                                 conic-gradient(
                                                     from 45deg at 50% 50%,
                                                     hsl(var(--accent)) 0deg,
                                                     hsl(var(--accent) / 0.7) 90deg,
                                                     hsl(var(--accent)) 180deg,
                                                     hsl(var(--accent) / 0.7) 270deg,
                                                     hsl(var(--accent)) 360deg
                                                 )
                                             `;
                                            e.currentTarget.style.boxShadow = `
                                                    0 0 20px hsl(var(--accent) / 0.3),
                                                    0 0 40px hsl(var(--accent) / 0.2),
                                                    0 0 0 1px hsl(var(--accent) / 0.4)
                                                `;
                                        }}
                                    >
                                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </EnhancedTooltip>
                            <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-xl border-r border-primary/30 overflow-hidden"
                                style={{
                                    boxShadow: `
                                    inset -2px 0 0 0 hsl(var(--accent-1) / 0.2),
                                    4px 0 20px hsl(var(--accent-1) / 0.1),
                                    8px 0 40px hsl(var(--accent-2) / 0.05),
                                    0 0 0 1px hsl(var(--accent-1) / 0.05)
                                `
                                }}>
                                {/* Background Effects - Matching sidebar */}
                                <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/10 to-primary/5" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl animate-pulse" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-2xl animate-pulse" />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex h-16 items-center justify-between px-4 border-b border-primary/30 relative z-10"
                                        style={{
                                            boxShadow: `
                                            0 2px 0 0 hsl(var(--accent-1) / 0.2),
                                            0 4px 15px hsl(var(--accent-1) / 0.1),
                                            0 0 0 1px hsl(var(--accent-1) / 0.05)
                                        `
                                        }}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative p-1.5 rounded-lg bg-gradient-to-r from-primary/30 to-accent/20">
                                                <Plus className="h-4 w-4 text-primary drop-shadow-glow" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg text-gradient-primary">Quick Actions</span>
                                                <span className="text-xs text-gradient-accent font-medium tracking-wide">Create new items</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-3 space-y-2 relative z-10">
                                        <DropdownMenuItem
                                            onClick={() => handleQuickAction('project')}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-primary/10 hover:border-primary/50 text-foreground/80 hover:text-foreground border-primary/20 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 20px hsl(var(--accent-1) / 0.2),
                                                0 0 40px hsl(var(--accent-2) / 0.1),
                                                0 4px 20px hsl(var(--accent-1) / 0.15),
                                                0 0 0 1px hsl(var(--accent-1) / 0.15)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-12">
                                                <FileText className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                            </div>
                                            <span className="truncate font-medium">New Project</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleQuickAction('todo')}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-primary/10 hover:border-primary/50 text-foreground/80 hover:text-foreground border-primary/20 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 20px hsl(var(--accent-1) / 0.2),
                                                0 0 40px hsl(var(--accent-2) / 0.1),
                                                0 4px 20px hsl(var(--accent-1) / 0.15),
                                                0 0 0 1px hsl(var(--accent-1) / 0.15)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-12">
                                                <CheckSquare className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                            </div>
                                            <span className="truncate font-medium">New ToDo</span>
                                        </DropdownMenuItem>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Notifications */}
                        <EnhancedTooltip content={`Notifications${notificationCount > 0 ? ` (${notificationCount} new)` : ''}`}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/interface/notifications')}
                                className="h-9 w-9 p-0 relative transition-all duration-300 shadow-lg hover:shadow-xl group"
                                style={{
                                    background: `
                                                conic-gradient(
                                                    from 45deg at 50% 50%,
                                                    hsl(var(--accent) / 0.4) 0deg,
                                                    hsl(var(--accent) / 0.2) 90deg,
                                                    hsl(var(--accent) / 0.4) 180deg,
                                                    hsl(var(--accent) / 0.2) 270deg,
                                                    hsl(var(--accent) / 0.4) 360deg
                                                )
                                            `,
                                    border: `1px solid hsl(var(--accent) / 0.4)`,
                                    boxShadow: `
                                                0 0 15px hsl(var(--accent) / 0.2),
                                                0 0 30px hsl(var(--accent) / 0.1),
                                                0 0 0 1px hsl(var(--accent) / 0.3)
                                            `
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `
                                                conic-gradient(
                                                    from 45deg at 50% 50%,
                                                    hsl(var(--accent) / 0.6) 0deg,
                                                    hsl(var(--accent) / 0.3) 90deg,
                                                    hsl(var(--accent) / 0.6) 180deg,
                                                    hsl(var(--accent) / 0.3) 270deg,
                                                    hsl(var(--accent) / 0.6) 360deg
                                                )
                                            `;
                                    e.currentTarget.style.border = `1px solid hsl(var(--accent) / 0.6)`;
                                    e.currentTarget.style.boxShadow = `
                                                0 0 25px hsl(var(--accent) / 0.3),
                                                0 0 50px hsl(var(--accent) / 0.2),
                                                0 0 0 1px hsl(var(--accent) / 0.5)
                                            `;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = `
                                                conic-gradient(
                                                    from 45deg at 50% 50%,
                                                    hsl(var(--accent) / 0.4) 0deg,
                                                    hsl(var(--accent) / 0.2) 90deg,
                                                    hsl(var(--accent) / 0.4) 180deg,
                                                    hsl(var(--accent) / 0.2) 270deg,
                                                    hsl(var(--accent) / 0.4) 360deg
                                                )
                                            `;
                                    e.currentTarget.style.border = `1px solid hsl(var(--accent) / 0.4)`;
                                    e.currentTarget.style.boxShadow = `
                                                0 0 15px hsl(var(--accent) / 0.2),
                                                0 0 30px hsl(var(--accent) / 0.1),
                                                0 0 0 1px hsl(var(--accent) / 0.3)
                                            `;
                                }}
                            >
                                <Bell className="h-4 w-4 text-accent-foreground/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:text-accent-foreground group-hover:animate-bell-vibrate transition-colors duration-300" />
                                {notificationCount > 0 && (
                                    <Badge
                                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/50 shadow-lg"
                                    >
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Badge>
                                )}
                            </Button>
                        </EnhancedTooltip>

                        {/* ScholarBot Button */}
                        <EnhancedTooltip content="Chat with ScholarBot - AI Research Assistant">
                            <button
                                onClick={() => setShowScholarBot(!showScholarBot)}
                                className={cn(
                                    "h-9 w-9 p-0 relative group transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg",
                                    showScholarBot && "scale-110"
                                )}
                            >
                                {/* ScholarBot image */}
                                <Image
                                    src="/assets/scholarbot.png"
                                    alt="ScholarBot"
                                    width={36}
                                    height={36}
                                    className="h-9 w-9 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:animate-pulse group-hover:scale-110 transition-all duration-300"
                                />

                                {/* Online indicator */}
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                            </button>
                        </EnhancedTooltip>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <EnhancedTooltip content={`Profile — ${accountData?.fullName || userData?.fullName || "User"}`}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-9 w-9 p-0 rounded-full border border-border/50 hover:border-border transition-all duration-300"
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage
                                                src={accountData?.avatarUrl || ""}
                                                alt="Profile"
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary-foreground">
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                            </EnhancedTooltip>
                            <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-xl border-r border-primary/30 overflow-hidden"
                                style={{
                                    boxShadow: `
                                    inset -2px 0 0 0 hsl(var(--accent-1) / 0.2),
                                    4px 0 20px hsl(var(--accent-1) / 0.1),
                                    8px 0 40px hsl(var(--accent-2) / 0.05),
                                    0 0 0 1px hsl(var(--accent-1) / 0.05)
                                `
                                }}>
                                {/* Background Effects - Matching sidebar */}
                                <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/10 to-primary/5" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl animate-pulse" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-2xl animate-pulse" />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex h-16 items-center justify-between px-4 border-b border-primary/30 relative z-10"
                                        style={{
                                            boxShadow: `
                                            0 2px 0 0 hsl(var(--accent-1) / 0.2),
                                            0 4px 15px hsl(var(--accent-1) / 0.1),
                                            0 0 0 1px hsl(var(--accent-1) / 0.05)
                                        `
                                        }}>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={accountData?.avatarUrl || ""}
                                                    alt="Profile"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary-foreground text-xs">
                                                    <User className="h-3 w-3" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg text-gradient-primary">{accountData?.fullName || userData?.fullName || "User"}</span>
                                                <EnhancedTooltip content={accountData?.email || userData?.email || "user@example.com"}>
                                                    <span className="text-xs text-gradient-accent font-medium tracking-wide truncate max-w-32 cursor-help">
                                                        {accountData?.email || userData?.email || "user@example.com"}
                                                    </span>
                                                </EnhancedTooltip>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-3 space-y-2 relative z-10">
                                        <DropdownMenuItem
                                            onClick={() => router.push('/interface/account')}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-primary/10 hover:border-primary/50 text-foreground/80 hover:text-foreground border-primary/20 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 20px hsl(var(--accent-1) / 0.2),
                                                0 0 40px hsl(var(--accent-2) / 0.1),
                                                0 4px 20px hsl(var(--accent-1) / 0.15),
                                                0 0 0 1px hsl(var(--accent-1) / 0.15)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-12">
                                                <User className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                            </div>
                                            <span className="truncate font-medium">Profile / Account</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => router.push('/interface/settings')}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-primary/10 hover:border-primary/50 text-foreground/80 hover:text-foreground border-primary/20 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 20px hsl(var(--accent-1) / 0.2),
                                                0 0 40px hsl(var(--accent-2) / 0.1),
                                                0 4px 20px hsl(var(--accent-1) / 0.15),
                                                0 0 0 1px hsl(var(--accent-1) / 0.15)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:animate-spin">
                                                <Settings className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                            </div>
                                            <span className="truncate font-medium">Settings</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={toggleTheme}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-primary/10 hover:border-primary/50 text-foreground/80 hover:text-foreground border-primary/20 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 20px hsl(var(--accent-1) / 0.2),
                                                0 0 40px hsl(var(--accent-2) / 0.1),
                                                0 4px 20px hsl(var(--accent-1) / 0.15),
                                                0 0 0 1px hsl(var(--accent-1) / 0.15)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 10px hsl(var(--accent-1) / 0.1),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px hsl(var(--accent-1) / 0.05)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-12">
                                                {settings.theme === 'dark' ? (
                                                    <Sun className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                                ) : (
                                                    <Moon className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-all duration-300" />
                                                )}
                                            </div>
                                            <span className="truncate font-medium">{settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-red-500/15 hover:border-red-500/60 text-red-500 hover:text-red-400 border-red-500/30 bg-background/20"
                                            style={{
                                                boxShadow: `
                                                0 0 15px rgba(239, 68, 68, 0.15),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px rgba(239, 68, 68, 0.1)
                                            `
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 25px rgba(239, 68, 68, 0.25),
                                                0 0 50px rgba(239, 68, 68, 0.1),
                                                0 4px 20px rgba(239, 68, 68, 0.2),
                                                0 0 0 1px rgba(239, 68, 68, 0.2)
                                            `
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = `
                                                0 0 15px rgba(239, 68, 68, 0.15),
                                                0 2px 8px rgba(0, 0, 0, 0.05),
                                                0 0 0 1px rgba(239, 68, 68, 0.1)
                                            `
                                            }}
                                        >
                                            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-red-500/15 group-hover:scale-110 group-hover:rotate-12">
                                                <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-400 transition-all duration-300" />
                                            </div>
                                            <span className="truncate font-medium">Logout</span>
                                        </DropdownMenuItem>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.header>

            {/* ScholarBot Chat Interface */}
            <AnimatePresence>
                {showScholarBot && (
                    <motion.div
                        ref={chatPanelRef}
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full bg-background/95 backdrop-blur-xl border-l border-pink-500/30 shadow-2xl z-50 flex flex-col"
                        style={{
                            width: `${chatWidth}px`,
                            boxShadow: `
                            -10px 0 30px rgba(236, 72, 153, 0.15),
                            -5px 0 15px rgba(168, 85, 247, 0.1),
                            -2px 0 10px rgba(59, 130, 246, 0.1),
                            0 0 0 1px rgba(236, 72, 153, 0.2)
                        `
                        }}
                    >
                        {/* Resize handle */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-pink-500/50 transition-colors z-50"
                            onMouseDown={handleChatMouseDown}
                        />
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.1),transparent_50%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-magenta-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-500/10 via-sky-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse" />

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between p-4 border-b border-pink-500/30 bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Image
                                        src="/assets/scholarbot.png"
                                        alt="ScholarBot"
                                        width={24}
                                        height={24}
                                        className="h-6 w-6"
                                    />
                                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        <span className="text-pink-400">S</span>
                                        <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">cholarBot</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground">AI Research Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefreshChat}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-purple-500/10"
                                    title="Refresh chat"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowScholarBot(false)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-purple-500/10"
                                    title="Close chat"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {message.type === 'bot' ? (
                                            <div className="relative">
                                                <Image
                                                    src="/assets/scholarbot.png"
                                                    alt="ScholarBot"
                                                    width={32}
                                                    height={32}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                                            </div>
                                        ) : (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={accountData?.avatarUrl || ""}
                                                    alt="User"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary-foreground text-xs">
                                                    <User className="h-3 w-3" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl px-4 py-3 shadow-lg",
                                            message.type === 'user'
                                                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 text-white"
                                                : "bg-background/50 backdrop-blur-sm border border-pink-500/20"
                                        )}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-line">
                                            {message.type === 'bot' && message.content.includes("ScholarBot") ? (
                                                message.content.split("ScholarBot").map((part, index, array) => {
                                                    if (index === 0) return part;
                                                    return (
                                                        <span key={index}>
                                                            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 bg-clip-text text-transparent font-semibold">
                                                                ScholarBot
                                                            </span>
                                                            {part}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                message.content
                                            )}
                                        </p>
                                        <p className={cn(
                                            "text-xs mt-2",
                                            message.type === 'user' ? "text-purple-100" : "text-muted-foreground"
                                        )}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    {/* ScholarBot Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            <Image
                                                src="/assets/scholarbot.png"
                                                alt="ScholarBot"
                                                width={32}
                                                height={32}
                                                className="h-8 w-8 rounded-full"
                                            />
                                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                                        </div>
                                    </div>

                                    {/* Typing Indicator */}
                                    <div className="bg-background/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl px-4 py-3 shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">ScholarBot is typing...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="relative z-10 p-4 border-t border-pink-500/30 bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask ScholarBot anything about research..."
                                        className="w-full min-h-[40px] max-h-32 px-4 py-2 bg-background/50 border border-pink-500/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-sm placeholder:text-muted-foreground"
                                        style={{
                                            boxShadow: `
                                            0 0 10px rgba(236, 72, 153, 0.15),
                                            0 0 20px rgba(168, 85, 247, 0.1),
                                            0 0 0 1px rgba(236, 72, 153, 0.2)
                                        `
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isTyping}
                                    size="sm"
                                    className="h-10 w-10 p-0 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 hover:from-pink-600 hover:via-purple-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
