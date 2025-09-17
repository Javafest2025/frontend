"use client"

import { usePathname, useRouter } from "next/navigation"

import { useState, useEffect } from "react"
import {
    BookOpen,

    ChevronLeft,
    ChevronRight,

    ArrowLeft,
    Sparkles,
    Database,
    Zap,

    MessageSquare,

    FileText
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { isValidUUID } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip"

import { projectsApi } from "@/lib/api/project-service"
import { Project } from "@/types/project"
import { useLoading } from "@/contexts/LoadingContext"

type Props = {
    readonly projectId: string
    readonly collapsed: boolean
    readonly onToggle: () => void
    readonly className?: string
}

const PROJECT_NAV_ITEMS = [
    {
        name: "Overview",
        href: "/overview",
        icon: Sparkles,
        description: "Project details, stats, and information",
        loadingMessage: "Loading project overview..."
    },
    {
        name: "Collect Papers",
        href: "/collect-papers",
        icon: Zap,
        description: "Search and upload research papers",
        loadingMessage: "Loading paper collection tools..."
    },
    {
        name: "Library",
        href: "/library",
        icon: Database,
        description: "Research paper library and management",
        loadingMessage: "Loading research library..."
    },
    {
        name: "Reading List",
        href: "/reading-list",
        icon: BookOpen,
        description: "Curated reading list and paper recommendations",
        loadingMessage: "Loading reading list..."
    },
    {
        name: "Quick Notes",
        href: "/notes",
        icon: MessageSquare,
        description: "Project notes and documentation",
        loadingMessage: "Loading project notes..."
    },
    {
        name: "Latex Editor",
        href: "/latex-editor",
        icon: FileText,
        description: "LaTeX document editor for research papers",
        loadingMessage: "Loading LaTeX editor..."
    },
]

const PROJECT_BOTTOM_ITEMS: typeof PROJECT_NAV_ITEMS = []

export function ProjectSidebar({ projectId, collapsed, onToggle, className }: Props) {
    const pathname = usePathname()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { showPageLoading, hidePageLoading } = useLoading()

    // Load project data
    useEffect(() => {
        loadProject()
    }, [projectId])

    const loadProject = async () => {
        // Validate project ID before making API calls
        if (!isValidUUID(projectId)) {
            console.error('Invalid project ID in ProjectSidebar:', projectId)
            return
        }

        try {
            setIsLoading(true)
            const projectData = await projectsApi.getProject(projectId)
            setProject(projectData)
        } catch (error) {
            console.error('Error loading project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExitProject = () => {
        showPageLoading("Returning to home dashboard...")
        setTimeout(() => {
            router.push('/interface/home')
            setTimeout(() => {
                hidePageLoading()
            }, 500)
        }, 100)
    }

    const handleNavigation = (href: string, loadingMessage: string) => {
        const fullPath = getProjectPath(href)
        // Don't show loading if we're already on the same page
        if (pathname === fullPath) return

        showPageLoading(loadingMessage)

        // Add a small delay to ensure the loading indicator shows
        setTimeout(() => {
            router.push(fullPath)
            // Hide loading after navigation completes
            setTimeout(() => {
                hidePageLoading()
            }, 500)
        }, 100)
    }

    const getProjectPath = (href: string) => `/interface/projects/${projectId}${href}`

    // Get unique hover animation class for each icon
    const getIconHoverAnimation = (iconName: string) => {
        switch (iconName) {
            case "Overview":
                return "group-hover:animate-pulse group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]"
            case "Collect Papers":
                return "group-hover:animate-jelly"
            case "Library":
                return "group-hover:animate-spin-slow"
            case "Reading List":
                return "group-hover:animate-float"
            case "Quick Notes":
                return "group-hover:animate-wiggle"
            case "Latex Editor":
                return "group-hover:animate-tilt group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]"
            default:
                return "group-hover:scale-105"
        }
    }

    const SidebarItem = ({ item, isBottom = false }: { item: typeof PROJECT_NAV_ITEMS[0] | typeof PROJECT_BOTTOM_ITEMS[0], isBottom?: boolean }) => {
        const fullPath = getProjectPath(item.href)
        const isActive = pathname === fullPath

        const content = (
            <button
                onClick={() => handleNavigation(item.href, item.loadingMessage)}
                className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left",
                    "hover:bg-primary/10 hover:border-primary/50",
                    isActive
                        ? "bg-gradient-to-r from-primary/20 to-accent/10 text-primary border-primary/50"
                        : "text-foreground/80 hover:text-foreground border-primary/20 bg-background/20",
                    collapsed && "justify-center px-2"
                )}
                style={isActive ? {
                    boxShadow: `
                        0 0 25px hsl(var(--primary) / 0.4),
                        0 0 50px hsl(var(--accent) / 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        0 6px 25px hsl(var(--primary) / 0.25),
                        0 0 0 1px hsl(var(--primary) / 0.2)
                    `
                } : {
                    boxShadow: `
                        0 0 10px hsl(var(--primary) / 0.1),
                        0 2px 8px rgba(0, 0, 0, 0.1),
                        0 0 0 1px hsl(var(--primary) / 0.05)
                    `
                }}
                onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.boxShadow = `
                            0 0 20px hsl(var(--primary) / 0.25),
                            0 0 40px hsl(var(--accent) / 0.15),
                            0 4px 20px hsl(var(--primary) / 0.2),
                            0 0 0 1px hsl(var(--primary) / 0.15)
                        `
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.boxShadow = `
                            0 0 10px hsl(var(--primary) / 0.1),
                            0 2px 8px rgba(0, 0, 0, 0.1),
                            0 0 0 1px hsl(var(--primary) / 0.05)
                        `
                    }
                }}
            >
                <div className={cn(
                    "relative p-1.5 rounded-lg transition-all duration-300",
                    isActive
                        ? "bg-gradient-to-r from-primary/30 to-accent/20"
                        : "group-hover:bg-primary/10"
                )}>
                    <item.icon className={cn(
                        "h-4 w-4 transition-all duration-300",
                        isActive
                            ? "text-primary drop-shadow-glow"
                            : "text-foreground/70 group-hover:text-primary",
                        !isActive && getIconHoverAnimation(item.name)
                    )} />
                </div>
                {!collapsed && (
                    <span className="truncate font-medium">{item.name}</span>
                )}
                {isActive && !collapsed && (
                    <div className="absolute right-3 w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/50" />
                )}
            </button>
        )

        if (collapsed) {
            return (
                <EnhancedTooltip
                    content={`${item.name}: ${item.description}`}
                    side="right"
                >
                    {content}
                </EnhancedTooltip>
            )
        }

        return content
    }

    return (
        <div className={cn(
            "flex h-screen flex-col bg-background/60 backdrop-blur-xl border-r border-primary/30 transition-all duration-300 relative overflow-hidden",
            collapsed ? "w-12" : "w-56",
            className
        )}
            style={{
                boxShadow: `
                        inset -2px 0 0 0 hsl(var(--primary) / 0.4),
                        4px 0 20px hsl(var(--primary) / 0.2),
                        8px 0 40px hsl(var(--accent) / 0.1),
                        0 0 60px hsl(var(--primary) / 0.05),
                        0 0 0 1px hsl(var(--primary) / 0.1)
                    `
            }}>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background/30 to-accent/3" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/8 to-transparent rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/8 to-transparent rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-pulse duration-3000" />

            {/* Header */}
            <div className={cn(
                "flex h-16 items-center justify-between px-4 border-b border-primary/30 relative z-10",
                collapsed && "px-2"
            )}
                style={{
                    boxShadow: `
                        0 2px 0 0 hsl(var(--primary) / 0.4),
                        0 4px 15px hsl(var(--primary) / 0.15),
                        0 8px 30px hsl(var(--accent) / 0.08),
                        0 0 0 1px hsl(var(--primary) / 0.1)
                    `
                }}>
                {!collapsed && (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 gradient-radial-accent rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 relative overflow-hidden">
                            {/* Background shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse duration-2000" />

                            {/* Custom Research Icon */}
                            <svg
                                className="h-6 w-6 text-white drop-shadow-glow relative z-10"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Book/Document base */}
                                <path
                                    d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z"
                                    fill="currentColor"
                                    fillOpacity="0.3"
                                />
                                <path
                                    d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    fill="none"
                                />

                                {/* Inner content lines */}
                                <path
                                    d="M8 10h8M8 14h6"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />

                                {/* Sparkle/Star element for innovation */}
                                <g transform="translate(15, 3)">
                                    <path
                                        d="M3 0l1 2h2l-1.5 1.5L5.5 6 3 4.5 0.5 6l1-2.5L0 2h2l1-2z"
                                        fill="currentColor"
                                        className="animate-pulse"
                                    />
                                </g>

                                {/* Small research molecule/network element */}
                                <g transform="translate(2, 2)" opacity="0.7">
                                    <circle cx="1" cy="1" r="0.5" fill="currentColor" />
                                    <circle cx="3" cy="0.5" r="0.5" fill="currentColor" />
                                    <circle cx="2.5" cy="2.5" r="0.5" fill="currentColor" />
                                    <path d="M1.5 1.5L2.5 0.5M1.5 1.5L2 2" stroke="currentColor" strokeWidth="0.5" />
                                </g>
                            </svg>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <div
                                className="font-bold text-sm text-gradient-primary leading-tight max-h-12 overflow-hidden"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word'
                                }}
                                title={project?.name || "Project"}
                            >
                                {isLoading ? "Loading..." : project?.name || "Project"}
                            </div>
                            <span className="text-xs text-muted-foreground">Research Project</span>
                        </div>
                    </div>
                )}

                {collapsed ? (
                    <EnhancedTooltip
                        content="Expand Sidebar: Show project navigation"
                        side="right"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggle}
                            className="h-8 w-8 p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg mx-auto"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </EnhancedTooltip>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="h-8 w-8 p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 p-3 relative z-10 overflow-y-auto custom-scrollbar">
                {!collapsed && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                            Project Navigation
                        </h3>
                    </div>
                )}

                {PROJECT_NAV_ITEMS.map((item) => (
                    <SidebarItem key={item.name} item={item} />
                ))}

                {/* Separator */}
                <div className="my-4 px-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </div>

                {PROJECT_BOTTOM_ITEMS.map((item) => (
                    <SidebarItem key={item.name} item={item} isBottom />
                ))}
            </nav>

            {/* Exit Project Button at Bottom */}
            <div className="p-3 border-t border-primary/30 relative z-10 mt-auto"
                style={{
                    boxShadow: `
                        0 -2px 0 0 hsl(var(--primary) / 0.4),
                        0 -4px 15px hsl(var(--primary) / 0.15),
                        0 -8px 30px hsl(var(--accent) / 0.08),
                        0 0 0 1px hsl(var(--primary) / 0.1)
                    `
                }}>
                {collapsed ? (
                    <EnhancedTooltip
                        content="Exit Project: Return to main interface"
                        side="right"
                    >
                        <Button
                            onClick={handleExitProject}
                            variant="outline"
                            size="sm"
                            className="w-full px-2 bg-gradient-to-r from-primary/10 via-accent/10 to-accent/10 border-primary/20 text-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:via-accent/20 hover:to-accent/20 hover:border-primary/40 hover:text-primary transition-all duration-300"
                            style={{
                                boxShadow: `
                                        0 0 10px hsl(var(--primary) / 0.15),
                                        0 0 20px hsl(var(--accent) / 0.08),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                    `
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `
                                        0 0 20px hsl(var(--primary) / 0.3),
                                        0 0 40px hsl(var(--accent) / 0.15),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                        0 4px 20px hsl(var(--primary) / 0.15)
                                    `
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = `
                                        0 0 10px hsl(var(--primary) / 0.15),
                                        0 0 20px hsl(var(--accent) / 0.08),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                    `
                            }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </EnhancedTooltip>
                ) : (
                    <Button
                        onClick={handleExitProject}
                        variant="outline"
                        size="default"
                        className="w-full bg-gradient-to-r from-primary/10 via-accent/10 to-accent/10 border-primary/20 text-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:via-accent/20 hover:to-accent/20 hover:border-primary/40 hover:text-primary transition-all duration-300"
                        style={{
                            boxShadow: `
                                    0 0 10px hsl(var(--primary) / 0.15),
                                    0 0 20px hsl(var(--accent) / 0.08),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                `
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `
                                    0 0 20px hsl(var(--primary) / 0.3),
                                    0 0 40px hsl(var(--accent) / 0.15),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                    0 4px 20px hsl(var(--primary) / 0.15)
                                `
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `
                                    0 0 10px hsl(var(--primary) / 0.15),
                                    0 0 20px hsl(var(--accent) / 0.08),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                `
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="ml-2">Exit Project</span>
                    </Button>
                )}
            </div>

        </div>
    )
} 