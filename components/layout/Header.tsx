"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    GraduationCap
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getUserData } from "@/lib/api/user-service/auth"
import { accountApi } from "@/lib/api/user-service"
import { UserAccount } from "@/types/account"
import { cn } from "@/lib/utils/cn"
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip"
import { useSettings } from "@/contexts/SettingsContext"

interface BreadcrumbItem {
    label: string
    href?: string
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
        return [{ label: 'Home' }]
    }

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ''

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`

        // Map segment to readable label
        let label = segment.charAt(0).toUpperCase() + segment.slice(1)

        // Special cases for better labels
        if (segment === 'interface') label = 'Dashboard'
        if (segment === 'account') label = 'Account'
        if (segment === 'projects') label = 'Projects'
        if (segment === 'todo') label = 'ToDo'
        if (segment === 'call4paper') label = 'Call4Paper'

        breadcrumbs.push({
            label,
            href: index === segments.length - 1 ? undefined : currentPath
        })
    })

    return breadcrumbs
}

const getPageIcon = (pathname: string) => {
    if (pathname.includes('/settings')) return Settings
    if (pathname.includes('/account')) return User
    if (pathname.includes('/projects')) return FileText
    if (pathname.includes('/todo')) return CheckSquare
    if (pathname.includes('/call4paper')) return GraduationCap
    return Home
}

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const userData = getUserData()
    const { settings, updateSetting } = useSettings()

    const [searchQuery, setSearchQuery] = useState("")
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [notifications] = useState(3) // Mock notification count
    const [accountData, setAccountData] = useState<UserAccount | null>(null)

    // Fetch account data to get profile picture
    useEffect(() => {
        const loadAccountData = async () => {
            try {
                const account = await accountApi.getAccount()
                setAccountData(account)
            } catch (error) {
                console.error("Failed to load account data for header:", error)
            }
        }

        loadAccountData()
    }, [])

    const breadcrumbs = getBreadcrumbs(pathname)
    const PageIcon = getPageIcon(pathname)

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

    return (
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
                                        <span className="font-medium text-foreground">{crumb.label}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Center Section - Global Search */}
                <div className="flex-1 max-w-2xl mx-8">
                    <form onSubmit={handleSearch} className="relative">
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
                    </form>
                </div>

                {/* Right Section - Quick Actions, Notifications, Profile */}
                <div className="flex items-center space-x-3">
                    {/* Quick Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="group relative overflow-hidden h-9 w-9 p-0 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                            </Button>
                        </DropdownMenuTrigger>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 relative bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-primary/30 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl group"
                            >
                                <Bell className="h-4 w-4 text-primary-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:animate-bell-vibrate" />
                                {notifications > 0 && (
                                    <Badge
                                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/50 shadow-lg"
                                    >
                                        {notifications > 9 ? '9+' : notifications}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 bg-card/90 backdrop-blur-xl border border-border shadow-xl">
                            <DropdownMenuLabel className="text-foreground">Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-4 text-center text-muted-foreground">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No new notifications</p>
                                <p className="text-xs mt-1">You're all caught up!</p>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile Dropdown */}
                    <DropdownMenu>
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
    )
}
